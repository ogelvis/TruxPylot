'use client';
import { useEffect, useState } from 'react';

export default function ReferralPanel() {
  const [data, setData] = useState<any>(null);
  const [message, setMessage] = useState('');
  useEffect(() => { fetch('/api/referrals').then(r => r.json()).then(setData); }, []);
  if (!data) return <main className="dash-page"><p>Loading referrals…</p></main>;
  const link = `${window.location.origin}${data.shareUrl}`;
  return <main className="dash-page"><div className="overview-top"><div><p className="eyebrow">REFER & EARN</p><h1>Invite people you trust.</h1><p className="subcopy">Share your referral link and earn cash when their first legitimate job is completed. Rewards remain pending until verified.</p></div><button className="primary" onClick={() => { navigator.clipboard.writeText(link); setMessage('Link copied.'); }}>Copy link</button></div><section className="panel"><div className="panel-head"><h2>Your referral link</h2><button onClick={() => navigator.share?.({ title: 'Join Trux Pylot', url: link })}>Share</button></div><code>{link}</code>{message && <p>{message}</p>}</section><section className="panel"><div className="panel-head"><h2>Referral activity</h2><b>₦{(data.available / 100).toLocaleString()} available</b></div>{data.referrals.length ? data.referrals.map((r: any) => <div className="table-row" key={r.id}><span>{r.referred.label}</span><span className={`status ${r.status.toLowerCase()}`}>{r.status}</span></div>) : <div className="empty">No referrals yet.</div>}</section></main>;
}
