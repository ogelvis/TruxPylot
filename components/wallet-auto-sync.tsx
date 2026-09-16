'use client';

import { useEffect } from 'react';

export function WalletAutoSync({ initialBalance = 0 }: { initialBalance?: number }) {
  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    const sync = async () => {
      if (cancelled || attempts >= 3) return;
      attempts += 1;
      try {
        const response = await fetch('/api/wallet?sync=1', {
          cache: 'no-store',
          credentials: 'same-origin',
        });
        const body = await response.json().catch(() => ({}));
        if (!cancelled && response.ok && Number(body.availableBalance ?? initialBalance) > initialBalance) {
          window.location.reload();
          return;
        }
      } catch {}
      if (!cancelled && attempts < 3) window.setTimeout(sync, 12000);
    };

    void sync();
    return () => {
      cancelled = true;
    };
  }, [initialBalance]);

  return null;
}
