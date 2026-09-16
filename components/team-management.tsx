'use client';

import { useEffect, useState } from 'react';

type Member = { id: string; email: string; role: string; status: string; professionalId?: string | null; professional?: { fullName: string; profession?: string | null; user?: { email: string } }; stats: { assigned: number; inProgress: number; completed: number } };
type Job = { id: string; professionalId: string | null; status: string; location: string; category: { name: string }; customer: { fullName: string } };

export function TeamManagement() {
  const [data, setData] = useState<{ canManage: boolean; canAssign: boolean; members: Member[]; jobs: Job[] } | null>(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('STAFF');
  const [error, setError] = useState('');
  const load = () => fetch('/api/business/team').then(async response => { const body = await response.json(); if (!response.ok) throw new Error(body.error); setData(body); }).catch(error => setError(error.message));
  useEffect(() => { load(); }, []);
  async function addMember(event: React.FormEvent) {
    event.preventDefault(); setError('');
    const response = await fetch('/api/business/team', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, role }) });
    const body = await response.json(); if (!response.ok) return setError(body.error); setEmail(''); load();
  }
  async function update(id: string, values: object) {
    const response = await fetch('/api/business/team', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...values }) });
    const body = await response.json(); if (!response.ok) setError(body.error); else load();
  }
  async function assign(jobId: string, professionalId: string) {
    const response = await fetch(`/api/business/jobs/${jobId}/assign`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ professionalId: professionalId || null }) });
    const body = await response.json(); if (!response.ok) setError(body.error); else load();
  }
  if (!data) return <div className="panel">{error || 'Loading team…'}</div>;
  const activeMembers = data.members.filter(member => member.status === 'ACTIVE' && member.professionalId);
  return <div className="team-management">
    {error && <p className="form-error">{error}</p>}
    {data.canManage && <form className="panel" onSubmit={addMember}><div className="panel-head"><h2>Add a team member</h2></div><p className="subcopy">Add an existing professional by email, or invite a future member.</p><div className="form-grid"><label>Email<input type="email" required value={email} onChange={event => setEmail(event.target.value)} /></label><label>Role<select value={role} onChange={event => setRole(event.target.value)}>{['ADMIN', 'MANAGER', 'STAFF', 'TECHNICIAN', 'SUPPORT'].map(item => <option key={item}>{item}</option>)}</select></label></div><button className="primary" type="submit">Add member</button></form>}
    <section className="panel"><div className="panel-head"><h2>Team members</h2><span>{data.members.length} member{data.members.length === 1 ? '' : 's'}</span></div>{data.members.length ? data.members.map(member => <div className="table-row" key={member.id}><div className="job-name"><b>{member.professional?.fullName || member.email}</b><span>{member.professional?.profession || member.email}</span></div><select disabled={!data.canManage} value={member.role} onChange={event => update(member.id, { role: event.target.value })}>{['ADMIN', 'MANAGER', 'STAFF', 'TECHNICIAN', 'SUPPORT'].map(item => <option key={item}>{item}</option>)}</select><small>{member.stats.assigned} assigned · {member.stats.inProgress} in progress · {member.stats.completed} completed</small><button className="secondary" disabled={!data.canManage} onClick={() => update(member.id, { status: member.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })}>{member.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}</button></div>) : <div className="empty">No team members yet.</div>}</section>
    {data.canAssign && <section className="panel"><div className="panel-head"><h2>Team jobs</h2><span>Assign and track business work</span></div>{data.jobs.length ? data.jobs.map(job => <div className="table-row" key={job.id}><div className="job-name"><b>{job.category.name}</b><span>{job.customer.fullName} · {job.location}</span></div><span className={`status ${job.status.toLowerCase()}`}>{job.status.replaceAll('_', ' ')}</span><select value={job.professionalId || ''} onChange={event => assign(job.id, event.target.value)}><option value="">Business owner</option>{activeMembers.map(member => <option key={member.professionalId} value={member.professionalId!}>{member.professional?.fullName || member.email}</option>)}</select></div>) : <div className="empty">No business jobs to assign.</div>}</section>}
  </div>;
}
