'use client';
import { useEffect, useState } from 'react';

export default function ReferralPanel() {
  const [data, setData] = useState<any>(null);
  const [message, setMessage] = useState('');
  useEffect(() => { fetch('/api/referrals', { cache:'no-store' }).then(r => r.json()).then(setData); }, []);
  if (!data) return <main className="dash-page"><p>Loading referrals…</p></main>;
  const link = `${window.location.origin}${data.shareUrl}`;
  const copy = async () => { try { await navigator.clipboard.writeText(link); setMessage('Referral link copied.'); } catch { setMessage('Copy failed.'); } };
  return <main className="dash-page">
    <section className="referral-hero">
      <p className="eyebrow">REFER &amp; EARN</p>
      <h1>Grow the TruxPylot network.</h1>
      <p className="subcopy" style={{color:'#dce8ff',maxWidth:650}}>Share your personal link. Qualified referrals are tracked securely and rewards remain pending until verified.</p>
      <div className="referral-link-box"><code>{link}</code><button type="button" onClick={copy}>Copy link</button></div>
      {message && <small style={{display:'block',marginTop:9,color:'#cfe0ff'}}>{message}</small>}
      <div className="referral-stats">
        <div className="referral-stat"><span>Qualified</span><strong>{data.qualifiedCount}</strong></div>
        <div className="referral-stat"><span>Available</span><strong>₦{(data.available / 100).toLocaleString('en-NG')}</strong></div>
        <div className="referral-stat"><span>Total earned</span><strong>₦{(data.totalEarned / 100).toLocaleString('en-NG')}</strong></div>
      </div>
    </section>
    <section className="panel" style={{marginTop:18}}><div className="panel-head"><div><h2>Your referral link</h2><p>Share directly or use your device's native sharing options.</p></div><button className="secondary" type="button" onClick={() => navigator.share?.({ title:'Join TruxPylot', url:link })}>Share</button></div><p className="subcopy">Next milestone: {data.nextMilestone ? `${data.nextMilestone.threshold} qualified referrals · ₦${(data.nextMilestone.incrementalAmount / 100).toLocaleString('en-NG')} additional reward` : 'All current milestones reached.'}</p></section>
    <section className="panel"><div className="panel-head"><h2>Reward ledger</h2><b>₦{(data.available / 100).toLocaleString('en-NG')} available</b></div><p className="subcopy">Pending ₦{(data.pending / 100).toLocaleString('en-NG')} · Approved ₦{(data.approved / 100).toLocaleString('en-NG')} · Paid ₦{(data.paid / 100).toLocaleString('en-NG')}</p></section>
    <section className="panel"><div className="panel-head"><h2>Referral activity</h2></div>{data.referrals.length ? data.referrals.map((r: any) => <div className="table-row" key={r.id}><span>{r.referred.label}</span><span className={`status ${r.status.toLowerCase()}`}>{r.status}</span></div>) : <div className="empty">No referrals yet.</div>}</section>
  </main>;
}
