import { requireRole } from '@/lib/guard';
import { prisma } from '@/lib/prisma';
import { AppShell } from '@/components/app-shell';
import { PremiumPurchase } from '@/components/premium-purchase';
import { premiumPriceKobo } from '@/lib/payments';

const dateFmt = new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' });

export default async function TierCenter() {
  const session = await requireRole('PROFESSIONAL');

  const professional = await prisma.professional.findUnique({
    where: { userId: session.userId },
    include: {
      premiumPurchases: { where: { status: 'SUCCESS' }, orderBy: { activatedAt: 'desc' }, take: 1 },
    },
  });

  const isVerified = professional?.verificationStatus === 'APPROVED';
  const premiumPurchase = professional?.premiumPurchases[0] ?? null;
  const isPremium = !!premiumPurchase;

  const currentTier: 'BASIC' | 'VERIFIED' | 'PREMIUM' = isPremium ? 'PREMIUM' : isVerified ? 'VERIFIED' : 'BASIC';
  const price = premiumPriceKobo();
  const priceLabel = `₦${(price / 100).toLocaleString()}`;

  return (
    <AppShell role="PROFESSIONAL" name={professional?.fullName ?? 'Professional'} avatarUrl={professional?.avatarUrl} verified={isVerified} premium={isPremium} active="/dashboard/professional/tier">
      <main className="dash-page tier-page">
        <div className="tier-hero-bg" aria-hidden="true">
          <span className="tier-glow tier-glow-a" />
          <span className="tier-glow tier-glow-b" />
          <span className="tier-shape tier-shape-a" />
          <span className="tier-shape tier-shape-b" />
        </div>

        <div className="tier-hero-content">
          <p className="page-kicker tier-kicker">TIER CENTER</p>
          <h1 className="tier-hero-title">Your professional standing on Trux Pylot.</h1>
          <p className="subcopy tier-hero-sub">See what your current tier unlocks, and what's next.</p>

          {/* Current tier card */}
          <section className={`tier-current-card tier-current-${currentTier.toLowerCase()}`}>
            <div className="tier-current-badge">
              {currentTier === 'PREMIUM' ? '★ PREMIUM' : currentTier === 'VERIFIED' ? '✓ VERIFIED' : 'BASIC'}
            </div>
            <h2>{currentTier === 'PREMIUM' ? 'Premium Active' : currentTier === 'VERIFIED' ? "You're Verified" : 'Basic tier'}</h2>
            <p>
              {currentTier === 'PREMIUM' && premiumPurchase?.activatedAt
                ? `Premium since ${dateFmt.format(premiumPurchase.activatedAt)}. Your profile gets priority placement and a Premium badge customers can see.`
                : currentTier === 'VERIFIED'
                ? 'Your verification is confirmed. Complete a one-time purchase to unlock Premium visibility.'
                : 'Complete verification to unlock Premium and build more trust with customers.'}
            </p>
          </section>

          {/* Tier journey */}
          <section className="tier-journey">
            <div className={`tier-journey-step ${currentTier === 'BASIC' ? 'is-current' : 'is-done'}`}>
              <span className="tier-journey-dot">1</span>
              <b>Basic</b>
              <small>Registered professional</small>
            </div>
            <span className="tier-journey-line" />
            <div className={`tier-journey-step ${currentTier === 'VERIFIED' ? 'is-current' : isVerified ? 'is-done' : ''}`}>
              <span className="tier-journey-dot">2</span>
              <b>Verified</b>
              <small>{isVerified ? 'Complete' : 'Complete verification'}</small>
            </div>
            <span className="tier-journey-line" />
            <div className={`tier-journey-step ${currentTier === 'PREMIUM' ? 'is-current' : ''}`}>
              <span className="tier-journey-dot">3</span>
              <b>Premium</b>
              <small>{isPremium ? 'Active' : 'One-time purchase'}</small>
            </div>
          </section>

          {/* Tier comparison */}
          <section className="tier-compare">
            <div className={`tier-card ${currentTier === 'BASIC' ? 'is-current' : ''}`}>
              <p className="tier-card-name">BASIC</p>
              <p className="tier-card-price">Free</p>
              <ul>
                <li>Standard marketplace listing</li>
                <li>Full professional dashboard</li>
                <li>Job requests via CSD</li>
              </ul>
              {currentTier === 'BASIC' && <span className="tier-card-current">Your current tier</span>}
            </div>

            <div className={`tier-card ${currentTier === 'VERIFIED' ? 'is-current' : ''}`}>
              <p className="tier-card-name">✓ VERIFIED</p>
              <p className="tier-card-price">Free — earned</p>
              <ul>
                <li>Verified badge on your profile</li>
                <li>Trust indicator for customers</li>
                <li>Everything in Basic</li>
              </ul>
              {currentTier === 'VERIFIED' && <span className="tier-card-current">Your current tier</span>}
              {!isVerified && (
                <a className="tier-card-cta" href="/dashboard/professional/verification">Complete verification →</a>
              )}
            </div>

            <div className={`tier-card tier-card-premium ${currentTier === 'PREMIUM' ? 'is-current' : ''}`}>
              <p className="tier-card-name">★ PREMIUM</p>
              <p className="tier-card-price">{priceLabel} <span>one-time</span></p>
              <ul>
                <li>Premium badge on your public profile</li>
                <li>Higher placement in marketplace search</li>
                <li>Everything in Verified</li>
              </ul>
              {isPremium ? (
                <span className="tier-card-current">★ Premium active</span>
              ) : isVerified ? (
                <PremiumPurchase priceLabel={priceLabel} />
              ) : (
                <p className="tier-card-locked">Complete verification to unlock</p>
              )}
            </div>
          </section>
        </div>
      </main>
    </AppShell>
  );
}
