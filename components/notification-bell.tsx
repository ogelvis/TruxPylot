'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Notification = { id: string; type: string; title: string; body: string; link: string | null; readAt: string | null; createdAt: string };
const timeFmt = new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short' });

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const r = await fetch('/api/notifications', { cache: 'no-store' });
      if (!r.ok) return;
      const d = await r.json();
      setNotifications(d.notifications ?? []);
      setUnreadCount(d.unreadCount ?? 0);
      setLoaded(true);
    } catch {}
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  async function onNotificationClick(n: Notification) {
    if (!n.readAt) {
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x));
      setUnreadCount(c => Math.max(0, c - 1));
      fetch(`/api/notifications/${n.id}`, { method: 'PATCH' }).catch(() => {});
    }
    setOpen(false);
    if (n.link) router.push(n.link);
  }

  return (
    <div className="notif-wrap" ref={boxRef}>
      <button className="notif-icon" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} onClick={() => { setOpen(v => !v); if (!loaded) load(); }} type="button">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>
        {unreadCount > 0 && <span className="notif-count">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>
      {open && (
        <div className="notif-panel">
          <div className="notif-panel-head">
            <b>Notifications</b>
            {unreadCount > 0 && <button type="button" onClick={async () => { setNotifications(prev => prev.map(n => ({ ...n, readAt: n.readAt ?? new Date().toISOString() }))); setUnreadCount(0); await fetch('/api/notifications', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ markAllRead:true }) }).catch(()=>{}); }}>Mark all read</button>}
          </div>
          <div className="notif-list">
            {notifications.length ? notifications.slice(0, 6).map(n => (
              <button key={n.id} type="button" className={'notif-item' + (n.readAt ? '' : ' unread')} onClick={() => onNotificationClick(n)}>
                <b>{n.title}</b><span>{n.body}</span><small>{timeFmt.format(new Date(n.createdAt))}</small>
              </button>
            )) : <p className="notif-empty">No notifications yet.</p>}
          </div>
          <Link href="/dashboard/notifications" className="notif-view-all" onClick={() => setOpen(false)}>View all notifications →</Link>
        </div>
      )}
    </div>
  );
}
