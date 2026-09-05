'use client';
import { useEffect } from 'react';

// Adds a `.reveal` class to any element you want to animate in on scroll.
// Mount this once per page. Respects prefers-reduced-motion.
export function ScrollReveal() {
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const items = document.querySelectorAll<HTMLElement>('.reveal');

    if (prefersReduced) {
      items.forEach((el) => el.classList.add('in'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );

    items.forEach((el) => observer.observe(el));

    // Safety net: never let content stay invisible. If for any reason an
    // element isn't revealed within a few seconds (unusual viewport,
    // observer edge case, etc.), force it visible.
    const fallback = window.setTimeout(() => {
      document.querySelectorAll<HTMLElement>('.reveal:not(.in)').forEach((el) => el.classList.add('in'));
    }, 2000);

    return () => {
      observer.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  return null;
}
