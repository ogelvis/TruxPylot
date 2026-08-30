'use client';
import { useRouter } from 'next/navigation';

export function SignOutLink() {
  const router = useRouter();
  return (
    <a
      href="/login"
      onClick={async (e) => {
        e.preventDefault();
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
        router.refresh();
      }}
    >
      Sign out
    </a>
  );
}
