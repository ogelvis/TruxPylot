'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

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
      const r = await fetch('/api/notifications');
      if (!r.ok) return;
      const d = await r.json();
      setNotifications(d.notifications);
      setUnreadCount(d.unreadCount);
      setLoaded(true);
    } catch {
      // Silent — the bell just stays at its last known count.
    }
  }

  // Poll for new notifications periodically so the badge count stays
  // reasonably fresh without opening the panel.
  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  async function openPanel() {
    setOpen(o => !o);
    if (!loaded) await load();
  }

  async function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
    setUnreadCount(0);
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
    } catch {
      // Best-effort — a failed bulk mark-read isn't worth surfacing an error for.
    }
  }

  async function onNotificationClick(n: Notification) {
    if (!n.readAt) {
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x));
      setUnreadCount(c => Math.max(0, c - 1));
      fetch('/api/notifications/' + n.id, { method: 'PATCH' }).catch(() => {});
    }
    setOpen(false);
    if (n.link) router.push(n.link);
  }

  return (
    <div className="notif-wrap" ref={boxRef}>
      <button className="notification" aria-label="Notifications" onClick={openPanel} type="button">
        ♧{unreadCount > 0 && <i></i>}
      </button>
      {open && (
        <div className="notif-panel">
          <div className="notif-panel-head">
            <b>Notifications</b>
            {unreadCount > 0 && <button type="button" onClick={markAllRead}>Mark all read</button>}
          </div>
          <div className="notif-list">
            {notifications.length ? notifications.map(n => (
              <button key={n.id} type="button" className={'notif-item' + (n.readAt ? '' : ' unread')} onClick={() => onNotificationClick(n)}>
                <b>{n.title}</b>
                <span>{n.body}</span>
                <small>{timeFmt.format(new Date(n.createdAt))}</small>
              </button>
            )) : (
              <p className="notif-empty">No notifications yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
