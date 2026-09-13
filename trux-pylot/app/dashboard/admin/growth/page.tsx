import { requireRole } from '@/lib/guard';
import { prisma } from '@/lib/prisma';
import { AppShell } from '@/components/app-shell';

export const dynamic = 'force-dynamic';
const money=(kobo:number)=>`₦${(kobo/100).toLocaleString('en-NG',{minimumFractionDigits:2})}`;
const dt=(d:Date)=>new Intl.DateTimeFormat('en-NG',{dateStyle:'medium',timeStyle:'short'}).format(d);

function GrowthRows({rows,type}:{rows:any[];type:'premium'|'advert'|'top10'}) {
  if(!rows.length) return <div className="growth-empty"><b>No activity yet</b><span>Real platform records will appear here automatically.</span></div>;
  return <div className="growth-record-list">{rows.map((x:any)=><div className="growth-record" key={x.id}>
    <div className="growth-record-person"><span>{(x.professional.businessName||x.professional.fullName).slice(0,1).toUpperCase()}</span><div><b>{x.professional.businessName||x.professional.fullName}</b><small>{x.professional.user.email}</small></div></div>
    <strong>{money(type==='top10'?x.product.price:x.amount)}</strong>
    <span className={`growth-status ${type==='top10'?(x.active?'live':'expired'):x.status.toLowerCase()}`}>{type==='top10'?(x.active?'ACTIVE':'EXPIRED'):x.status}</span>
    <small className="growth-date">{type==='advert'?`${x.durationMonths} month${x.durationMonths===1?'':'s'} · `:''}{dt(x.createdAt)}</small>
    <em>{type==='advert'?(x.expiresAt?`Expires ${dt(x.expiresAt)}`:'Awaiting payment'):type==='top10'?(x.transaction?.reference||'MVault promotion'):x.reference}</em>
  </div>)}</div>;
}

export default async function AdminGrowth() {
  await requireRole('ADMIN');
  const [premium,adverts,top10]=await Promise.all([
    prisma.premiumPurchase.findMany({include:{professional:{select:{fullName:true,businessName:true,user:{select:{email:true}}}}},orderBy:{createdAt:'desc'},take:40}),
    prisma.instantAdvertPurchase.findMany({include:{professional:{select:{fullName:true,businessName:true,user:{select:{email:true}}}}},orderBy:{createdAt:'desc'},take:40}),
    prisma.promotedListing.findMany({include:{professional:{select:{fullName:true,businessName:true,user:{select:{email:true}}}},product:true,transaction:true},orderBy:{createdAt:'desc'},take:40}),
  ]);
  const successfulPremium=premium.filter(x=>x.status==='SUCCESS');
  const successfulAds=adverts.filter(x=>x.status==='SUCCESS');
  const top10Revenue=top10.reduce((sum,x)=>sum+(x.product?.price??0),0);
  return <AppShell role="ADMIN" name="Platform admin" active="/dashboard/admin/growth"><main className="dash-page admin-growth-future">
    <section className="admin-section-hero growth-hero-future"><div><span className="admin-future-kicker">MASTER CONTROL / GROWTH</span><h1>Growth, <em>without the clutter.</em></h1><p>Track real upgrade, advertising and visibility activity with compact records that stay inside their boundaries.</p></div><a className="admin-future-btn primary" href="/dashboard/admin/wallet">Open finance →</a></section>
    <section className="admin-mini-metrics growth-metrics"><div><span>PREMIUM</span><b>{money(successfulPremium.reduce((s,x)=>s+x.amount,0))}</b><small>{successfulPremium.length} successful purchases</small></div><div><span>INSTANT ADVERT</span><b>{money(successfulAds.reduce((s,x)=>s+x.amount,0))}</b><small>{successfulAds.length} paid packages</small></div><div><span>TOP 10</span><b>{money(top10Revenue)}</b><small>MVault-funded placement</small></div><div><span>RECORDS</span><b>{premium.length+adverts.length+top10.length}</b><small>latest 120 records</small></div></section>
    <section className="growth-admin-grid-future">
      <article className="growth-future-panel"><header><div><span>01 / TIER</span><h2>Premium upgrades</h2><p>Provider-confirmed upgrade activity.</p></div><b className="growth-count">{successfulPremium.length} paid</b></header><GrowthRows rows={premium} type="premium"/></article>
      <article className="growth-future-panel"><header><div><span>02 / ADVERTISING</span><h2>Instant Advert</h2><p>Paid promotional packages and expiry.</p></div><b className="growth-count">{successfulAds.length} paid</b></header><GrowthRows rows={adverts} type="advert"/></article>
    </section>
    <article className="growth-future-panel"><header><div><span>03 / VISIBILITY</span><h2>Top 10 placements</h2><p>Separate from Premium and Instant Advert.</p></div></header><GrowthRows rows={top10} type="top10"/></article>
  </main></AppShell>;
}
