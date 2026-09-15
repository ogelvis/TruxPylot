import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { JobInterestButton } from '@/components/job-interest-button';

export const dynamic = 'force-dynamic';

export default async function JobGiverProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({ where: { id }, include: { jobPostings: { where: { status: 'OPEN' }, orderBy: { createdAt: 'desc' } } } });
  if (!customer) notFound();
  const session = await getSession();
  const displayName = customer.accountType === 'BUSINESS' ? (customer.businessName || customer.fullName) : customer.fullName;
  return <main><header className="site-nav"><Link href="/"><img src="/trux-pylot-logo.png" alt="Trux Pylot" /></Link><nav><a href="/job-givers">Job opportunities</a><a className="nav-cta" href="/marketplace">Find professionals</a></nav></header><section className="landing"><Link href="/job-givers" className="back-link">← Back to opportunities</Link><div className="pro-hero"><div className="pro-hero-top"><span className="pro-hero-avatar">{customer.avatarUrl?<img src={customer.avatarUrl} alt={displayName}/>:displayName.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase()}</span><div><p className="pro-hero-name">{displayName}</p><p className="pro-hero-meta">{customer.city||customer.state||'Nigeria'}</p></div></div><div className="pro-hero-badges"><span className="identity-badge job-giver">{customer.accountType==='BUSINESS'?'BUSINESS / JOB GIVER':'JOB GIVER'}</span><span className="pro-credential">Looking for professionals</span></div></div><section className="panel" style={{marginTop:24}}><div className="panel-head"><h2>Open job opportunities</h2><span className="profile-section-meta">{customer.jobPostings.length}</span></div>{customer.jobPostings.length?customer.jobPostings.map(job=><article className="job-opening-card" key={job.id}><div><span className="job-opening-tag">OPEN</span><h3>{job.title}</h3><p>{job.location}{job.category?` · ${job.category}`:''}</p>{job.budget? <small>Budget: ₦{job.budget.toLocaleString()}</small>:null}</div><p className="job-opening-description">{job.description}</p>{session?.role==='PROFESSIONAL'&&<JobInterestButton jobPostingId={job.id}/>} {!session&&<a className="interest-btn" href="/login">Sign in to express interest</a>}</article>):<div className="empty">There are no open job opportunities from this profile right now.</div>}</section></section></main>;
}
