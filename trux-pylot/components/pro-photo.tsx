'use client';

import { useState } from 'react';

export function ProPhoto({ src, alt, accent }: { src?: string | null; alt: string; accent: string }) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;
  return <div className={`tp-pro-photo accent-${accent}`}>{showImage ? <img src={src!} alt={alt} onError={() => setFailed(true)} /> : <span aria-hidden="true">✦</span>}</div>;
}
