import { randomBytes, createHash } from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendMail, verificationEmailHtml } from '@/lib/email';

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export async function issueVerificationEmail(userId: string, email: string, baseUrl: string) {
  const token = randomBytes(32).toString('hex');
  await prisma.emailVerificationToken.create({
    data: { userId, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + TOKEN_TTL_MS) },
  });
  const link = `${baseUrl}/api/auth/verify-email?token=${token}`;
  return sendMail(email, 'Verify your Trux Pylot email', verificationEmailHtml(link));
}

export async function consumeVerificationToken(token: string) {
  const tokenHash = hashToken(token);
  const record = await prisma.emailVerificationToken.findUnique({ where: { tokenHash } });
  if (!record || record.expiresAt < new Date()) return null;
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: new Date() } }),
    prisma.emailVerificationToken.deleteMany({ where: { userId: record.userId } }),
  ]);
  return record.userId;
}
