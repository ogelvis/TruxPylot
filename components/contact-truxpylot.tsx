'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';

type Props = {
  professionalId: string;
  professionalName: string;
  professionalBusinessName?: string | null;
  profession?: string | null;
  professionalLocation?: string | null;
  serviceNames: string[];
  profileUrl: string;
  customer?: {
    name: string;
    email: string;
    phone?: string | null;
    customerId?: string | null;
  } | null;
};

export function ContactTruxPylot({
  professionalId,
  professionalName,
  professionalBusinessName,
  profession,
  professionalLocation,
  serviceNames,
  profileUrl,
  customer,
}: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(customer?.name ?? '');
  const [email, setEmail] = useState(customer?.email ?? '');
  const [phone, setPhone] = useState(customer?.phone ?? '');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  function openModal() {
    setStatus(null);
    setOpen(true);
  }

  function closeModal() {
    if (!submitting) setOpen(false);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setStatus(null);

    try {
      const response = await fetch('/api/truxpylot-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          professionalId,
          name,
          email,
          phone: phone || undefined,
          message,
          profileUrl,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Unable to send your message.');

      setStatus({ type: 'ok', text: 'Your message has been sent to TruxPylot Customer Service.' });
      setMessage('');
    } catch (error) {
      setStatus({
        type: 'err',
        text: error instanceof Error ? error.message : 'Unable to send your message. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button type="button" className="secondary" onClick={openModal}>
        Contact TruxPylot →
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="trux-contact-title"
          onMouseDown={e => { if (e.target === e.currentTarget) closeModal(); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(2,12,36,.62)',
            backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
          }}
        >
          <div style={{
            width: 'min(560px, 100%)', maxHeight: 'calc(100vh - 32px)', overflowY: 'auto',
            background: '#fff', borderRadius: 22, boxShadow: '0 30px 90px rgba(0,0,0,.3)',
            padding: 24,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 15, alignItems: 'flex-start', marginBottom: 18 }}>
              <div>
                <p style={{ margin: 0, color: '#1264dc', fontSize: 10, fontWeight: 900, letterSpacing: 1.4 }}>TRUXPYLOT CUSTOMER SERVICE</p>
                <h2 id="trux-contact-title" style={{ margin: '6px 0 5px', color: '#092252', fontSize: 25 }}>Contact TruxPylot</h2>
                <p style={{ margin: 0, color: '#71809a', fontSize: 12, lineHeight: 1.5 }}>
                  This message goes to TruxPylot Customer Service, not directly to the professional.
                </p>
              </div>
              <button type="button" onClick={closeModal} disabled={submitting} aria-label="Close"
                style={{ border: 0, background: '#eef4ff', color: '#0a3d9f', width: 36, height: 36, borderRadius: 10, cursor: 'pointer', fontSize: 20 }}>
                ×
              </button>
            </div>

            <div style={{ background: '#f3f7ff', border: '1px solid #dce8fb', borderRadius: 14, padding: 12, marginBottom: 17, fontSize: 11, color: '#334b72' }}>
              <b>Professional:</b> {professionalName}
              {professionalBusinessName ? <> · {professionalBusinessName}</> : null}
              <br />
              <b>Service:</b> {serviceNames.length ? serviceNames.join(', ') : 'No service listed'}
              {profession ? <> · {profession}</> : null}
              {professionalLocation ? <> · {professionalLocation}</> : null}
            </div>

            {status?.type === 'ok' ? (
              <div style={{ padding: 16, borderRadius: 14, background: '#eefbf4', color: '#14653c', border: '1px solid #c9efd9', fontSize: 13, lineHeight: 1.5 }}>
                <b>Message sent successfully.</b>
                <br />{status.text}
                <div style={{ marginTop: 15 }}>
                  <button type="button" className="primary" onClick={closeModal}>Done</button>
                </div>
              </div>
            ) : (
              <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
                <label style={{ display: 'grid', gap: 6, color: '#1b3158', fontSize: 11, fontWeight: 800 }}>
                  Your name
                  <input required minLength={2} maxLength={120} value={name} onChange={e => setName(e.target.value)} placeholder="Your full name"
                    style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #d7e2f2', borderRadius: 11, padding: '12px 13px', outline: 'none' }} />
                </label>
                <label style={{ display: 'grid', gap: 6, color: '#1b3158', fontSize: 11, fontWeight: 800 }}>
                  Email
                  <input required type="email" maxLength={180} value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                    style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #d7e2f2', borderRadius: 11, padding: '12px 13px', outline: 'none' }} />
                </label>
                <label style={{ display: 'grid', gap: 6, color: '#1b3158', fontSize: 11, fontWeight: 800 }}>
                  Phone
                  <input maxLength={40} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+234..."
                    style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #d7e2f2', borderRadius: 11, padding: '12px 13px', outline: 'none' }} />
                </label>
                <label style={{ display: 'grid', gap: 6, color: '#1b3158', fontSize: 11, fontWeight: 800 }}>
                  How can we help?
                  <textarea required minLength={5} maxLength={3000} rows={5} value={message} onChange={e => setMessage(e.target.value)} placeholder="Tell TruxPylot Customer Service what you need..."
                    style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #d7e2f2', borderRadius: 11, padding: '12px 13px', outline: 'none', resize: 'vertical' }} />
                </label>
                {status?.type === 'err' && <p style={{ margin: 0, color: '#b42318', fontSize: 12 }}>{status.text}</p>}
                <div style={{ display: 'flex', gap: 9, justifyContent: 'flex-end', marginTop: 4 }}>
                  <button type="button" className="secondary" onClick={closeModal} disabled={submitting}>Cancel</button>
                  <button type="submit" className="primary" disabled={submitting}>
                    {submitting ? 'Sending…' : 'Send to TruxPylot →'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
