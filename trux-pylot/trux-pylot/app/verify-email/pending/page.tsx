import { redirect } from 'next/navigation';
import { getSession, dashboardPath } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { VerificationPendingActions } from '@/components/verification-pending-actions';
import { SignOutLink } from '@/components/sign-out-link';

export default async function VerifyEmailPending() {
  const session = await getSession();
  if (!session) redirect('/login');

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) redirect('/login');
  if (user.emailVerifiedAt) redirect(dashboardPath(user.role));

  return (
    <main className="auth-page">
      <section className="auth-aside">
        <img src="/trux-pylot-logo.png" alt="Trux Pylot" />
        <h1>Almost there.</h1>
        <p>One quick step keeps your account, jobs and payments secure.</p>
      </section>
      <section className="auth-main">
        <div className="auth-form verify-pending">
          <p className="eyebrow">VERIFY YOUR EMAIL</p>
          <h1>Check your inbox</h1>
          <p>We&apos;ve sent a verification link to <b>{user.email}</b>. Click it to activate your account.</p>
          <VerificationPendingActions email={user.email} />
          <p className="auth-switch"><SignOutLink /></p>
        </div>
      </section>
    </main>
  );
}
