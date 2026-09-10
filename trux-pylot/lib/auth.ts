import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { Role } from '@prisma/client';

const key = () => {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET is required');
  return new TextEncoder().encode(secret);
};

export type Session = { userId: string; role: Role; email: string };

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

export async function requireAdminSession() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) return null;
  return session;
}

export async function requireOperationsSession() {
  const session = await getSession();
  if (!session || !['EDITOR', 'OPERATOR'].includes(session.role)) return null;
  return session;
}
