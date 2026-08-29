import { SignJWT, jwtVerify } from 'jose';

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID;

export type VerifyChannel = 'sms' | 'whatsapp' | 'call';

function twilioAuthHeader() {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) throw new Error('Twilio credentials are not configured');
  return 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
}

export function isValidPhone(value: string) {
  return /^\+[1-9]\d{6,14}$/.test(value);
}

/** Starts a Twilio Verify verification. channel: sms | whatsapp | call. */
export async function startPhoneVerification(phone: string, channel: VerifyChannel) {
  if (!TWILIO_VERIFY_SERVICE_SID) throw new Error('TWILIO_VERIFY_SERVICE_SID is not configured');

  const params = new URLSearchParams({ To: phone, Channel: channel });
  const res = await fetch(`https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/Verifications`, {
    method: 'POST',
    headers: { Authorization: twilioAuthHeader(), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Could not send verification code');
  return data as { status: string; sid: string; channel: string; to: string };
}

/** Checks the code the user typed in against Twilio. */
export async function checkPhoneVerification(phone: string, code: string) {
  if (!TWILIO_VERIFY_SERVICE_SID) throw new Error('TWILIO_VERIFY_SERVICE_SID is not configured');

  const params = new URLSearchParams({ To: phone, Code: code });
  const res = await fetch(`https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`, {
    method: 'POST',
    headers: { Authorization: twilioAuthHeader(), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Could not check verification code');
  return data as { status: string; to: string };
}

// --- Phone verification ticket ---
// After Twilio approves a code, we hand the client a short-lived signed
// ticket (same JWT approach as tp_session in lib/auth.ts) instead of a bare
// boolean. This stops a client from just claiming a phone is verified when
// it calls /api/auth/register or /api/auth/phone/login — the server can
// prove the phone was actually approved by Twilio a few minutes ago.

const key = () => {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET is required');
  return new TextEncoder().encode(secret);
};

export async function issuePhoneTicket(phone: string) {
  return new SignJWT({ phone, purpose: 'phone-verified' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(key());
}

/** Returns the verified phone number if the ticket is valid and unexpired, else null. */
export async function readPhoneTicket(ticket: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(ticket, key());
    if (payload.purpose !== 'phone-verified' || typeof payload.phone !== 'string') return null;
    return payload.phone;
  } catch {
    return null;
  }
}
