import nodemailer from 'nodemailer';

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (transporter) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

export async function sendMail(to: string, subject: string, html: string) {
  const t = getTransporter();
  const from = process.env.SMTP_FROM || 'Trux Pylot <no-reply@truxpylot.co>';
  if (!t) {
    // SMTP isn't configured yet — don't silently pretend to succeed.
    console.warn(`[email] SMTP not configured. Would have sent "${subject}" to ${to}.`);
    return { sent: false as const, reason: 'not_configured' as const };
  }
  try {
    await t.sendMail({ from, to, subject, html });
    return { sent: true as const };
  } catch (err) {
    // Never let a provider rejection (bad credentials, unverified sender,
    // etc.) crash the request that triggered it — but log it clearly so
    // it's actually diagnosable in Render's log output.
    console.error(`[email] Failed to send "${subject}" to ${to}:`, err instanceof Error ? err.message : err);
    return { sent: false as const, reason: 'send_failed' as const };
  }
}

export function verificationEmailHtml(link: string) {
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px">
      <h2 style="color:#073fc8">Verify your email</h2>
      <p>Thanks for joining Trux Pylot. Confirm your email address to activate your account.</p>
      <p><a href="${link}" style="display:inline-block;background:#073fc8;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Verify email address</a></p>
      <p style="color:#6d7890;font-size:13px">This link expires in 24 hours. If you didn't create a Trux Pylot account, you can ignore this email.</p>
    </div>
  `;
}
