'use client';

import { useRouter } from 'next/navigation';

export function SignOutLink() {
  const router = useRouter();

  async function handleSignOut() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
      });
    } finally {
      router.push('/');
      router.refresh();
    }
  }

  return (
    <a href="/" onClick={(event) => { event.preventDefault(); void handleSignOut(); }}>
      Sign out
    </a>
  );
}
