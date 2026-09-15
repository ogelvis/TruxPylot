import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';
import { hashPassword, hashSecurityAnswer, createDeviceToken, ensureDevice, deviceHash, recordLoginAttempt } from '@/lib/security';
import { createSession, dashboardPath } from '@/lib/auth';
import { attributeReferral } from '@/lib/referrals';
import { writeAuditLog } from '@/lib/audit';
import { getSupabaseAuthUserById, createSupabaseAuthUser, deleteSupabaseAuthUser } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

const input = z.object({
  email: z.string().email(), fullName: z.string().min(2).max(160),
  role: z.enum(['CUSTOMER', 'PROFESSIONAL']), accountType: z.enum(['INDIVIDUAL', 'BUSINESS']).default('INDIVIDUAL'),
  businessName: z.string().max(160).optional(), registrationNumber: z.string().max(60).optional(),
  phone: z.string().min(7).max(30).optional(), country: z.string().max(80).optional(), state: z.string().max(80).optional(), city: z.string().max(80).optional(), area: z.string().max(120).optional(), street: z.string().max(200).optional(), profession: z.string().max(120).optional(), yearsExperience: z.coerce.number().int().min(0).max(60).optional(), referralCode: z.string().max(40).optional(),
  password: z.string().min(8).max(200).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/), confirmPassword: z.string().min(8).max(200),
  securityQuestion: z.string().min(5).max(200), securityAnswer: z.string().min(2).max(200), privacyAccepted: z.literal(true), privacyPolicyVersion: z.string().max(40),
});

export async function POST(request: Request) {
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Please check your details and try again.' }, { status: 400 });
  const d = parsed.data; const email = d.email.trim().toLowerCase();
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
  const limit = rateLimit(`register:${email}:${ip}`, 5, 15 * 60 * 1000);
  if (!limit.allowed) return NextResponse.json({ error: 'Too many registration attempts. Please wait and try again.' }, { status: 429 });
  if (d.password !== d.confirmPassword) return NextResponse.json({ error: 'Passwords do not match.' }, { status: 400 });
  if (d.accountType === 'BUSINESS' && (!d.businessName?.trim() || !d.registrationNumber?.trim())) return NextResponse.json({ error: 'Business name and registration number are required for a business account.' }, { status: 400 });

  let existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    try {
      const authState = await getSupabaseAuthUserById(existing.id);
      if (!authState.missing) return NextResponse.json({ error: 'That email is already registered. Try signing in instead.' }, { status: 409 });
      await prisma.user.update({ where: { id: existing.id }, data: { status: 'DELETED', deletedAt: new Date(), deletedEmail: existing.email, deletedPhone: existing.phone, deletedGoogleSubject: existing.googleSubject, email: `deleted-${existing.id}@deleted.truxpylot.invalid`, phone: null, googleSubject: null, suspendedUntil: null, suspensionReason: 'Account deleted in Supabase Auth' } });
    } catch (error) {
      console.error('[register] Supabase account reconciliation failed:', error instanceof Error ? error.message : error);
      return NextResponse.json({ error: 'We could not verify the status of this account right now. Please try again shortly.' }, { status: 503 });
    }
  }

  let authUserId: string | null = null;
  try {
    const authUser = await createSupabaseAuthUser({ email, password: d.password, emailConfirm: false, userMetadata: { fullName: d.fullName, role: d.role, accountType: d.accountType } });
    authUserId = authUser.id;
    const location = [d.area, d.city, d.state].filter(Boolean).join(', ') || undefined;
    const user = await prisma.user.create({
      data: {
        id: authUser.id, email, role: d.role, authProvider: 'password', privacyPolicyVersion: d.privacyPolicyVersion, privacyAcceptedAt: new Date(), phone: d.phone || undefined,
        customer: d.role === 'CUSTOMER' ? { create: { fullName: d.fullName, accountType: d.accountType, businessName: d.businessName, registrationNumber: d.registrationNumber, country: d.country, state: d.state, city: d.city, area: d.area, street: d.street, location } } : undefined,
        professional: d.role === 'PROFESSIONAL' ? { create: { fullName: d.fullName, accountType: d.accountType, businessName: d.businessName, registrationNumber: d.registrationNumber, country: d.country, state: d.state, city: d.city, area: d.area, street: d.street, location, profession: d.profession, yearsExperience: d.yearsExperience } } : undefined,
        securityProfile: { create: { passwordHash: hashPassword(d.password), securityReminderSeenAt: null } },
        securityQuestions: { create: { question: d.securityQuestion, answerHash: hashSecurityAnswer(d.securityAnswer) } },
      },
    });
    await writeAuditLog({ userId: user.id, action: 'PRIVACY_POLICY_ACCEPTED', entity: 'PrivacyPolicy', entityId: user.id, data: { version: d.privacyPolicyVersion, acceptedAt: new Date().toISOString() } }).catch(() => {});
    if (d.referralCode) await attributeReferral(d.referralCode, user.id, { role: d.role, email }).catch(error => console.error('[register] referral attribution failed:', error instanceof Error ? error.message : error));
    const deviceToken = request.headers.get('cookie')?.match(/(?:^|;\s*)tp_device=([^;]+)/)?.[1] || createDeviceToken();
    const device = await ensureDevice(user.id, deviceToken, request);
    await recordLoginAttempt({ userId: user.id, email, action: 'REGISTRATION_PASSWORD', success: true, riskLevel: 'NORMAL', request, deviceFingerprint: deviceHash(deviceToken) });
    const session = await createSession({ userId: user.id, role: user.role, email: user.email, deviceId: device.id, twoFactorVerified: false });
    const response = NextResponse.json({ ok: true, redirect: dashboardPath(user.role), emailVerificationPending: true });
    response.cookies.set('tp_session', session, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 604800 });
    response.cookies.set('tp_device', device.token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 31536000 });
    return response;
  } catch (error) {
    if (authUserId) await deleteSupabaseAuthUser(authUserId).catch(cleanupError => console.error('[register] Supabase cleanup failed:', cleanupError instanceof Error ? cleanupError.message : cleanupError));
    const message = error instanceof Error ? error.message : '';
    if (/already registered|already exists|duplicate/i.test(message)) return NextResponse.json({ error: 'That email is already registered. Try signing in instead.' }, { status: 409 });
    console.error('[register] account creation failed:', error);
    return NextResponse.json({ error: 'Could not create your account right now. Please try again.' }, { status: 500 });
  }
}
