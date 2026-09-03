'use client';

import { useState } from 'react';

export function ProPhoto({ src, alt, accent }: { src: string; alt: string; accent: string }) {
  const [failed, setFailed] = useState(false);
  return <div className={`tp-pro-photo accent-${accent}`}>{failed ? <span aria-hidden="true">✦</span> : <img src={src} alt={alt} onError={() => setFailed(true)} />}</div>;
}
