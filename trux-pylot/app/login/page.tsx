import { AuthForm } from '@/components/auth-form';

export default async function Login({ searchParams }: { searchParams: Promise<{ blocked?: string }> }) {
  const { blocked } = await searchParams;
  const notice = blocked ? 'This account cannot sign in right now. Contact support if you believe this is a mistake.' : null;

  return <main className="auth-page"><section className="auth-aside"><img src="/trux-pylot-logo.png" alt="Trux Pylot"/><h1>Good work<br/>starts with trust.</h1><p>One reliable place for jobs, verified professionals and secure payments.</p></section><section className="auth-main"><div className="auth-form-wrap">{notice && <p className="login-notice">{notice}</p>}<AuthForm/></div></section></main>;
}
