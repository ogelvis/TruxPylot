import { requireRole } from '@/lib/guard';
import { prisma } from '@/lib/prisma';
import { AppShell } from '@/components/app-shell';

export const dynamic = 'force-dynamic';
const money=(kobo:number)=>`₦${(kobo/100).toLocaleString('en-NG',{minimumFractionDigits:2})}`;
const dt=(d:Date)=>new Intl.DateTimeFormat('en-NG',{dateStyle:'medium',timeStyle:'short'}).format(d);

export default async function AdminGrowth() {
  const session=await requireRole('ADMIN');
  const [premium,adverts,top10]=await Promise.all([
    prisma.premiumPurchase.findMany({include:{professional:{select:{fullName:true,businessName:true,user:{select:{email:true}}}}},orderBy:{createdAt:'desc'},take:100}),
    prisma.instantAdvertPurchase.findMany({include:{professional:{select:{fullName:true,businessName:true,user:{select:{email:true}}}}},orderBy:{createdAt:'desc'},take:100}),
    prisma.promotedListing.findMany({include:{professional:{select:{fullName:true,businessName:true,user:{select:{email:true}}}},product:true,transaction:true},orderBy:{createdAt:'desc'},take:100}),
  ]);
  const successfulPremium=premium.filter(x=>x.status==='SUCCESS');
  const successfulAds=adverts.filter(x=>x.status==='SUCCESS');
  const top10Revenue=top10.reduce((sum,x)=>sum+(x.product?.price??0),0);
    return <AppShell role="ADMIN" name="Platform admin" active="/dashboard/admin/growth"><main className="dash-page admin-growth-page">
    <div className="overview-top"><div><span className="wallet-kicker">MASTER CONTROL / GROWTH</span><h1>Upgrade & advertising requests.</h1><p className="subcopy">See who paid for Premium or Instant Advert, plus MVault-funded Top 10 placements.</p></div><a className="primary" href="/dashboard/admin/wallet">Finance control center →</a></div>
    <section className="metrics"><div className="metric"><span>Premium revenue</span><b>{money(successfulPremium.reduce((s,x)=>s+x.amount,0))}</b><small>{successfulPremium.length} successful purchase{successfulPremium.length===1?'':'s'}</small></div><div className="metric"><span>Instant Advert revenue</span><b>{money(successfulAds.reduce((s,x)=>s+x.amount,0))}</b><small>{successfulAds.length} paid advert package{successfulAds.length===1?'':'s'}</small></div><div className="metric"><span>Top 10 revenue</span><b>{money(top10Revenue)}</b><small>MVault-funded placements</small></div><div className="metric"><span>Total growth records</span><b>{premium.length+adverts.length+top10.length}</b><small>Payment and placement activity</small></div></section>
    <section className="growth-admin-grid">
      <article className="panel growth-admin-panel"><div className="panel-head"><div><h2>Tier upgrades</h2><p>Premium payments and their verification state.</p></div><span className="status approved">{successfulPremium.length} paid</span></div>{premium.length?premium.map(x=><div className="growth-admin-row" key={x.id}><div><b>{x.professional.businessName||x.professional.fullName}</b><small>{x.professional.user.email}</small></div><strong>{money(x.amount)}</strong><span className={`finance-status ${x.status.toLowerCase()}`}>{x.status}</span><small>{dt(x.createdAt)}</small><em>{x.reference}</em></div>):<div className="finance-empty">No tier upgrade requests yet.</div>}</article>
      <article className="panel growth-admin-panel"><div className="panel-head"><div><h2>Instant Advert</h2><p>Direct Paystack advertising payments and active periods.</p></div><span className="status approved">{successfulAds.length} paid</span></div>{adverts.length?adverts.map(x=><div className="growth-admin-row" key={x.id}><div><b>{x.professional.businessName||x.professional.fullName}</b><small>{x.professional.user.email}</small></div><strong>{money(x.amount)}</strong><span className={`finance-status ${x.status.toLowerCase()}`}>{x.status}</span><small>{x.durationMonths} month{x.durationMonths===1?'':'s'} · {dt(x.createdAt)}</small><em>{x.expiresAt?`Expires ${dt(x.expiresAt)}`:'Awaiting payment'}</em></div>):<div className="finance-empty">No Instant Advert requests yet.</div>}</article>
    </section>
    <section className="panel growth-admin-panel"><div className="panel-head"><div><h2>Top 10 placements</h2><p>MVault-funded visibility placements. These are separate from Tier and Instant Advert.</p></div></div>{top10.length?top10.map(x=><div className="growth-admin-row" key={x.id}><div><b>{x.professional.businessName||x.professional.fullName}</b><small>{x.professional.user.email}</small></div><strong>{money(x.product.price)}</strong><span className={`finance-status ${x.active?'success':'reversed'}`}>{x.active?'ACTIVE':'EXPIRED'}</span><small>{x.product.durationDays} days · {dt(x.createdAt)}</small><em>{x.transaction?.reference||'MVault promotion'}</em></div>):<div className="finance-empty">No Top 10 placements yet.</div>}</section>
  </main></AppShell>;
}
