import { requireRole } from '@/lib/guard';
import { prisma } from '@/lib/prisma';
import { AppShell } from '@/components/app-shell';
import { PremiumPurchase } from '@/components/premium-purchase';
import { Top10Purchase } from '@/components/top10-purchase';
import { InstantAdvertPurchase } from '@/components/instant-advert-purchase';
import { premiumPriceKobo } from '@/lib/payments';

export const dynamic = 'force-dynamic';

export default async function GrowthCenter() {
  const session = await requireRole('PROFESSIONAL');
  const professional = await prisma.professional.findUnique({
    where: { userId: session.userId },
    include: {
      wallet: true,
      premiumPurchases: { where: { status: 'SUCCESS' }, orderBy: { activatedAt: 'desc' }, take: 1 },
      promotedListings: { where: { active: true, expiresAt: { gt: new Date() } }, include: { product: true }, orderBy: { expiresAt: 'desc' }, take: 1 },
      instantAdvertPurchases: { where: { status: 'SUCCESS', expiresAt: { gt: new Date() } }, orderBy: { expiresAt: 'desc' }, take: 1 },
    },
  });
  if (!professional) return null;
  const isVerified = professional.verificationStatus === 'APPROVED';
  const isPremium = professional.premiumPurchases.length > 0;
  const activeTop10 = professional.promotedListings[0] ?? null;
  const activeAdvert = professional.instantAdvertPurchases[0] ?? null;
  const premiumPrice = `₦${(premiumPriceKobo()/100).toLocaleString('en-NG')}`;

  return <AppShell role="PROFESSIONAL" name={professional.fullName} avatarUrl={professional.avatarUrl} verified={isVerified} premium={isPremium} active="/dashboard/professional/growth">
    <main className="dash-page growth-dashboard">
      <div className="growth-hero">
        <div><span className="wallet-kicker">GROW / PROMOTE / ADVANCE</span><h1>Put your business in front of more people.</h1><p className="subcopy">Three separate ways to strengthen your presence on Trux Pylot. Choose one, or use the combination that fits your goals.</p></div>
        <div className="growth-hero-balance"><span>Wallet available</span><strong>₦{((professional.wallet?.availableBalance ?? 0)/100).toLocaleString('en-NG')}</strong><a href="/dashboard/professional/wallet">Manage wallet →</a></div>
      </div>

      <section className="growth-dashboard-grid">
        <article className="growth-dashboard-card growth-tier-card">
          <div className="growth-card-icon">↑</div><span className="growth-card-label">01 · ACCOUNT ADVANCEMENT</span><h2>Tier Upgrade</h2><p>Upgrade your professional standing and unlock the capabilities available to your selected tier.</p>
          <ul><li>Premium badge on your public profile</li><li>Higher placement in marketplace search</li><li>Premium status visible to customers and CSD</li></ul>
          <div className="growth-card-state">{isPremium ? <><b>● Premium active</b><span>Your upgrade is already active.</span></> : !isVerified ? <><b>Verification required</b><span>Complete verification before purchasing Premium.</span></> : <PremiumPurchase priceLabel={`${premiumPrice} · one-time`} />}</div>
        </article>

        <article className="growth-dashboard-card growth-top10-card">
          <div className="growth-card-icon">↗</div><span className="growth-card-label">02 · SEARCH VISIBILITY</span><h2>Top 10 Placement</h2><p>Promote your profile for greater search visibility. This is separate from your Tier, Score and organic ranking.</p>
          <ul><li>Featured among eligible Top 10 placements</li><li>Greater search exposure</li><li>Reach more potential customers</li></ul>
          <Top10Purchase availableBalance={professional.wallet?.availableBalance ?? 0} />
          {activeTop10 && <small className="growth-active-note">Active until {new Intl.DateTimeFormat('en-NG',{dateStyle:'medium'}).format(activeTop10.expiresAt)}.</small>}
        </article>

        <article className="growth-dashboard-card growth-ad-card">
          <div className="growth-card-icon">◈</div><span className="growth-card-label">03 · DIRECT ADVERTISING</span><h2>Instant Advert</h2><p>Choose a paid advertising duration and promote your business directly to Trux Pylot users.</p>
          <ul><li>Promote your business instantly</li><li>Keep your brand in front of users</li><li>Choose 1, 2 or 3 months</li></ul>
          <InstantAdvertPurchase activeExpiresAt={activeAdvert?.expiresAt?.toISOString() ?? null} />
        </article>
      </section>

      <section className="growth-rules"><div><span>HOW THEY DIFFER</span><h2>Separate products. Clear outcomes.</h2></div><div className="growth-rules-grid"><div><b>Tier</b><p>Account capability and professional standing.</p></div><div><b>Top 10</b><p>Paid search visibility using your wallet.</p></div><div><b>Instant Advert</b><p>Time-based advertising paid directly through Paystack.</p></div></div></section>
    </main>
  </AppShell>;
}
