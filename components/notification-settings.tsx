'use client';
import { useEffect, useState } from 'react';

type Prefs = { jobs:boolean; messages:boolean; payments:boolean; announcements:boolean };
const labels: Array<[keyof Prefs,string,string]> = [
  ['jobs','Jobs & requests','Updates about jobs, bookings and service requests.'],
  ['messages','Messages','New messages from customers or professionals.'],
  ['payments','Payments & MVault','Funding, withdrawals, rewards and other financial activity.'],
  ['announcements','Announcements','Important TruxPylot platform updates.'],
];

export function NotificationSettings(){
  const [prefs,setPrefs]=useState<Prefs>({jobs:true,messages:true,payments:true,announcements:true});
  const [busy,setBusy]=useState<string|null>(null);
  const [message,setMessage]=useState('');
  useEffect(()=>{fetch('/api/settings/notifications',{cache:'no-store'}).then(r=>r.json()).then(d=>{if(d.preferences)setPrefs({jobs:d.preferences.jobs,messages:d.preferences.messages,payments:d.preferences.payments,announcements:d.preferences.announcements});}).catch(()=>{});},[]);
  async function toggle(key:keyof Prefs){
    const next={...prefs,[key]:!prefs[key]}; setPrefs(next); setBusy(key); setMessage('');
    const r=await fetch('/api/settings/notifications',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(next)}).catch(()=>null);
    if(!r?.ok){setPrefs(prefs);setMessage('Could not save that preference.');} else setMessage('Saved');
    setBusy(null); window.setTimeout(()=>setMessage(''),1200);
  }
  return <section className="panel notification-settings-modern"><div className="panel-head"><div><h2>Notification preferences</h2><p>Choose which dashboard updates you want to receive.</p></div>{message&&<span className="status approved">{message}</span>}</div>{labels.map(([key,title,desc])=><div className="settings-toggle-row" key={key}><div><b>{title}</b><small>{desc}</small></div><button type="button" className={'settings-toggle '+(prefs[key]?'on':'')} aria-label={`${title}: ${prefs[key]?'on':'off'}`} onClick={()=>toggle(key)} disabled={busy===key}/></div>)}</section>;
}
