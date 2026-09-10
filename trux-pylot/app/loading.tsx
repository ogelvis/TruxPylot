import type { ReactNode } from 'react';

export default function Loading(): ReactNode {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: '#073fc8',
        padding: '24px',
      }}
    >
      <div style={{ textAlign: 'center', color: '#fff' }}>
        <img
          src="/trux-pylot-logo.png"
          alt="Trux Pylot"
          style={{
            width: '180px',
            maxWidth: '70vw',
            height: 'auto',
            marginBottom: '24px',
          }}
        />

        <div
          aria-label="Loading"
          style={{
            width: '32px',
            height: '32px',
            margin: '0 auto',
            border: '3px solid rgba(255,255,255,0.3)',
            borderTopColor: '#fff',
            borderRadius: '50%',
            animation: 'trux-pylot-spin 0.8s linear infinite',
          }}
        />

        <p style={{ marginTop: '16px', fontSize: '14px' }}>
          Loading…
        </p>
      </div>

      <style>{`
        @keyframes trux-pylot-spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </main>
  );
}
