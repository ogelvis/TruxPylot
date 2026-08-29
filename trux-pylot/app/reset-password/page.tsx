import { Suspense } from 'react';
import { ResetPasswordForm } from '@/components/reset-password-form';

export default function ResetPassword() {
  return (
    <main className="auth-page">
      <section className="auth-aside">
        <img src="/trux-pylot-logo.png" alt="Trux Pylot" />
        <h1>Almost<br />there.</h1>
        <p>Choose a new password to get back into your account.</p>
      </section>
      <section className="auth-main">
        <Suspense fallback={<div className="auth-form" />}>
          <ResetPasswordForm />
        </Suspense>
      </section>
    </main>
  );
}
