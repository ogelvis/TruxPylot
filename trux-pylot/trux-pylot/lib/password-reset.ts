import { randomBytes, createHash } from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendMail } from '@/lib/email';

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour — shorter-lived than email verification

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function resetEmailHtml(link: string) {
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px">
      <h2 style="color:#073fc8">Reset your password</h2>
      <p>We received a request to reset your Trux Pylot password. Click below to choose a new one.</p>
      <p><a href="${link}" style="display:inline-block;background:#073fc8;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Reset password</a></p>
      <p style="color:#6d7890;font-size:13px">This link expires in 1 hour. If you didn't request this, you can safely ignore this email — your password won't change.</p>
    </div>
  `;
}

export async function issuePasswordReset(email: string, baseUrl: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  // Always behave the same whether or not the account exists, so this
  // endpoint can't be used to check which emails are registered.
  if (!user) return;

  const token = randomBytes(32).toString('hex');
  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + TOKEN_TTL_MS) },
  });
  const link = `${baseUrl}/reset-password?token=${token}`;
  await sendMail(user.email, 'Reset your Trux Pylot password', resetEmailHtml(link));
}

export async function validateResetToken(token: string) {
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!record || record.expiresAt < new Date()) return null;
  return record.userId;
}

export async function consumeResetToken(token: string, newPasswordHash: string) {
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!record || record.expiresAt < new Date()) return null;
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash: newPasswordHash } }),
    prisma.passwordResetToken.deleteMany({ where: { userId: record.userId } }),
  ]);
  return record.userId;
}
