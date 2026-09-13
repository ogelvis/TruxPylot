'use client';
import { useState } from 'react';

const suggestions = [
  'Hello, I am interested in this opportunity and would be happy to discuss how I can assist.',
  'I am available for this job and would like to discuss the requirements with you.',
  'I have experience in this area and would be interested in working on this project.',
  'I am available and interested. Please let me know the next steps.',
];
export function JobInterestButton({ jobPostingId }: { jobPostingId: string }) {
  const [open,setOpen]=useState(false), [message,setMessage]=useState(suggestions[0]), [busy,setBusy]=useState(false), [status,setStatus]=useState('');
  async function send(){setBusy(true);setStatus('');try{const r=await fetch('/api/job-interests',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jobPostingId,message})});const d=await r.json().catch(()=>({}));if(!r.ok){setStatus(d.error||'Could not send your interest.');return}setStatus('Interest sent successfully.');}catch{setStatus('Could not reach the server.')}finally{setBusy(false)}}
  if(!open)return <button type="button" className="interest-btn" onClick={()=>setOpen(true)}>Send a short Interest Message</button>;
  return <div className="interest-box"><div className="interest-box-head"><b>Express your interest</b><button type="button" onClick={()=>setOpen(false)} aria-label="Close">×</button></div><p className="hint-text">Choose a quick response or edit it before sending.</p><div className="interest-suggestions">{suggestions.map(s=><button type="button" key={s} onClick={()=>setMessage(s)}>{s}</button>)}</div><textarea value={message} onChange={e=>setMessage(e.target.value)} rows={5} maxLength={1200}/><button type="button" className="interest-send" disabled={busy||message.trim().length<10} onClick={send}>{busy?'Sending…':'Send Interest'}</button>{status&&<p className="form-status">{status}</p>}</div>;
}
