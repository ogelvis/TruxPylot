import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import type { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const key = () => {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET is required');
  return new TextEncoder().encode(secret);
};

export type Session = { userId: string; role: Role; email: string; deviceId?: string; twoFactorVerified?: boolean };

export type AuthChallenge = { userId: string; role: Role; email: string; purpose: string };

export async function createSession(session: Session) {
  return new SignJWT(session)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key());
}

export async function getSession(): Promise<Session | null> {
  try {
    const token = (await cookies()).get('tp_session')?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, key(), { algorithms: ['HS256'] });
    if (!payload.userId || !payload.email || !payload.role) return null;
    return {
      userId: String(payload.userId),
      role: payload.role as Role,
      email: String(payload.email),
      deviceId: payload.deviceId ? String(payload.deviceId) : undefined,
      twoFactorVerified: payload.twoFactorVerified === true,
    };
  } catch {
    return null;
  }
}

export function dashboardPath(role: Role) {
  return role === 'ADMIN' || role === 'SUPER_ADMIN'
    ? '/dashboard/admin'
    : role === 'PROFESSIONAL'
      ? '/dashboard/professional'
      : role === 'EDITOR' || role === 'OPERATOR'
        ? '/operations'
        : '/dashboard/customer';
}

export function isAdminRole(role: Role) {
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

export async function createAuthChallenge(challenge: AuthChallenge) {
  return new SignJWT(challenge).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('10m').sign(key());
}

export async function verifyAuthChallenge(token: string): Promise<AuthChallenge | null> {
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ['HS256'] });
    if (!payload.userId || !payload.email || !payload.role || !payload.purpose) return null;
    return { userId: String(payload.userId), role: payload.role as Role, email: String(payload.email), purpose: String(payload.purpose) };
  } catch { return null; }
}

export async function requireAdminSession() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) return null;
  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { status: true, suspendedUntil: true, role: true, securityProfile: { select: { twoFactorEnabled: true } } } });
  if (!user || !isAdminRole(user.role) || user.status !== 'ACTIVE' || (user.suspendedUntil && user.suspendedUntil > new Date())) return null;
  // 2FA is optional for administrators. When an admin has enabled it, the login flow
  // creates a verified session before reaching protected control-center actions.
  if (user.securityProfile?.twoFactorEnabled && !session.twoFactorVerified) return null;
  return session;
}

export async function requireOperationsSession() {
  const session = await getSession();
  if (!session || !['EDITOR', 'OPERATOR'].includes(session.role)) return null;
  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { status: true, suspendedUntil: true, role: true } });
  if (!user || !['EDITOR','OPERATOR'].includes(user.role) || user.status !== 'ACTIVE' || (user.suspendedUntil && user.suspendedUntil > new Date())) return null;
  return session;
}
