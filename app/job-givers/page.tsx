import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function JobGivers() {
  const postings = await prisma.jobPosting.findMany({ where: { status: 'OPEN' }, include: { customer: { select: { id: true, fullName: true, businessName: true, accountType: true, avatarUrl: true, state: true, city: true } } }, orderBy: { createdAt: 'desc' }, take: 100 });
  return <main><header className="site-nav"><Link href="/"><img src="/trux-pylot-logo.png" alt="Trux Pylot" /></Link><nav><a href="/marketplace">Find a professional</a><a className="nav-cta" href="/register">Join TruxPylot</a></nav></header><section className="landing"><p className="eyebrow">JOB OPPORTUNITIES</p><h1 className="section-title">Find people and businesses looking for professionals.</h1><p style={{color:'var(--muted)',marginBottom:28}}>View open opportunities, learn who posted them and send a short professional interest message.</p><div className="professional-grid">{postings.map(p=>{const name=p.customer.accountType==='BUSINESS'?(p.customer.businessName||p.customer.fullName):p.customer.fullName;return <Link className="professional-card" href={`/job-givers/${p.customer.id}`} key={p.id}><div className="professional-card-head"><b>{name}</b><span className="identity-badge job-giver">{p.customer.accountType==='BUSINESS'?'BUSINESS':'JOB GIVER'}</span></div><p className="professional-meta">{p.title}</p><p className="professional-meta">{p.location}</p><p className="professional-meta">View opening →</p></Link>})}{!postings.length&&<div className="empty">No open job opportunities yet.</div>}</div></section></main>;
}
