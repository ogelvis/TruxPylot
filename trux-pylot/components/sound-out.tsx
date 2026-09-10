'use client';

import { useState } from 'react';

export function SoundOut({ text }: { text: string }) {
  const [active, setActive] = useState(false);

  function toggle() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (active) {
      window.speechSynthesis.cancel();
      setActive(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.onend = () => setActive(false);
    utterance.onerror = () => setActive(false);
    setActive(true);
    window.speechSynthesis.speak(utterance);
  }

  return (
    <button
      type="button"
      className={`tp-sound-out${active ? ' active' : ''}`}
      onClick={toggle}
      aria-label={active ? 'Stop Sound Out' : 'Sound Out'}
      title={active ? 'Stop Sound Out' : 'Sound Out'}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10v4h4l5 4V6L8 10H4Z" /><path d="M17 9.5a4 4 0 0 1 0 5M19.5 7a7.5 7.5 0 0 1 0 10" /></svg>
      <span>{active ? 'Stop' : 'Sound Out'}</span>
    </button>
  );
}
