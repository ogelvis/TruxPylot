'use client';

import { useEffect, useState } from 'react';

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

  async function loadConversations() {
    const response = await fetch('/api/messages/conversations');
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Could not load messages.');
    setConversations(data.conversations);
    if (initialProfessionalId && !data.conversations.some((item: Conversation) => item.professional.id === initialProfessionalId)) {
      const createResponse = await fetch('/api/messages/conversations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ professionalId: initialProfessionalId }) });
      const created = await createResponse.json();
      if (!createResponse.ok) throw new Error(created.error || 'Could not start conversation.');
      window.history.replaceState({}, '', `/dashboard/customer/messages?conversation=${created.conversation.id}`);
      data.conversations.unshift(created.conversation);
    }
    const wanted = initialConversationId ? data.conversations.find((item: Conversation) => item.id === initialConversationId) : null;
    if (wanted) await openConversation(wanted.id, data.conversations);
    else if (data.conversations[0]) await openConversation(data.conversations[0].id, data.conversations);
    setLoading(false);
  }

  async function openConversation(id: string, list = conversations) {
    const response = await fetch(`/api/messages/conversations/${id}`);
    const data = await response.json();
    if (response.ok) {
      setSelected(data.conversation);
      setConversations(list.map(item => item.id === id ? data.conversation : item));
    }
  }

  useEffect(() => { loadConversations().catch(error => { setError(error instanceof Error ? error.message : 'Could not load messages.'); setLoading(false); }); }, []);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (!selected || !body.trim()) return;
    const response = await fetch(`/api/messages/conversations/${selected.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body }) });
    const data = await response.json();
    if (!response.ok) return setError(data.error || 'Could not send message.');
    setSelected({ ...selected, messages: [...selected.messages, data.message] });
    setConversations(conversations.map(item => item.id === selected.id ? { ...item, messages: [data.message] } : item));
    setBody('');
  }

  if (loading) return <div className="panel empty">Loading your messages…</div>;
  if (error) return <div className="panel empty"><p>{error}</p><button className="primary" onClick={() => loadConversations()}>Try again</button></div>;
  return (
    <div className="messages-layout">
      <section className="panel messages-list">
        <div className="panel-head"><h2>Conversations</h2><span>{conversations.length}</span></div>
        {conversations.length ? conversations.map(conversation => {
          const other = role === 'CUSTOMER' ? conversation.professional : conversation.customer;
          return <button className={`message-thread ${selected?.id === conversation.id ? 'active' : ''}`} key={conversation.id} onClick={() => openConversation(conversation.id)}>
            <b>{other.fullName}</b>
            <small>{conversation.messages[0]?.body || 'Start the conversation'}</small>
          </button>;
        }) : <div className="empty">No messages yet. Start a conversation from a professional profile.</div>}
      </section>
      <section className="panel message-window">
        {selected ? <>
          <div className="panel-head"><div><h2>{role === 'CUSTOMER' ? selected.professional.fullName : selected.customer.fullName}</h2><small>{role === 'CUSTOMER' ? (selected.professional.profession || 'Professional conversation') : 'Customer conversation'}</small></div></div>
          <div className="message-history">
            {selected.messages.map(message => <div className={`message-bubble ${message.senderId === currentUserId ? 'mine' : ''}`} key={message.id}><p>{message.body}</p><small>{new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(message.createdAt))}</small></div>)}
          </div>
          <form className="message-compose" onSubmit={send}><textarea value={body} onChange={event => setBody(event.target.value)} placeholder="Write a message…" maxLength={3000} rows={2} /><button className="primary" type="submit">Send</button></form>
        </> : <div className="empty">Select a conversation to read your messages.</div>}
      </section>
    </div>
  );
}
