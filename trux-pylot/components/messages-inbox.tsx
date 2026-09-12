'use client';

import { useCallback, useEffect, useState } from 'react';

type Conversation = {
  id: string;
  customer: { fullName: string };
  professional: { id: string; fullName: string; profession: string | null };
  messages: { id: string; body: string; senderId: string; readAt: string | null; createdAt: string }[];
};

export function MessagesInbox({ currentUserId, role, initialConversationId, initialProfessionalId }: { currentUserId: string; role: 'CUSTOMER' | 'PROFESSIONAL'; initialConversationId?: string; initialProfessionalId?: string }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const openConversation = useCallback(async (id: string, list?: Conversation[]) => {
    const response = await fetch(`/api/messages/conversations/${encodeURIComponent(id)}`, { cache: 'no-store' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Could not open conversation.');
    setSelected(data.conversation);
    setConversations(prev => (list ?? prev).map(item => item.id === id ? data.conversation : item));
  }, []);

  const loadConversations = useCallback(async (selectCurrent = true) => {
    const response = await fetch('/api/messages/conversations', { cache: 'no-store' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Could not load messages.');
    let list: Conversation[] = data.conversations ?? [];

    if (role === 'CUSTOMER' && initialProfessionalId && !list.some(item => item.professional.id === initialProfessionalId)) {
      const createResponse = await fetch('/api/messages/conversations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ professionalId: initialProfessionalId }) });
      const created = await createResponse.json().catch(() => ({}));
      if (!createResponse.ok) throw new Error(created.error || 'Could not start conversation.');
      list = [created.conversation, ...list];
      window.history.replaceState({}, '', `/dashboard/customer/messages?conversation=${created.conversation.id}`);
    }

    setConversations(list);
    if (selectCurrent) {
      const wanted = initialConversationId ? list.find(item => item.id === initialConversationId) : null;
      const target = wanted ?? list[0];
      if (target) await openConversation(target.id, list);
    }
  }, [initialConversationId, initialProfessionalId, openConversation, role]);

  useEffect(() => {
    let mounted = true;
    loadConversations().catch(e => { if (mounted) setError(e instanceof Error ? e.message : 'Could not load messages.'); }).finally(() => { if (mounted) setLoading(false); });
    const timer = window.setInterval(() => loadConversations(false).catch(() => {}), 15000);
    return () => { mounted = false; window.clearInterval(timer); };
  }, [loadConversations]);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (!selected || !body.trim() || sending) return;
    setSending(true); setError('');
    try {
      const response = await fetch(`/api/messages/conversations/${encodeURIComponent(selected.id)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body: body.trim() }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not send message.');
      const next = { ...selected, messages: [...selected.messages, data.message] };
      setSelected(next);
      setConversations(prev => prev.map(item => item.id === selected.id ? { ...item, messages: [data.message] } : item));
      setBody('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not send message.'); }
    finally { setSending(false); }
  }

  if (loading) return <div className="panel empty">Loading your messages…</div>;
  return <div className="messages-layout">
    {error && <div className="panel empty" style={{gridColumn:'1/-1'}}><p>{error}</p><button className="primary" onClick={() => {setError('');loadConversations().catch(e=>setError(e instanceof Error?e.message:'Could not load messages.'));}}>Try again</button></div>}
    <section className="panel messages-list">
      <div className="panel-head"><h2>Conversations</h2><span>{conversations.length}</span></div>
      {conversations.length ? conversations.map(conversation => {
        const other = role === 'CUSTOMER' ? conversation.professional : conversation.customer;
        return <button className={`message-thread ${selected?.id === conversation.id ? 'active' : ''}`} key={conversation.id} onClick={() => openConversation(conversation.id).catch(e=>setError(e instanceof Error?e.message:'Could not open conversation.'))}>
          <b>{other.fullName}</b><small>{conversation.messages[0]?.body || 'Start the conversation'}</small>
        </button>;
      }) : <div className="empty">No messages yet. Start a conversation from a professional profile.</div>}
    </section>
    <section className="panel message-window">
      {selected ? <>
        <div className="panel-head"><div><h2>{role === 'CUSTOMER' ? selected.professional.fullName : selected.customer.fullName}</h2><small>{role === 'CUSTOMER' ? (selected.professional.profession || 'Professional conversation') : 'Customer conversation'}</small></div></div>
        <div className="message-history">{selected.messages.map(message => <div className={`message-bubble ${message.senderId === currentUserId ? 'mine' : ''}`} key={message.id}><p>{message.body}</p><small>{new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(message.createdAt))}</small></div>)}</div>
        <form className="message-compose" onSubmit={send}><textarea value={body} onChange={event => setBody(event.target.value)} placeholder="Write a message…" maxLength={3000} rows={2} /><button className="primary" type="submit" disabled={sending || !body.trim()}>{sending ? 'Sending…' : 'Send'}</button></form>
      </> : <div className="empty">Select a conversation to read your messages.</div>}
    </section>
  </div>;
}
