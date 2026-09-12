'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';

const starters = [
  { label: 'Find a professional', text: 'I need help finding a professional for a job.' },
  { label: 'Payment help', text: 'I need help understanding payments on TruxPylot.' },
  { label: 'Track my request', text: 'How can I track my service request?' },
  { label: 'Become a professional', text: 'How do I become a TruxPylot professional?' },
];

type Message = { role: 'user' | 'assistant'; content: string };

const initialMessages: Message[] = [
  {
    role: 'assistant',
    content: 'Hi 👋 I’m TXP BOT. I can help you find the right service, understand how TruxPylot works, or guide you to the right place. What do you need today?',
  },
];

export default function TruxPylotChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem('truxpylot-chat');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Message[];
        if (Array.isArray(parsed) && parsed.length) setMessages(parsed);
      } catch {}
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem('truxpylot-chat', JSON.stringify(messages.slice(-30)));
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  async function sendMessage(value?: string) {
    const text = (value ?? input).trim();
    if (!text || loading) return;

    const nextMessages = [...messages, { role: 'user' as const, content: text }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/truxpylot-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages.slice(-12) }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to reply right now.');

      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: error instanceof Error ? error.message : 'I could not connect right now. Please try again.',
      }]);
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    sendMessage();
  }

  function clearChat() {
    setMessages(initialMessages);
    window.localStorage.removeItem('truxpylot-chat');
  }

  return (
    <div className="tp-chat-root">
      {open && (
        <section className="tp-chat-panel" aria-label="TXP BOT">
          <header className="tp-chat-header">
            <div className="tp-chat-brand">
              <div className="tp-chat-avatar"><span>TP</span><i /></div>
              <div>
                <strong>TXP BOT</strong>
                <small><b /> Online now</small>
              </div>
            </div>
            <div className="tp-chat-header-actions">
              <button type="button" onClick={clearChat} aria-label="Clear chat">↺</button>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close chat">×</button>
            </div>
          </header>

          <div className="tp-chat-body">
            <div className="tp-chat-intro">
              <span>TRUXPYLOT SUPPORT</span>
              <h3>How can we move your job forward?</h3>
              <p>Ask naturally. I’ll point you toward the right service or next step.</p>
            </div>

            <div className="tp-chat-starters">
              {starters.map(item => (
                <button key={item.label} type="button" onClick={() => sendMessage(item.text)} disabled={loading}>
                  {item.label}<span>↗</span>
                </button>
              ))}
            </div>

            <div className="tp-chat-messages">
              {messages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={`tp-chat-message ${message.role}`}>
                  {message.role === 'assistant' && <span className="tp-chat-mini-avatar">TP</span>}
                  <div className="tp-chat-bubble">{message.content}</div>
                </div>
              ))}
              {loading && (
                <div className="tp-chat-message assistant">
                  <span className="tp-chat-mini-avatar">TP</span>
                  <div className="tp-chat-bubble tp-chat-typing"><i /><i /><i /></div>
                </div>
              )}
              <div ref={endRef} />
            </div>
          </div>

          <div className="tp-chat-actions">
            <a href="/marketplace">Open Marketplace <span>↗</span></a>
          </div>

          <form className="tp-chat-form" onSubmit={submit}>
            <input value={input} onChange={event => setInput(event.target.value)} placeholder="Type your message..." aria-label="Message TXP BOT" disabled={loading} />
            <button type="submit" disabled={!input.trim() || loading} aria-label="Send message">↑</button>
          </form>
          <p className="tp-chat-note">TXP BOT can make mistakes. Verify important details before acting.</p>
        </section>
      )}

      {!open && (
        <button type="button" className="tp-chat-launcher" onClick={() => setOpen(true)} aria-label="Open TXP BOT">
          <span className="tp-chat-launcher-pulse" />
          <span className="tp-chat-launcher-icon">✦</span>
          <span className="tp-chat-launcher-copy"><b>TXP BOT</b><small>Live help</small></span>
        </button>
      )}
    </div>
  );
}
