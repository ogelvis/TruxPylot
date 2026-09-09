import { requireRole } from '@/lib/guard';
import { prisma } from '@/lib/prisma';
import { AppShell } from '@/components/app-shell';
import { getTruxPylotScore } from '@/lib/truxpylot-score';

export default async function ProfessionalDashboard() {
  const session = await requireRole('PROFESSIONAL');
  const professional = await prisma.professional.findUnique({
    where: { userId: session.userId },
    include: { wallet: true, services: true, portfolioItems: true, jobs: { include: { customer: true, category: true }, take: 8, orderBy: { createdAt: 'desc' } } },
  });
  if (!professional) return null;
  const teamMembership = await prisma.teamMember.findFirst({ where: { professionalId: professional.id, status: 'ACTIVE' }, select: { id: true } });
  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
  const now = new Date();
  const [score, enquiriesToday, unansweredEnquiries, upcomingBookings, inProgress, completed, awaitingQuotes, unreadMessages, unreadNotifications, reviews, successfulPayments, premiumPurchase, activeTop10, activeAdvert] = await Promise.all([
    getTruxPylotScore(professional.id),
    prisma.serviceRequest.count({ where: { professionalId: professional.id, createdAt: { gte: startOfDay } } }),
    prisma.serviceRequest.count({ where: { professionalId: professional.id, requiresProfessionalResponse: true, professionalRespondedAt: null, responseExcluded: false, status: { not: 'CANCELLED' } } }),
    prisma.booking.count({ where: { professionalId: session.userId, startAt: { gte: now }, status: { not: 'CANCELLED' } } }),
    prisma.job.count({ where: { professionalId: professional.id, status: 'IN_PROGRESS' } }),
    prisma.job.count({ where: { professionalId: professional.id, status: { in: ['COMPLETED', 'CUSTOMER_CONFIRMED', 'SETTLED'] } } }),
    prisma.quote.count({ where: { job: { professionalId: professional.id }, status: { in: ['PENDING', 'SENT'] } } }),
    prisma.message.count({ where: { conversation: { professionalId: professional.id }, senderId: { not: session.userId }, readAt: null } }),
    prisma.notification.count({ where: { userId: session.userId, readAt: null } }),
    prisma.review.count({ where: { professionalId: professional.id } }),
    prisma.payment.aggregate({ where: { job: { professionalId: professional.id }, status: 'SUCCESS' }, _sum: { amount: true }, _count: { _all: true } }),
    prisma.premiumPurchase.findFirst({ where: { professionalId: professional.id, status: 'SUCCESS' }, orderBy: { activatedAt: 'desc' } }),
    prisma.promotedListing.findFirst({ where: { professionalId: professional.id, active: true, expiresAt: { gt: now } }, include: { product: true }, orderBy: { expiresAt: 'desc' } }),
    prisma.instantAdvertPurchase.findFirst({ where: { professionalId: professional.id, status: 'SUCCESS', expiresAt: { gt: now } }, orderBy: { expiresAt: 'desc' } }),
  ]);
  const responseLabel = score?.response.state === 'CALCULATED' && score.response.medianResponseMinutes !== null ? `${Math.round(score.response.medianResponseMinutes)} min median response` : score?.response.state === 'NO_RESPONSES' ? 'No responses yet' : score?.response.state === 'NO_RESPONSE_DATA' ? 'No response data' : 'Insufficient response-time data';
  const recommendations = [
    unansweredEnquiries > 0 ? `Reply to ${unansweredEnquiries} unanswered ${unansweredEnquiries === 1 ? 'enquiry' : 'enquiries'}.` : null,
    professional.services.length === 0 ? 'Add your services so customers can find and request you.' : null,
    professional.portfolioItems.length === 0 ? 'Add approved portfolio work to strengthen your profile.' : null,
    !score?.eligibleForPublicScore && reviews < 3 ? `Collect ${3 - reviews} more review${3 - reviews === 1 ? '' : 's'} to unlock your public score.` : null,
  ].filter(Boolean) as string[];
  const displayName = professional.accountType === 'BUSINESS' ? (professional.businessName || professional.fullName) : professional.fullName;
  return <AppShell role="PROFESSIONAL" name={displayName} avatarUrl={professional.avatarUrl} verified={professional.verificationStatus === 'APPROVED'} active="/dashboard/professional" isBusiness={professional.accountType === 'BUSINESS' || Boolean(teamMembership)}>
    <main className="dash-page"><div className="overview-top"><div><h1>Business Command Center</h1><p className="subcopy">A live view of your business activity and next best actions.</p></div><a className="primary" href={`/marketplace/${professional.id}`}>View public profile →</a></div>
      <section className="metrics">
        <div className="metric"><span>Payments received</span><b>₦{((successfulPayments._sum.amount ?? 0) / 100).toLocaleString()}</b><small>{successfulPayments._count._all} successful payment{successfulPayments._count._all === 1 ? '' : 's'}</small></div>
        <div className="metric"><span>New enquiries today</span><b>{enquiriesToday}</b><small>{unansweredEnquiries} awaiting your response</small></div>
        <div className="metric"><span>Upcoming bookings</span><b>{upcomingBookings}</b><small>Confirmed future appointments</small></div>
        <div className="metric"><span>{score?.eligibleForPublicScore ? 'TruxPylot Score' : 'Internal score'}</span><b>{score?.score ?? 0}</b><small>{score?.eligibleForPublicScore ? score.level : 'Building reputation'}</small></div>
      </section>
      <section className="metrics command-secondary"><div className="metric"><span>Jobs in progress</span><b>{inProgress}</b></div><div className="metric"><span>Jobs completed</span><b>{completed}</b></div><div className="metric"><span>Quotes awaiting response</span><b>{awaitingQuotes}</b></div><div className="metric"><span>Unread messages / alerts</span><b>{unreadMessages} / {unreadNotifications}</b></div></section>
      {recommendations.length > 0 && <section className="panel recommendations"><div className="panel-head"><h2>Recommended next steps</h2></div><ul>{recommendations.map(item => <li key={item}>{item}</li>)}</ul></section>}
      <section className="panel dashboard-growth-panel"><div className="panel-head"><div><h2>Grow &amp; promote</h2><p>Upgrade your account or buy visibility without leaving your dashboard.</p></div><a href="/dashboard/professional/growth">Open Growth Center →</a></div><div className="dashboard-growth-grid"><a href="/dashboard/professional/growth?feature=tier"><span>01</span><b>{premiumPurchase ? 'Premium active' : 'Tier Upgrade'}</b><small>{premiumPurchase ? 'Your Premium access is active.' : 'Unlock higher-tier capabilities.'}</small></a><a href="/dashboard/professional/growth?feature=top10"><span>02</span><b>{activeTop10 ? 'Top 10 active' : 'Top 10 Placement'}</b><small>{activeTop10 ? `Active until ${new Intl.DateTimeFormat('en-NG',{dateStyle:'medium'}).format(activeTop10.expiresAt)}.` : 'Increase paid search visibility.'}</small></a><a href="/dashboard/professional/growth?feature=advert"><span>03</span><b>{activeAdvert ? 'Advert active' : 'Instant Advert'}</b><small>{activeAdvert ? `Active until ${new Intl.DateTimeFormat('en-NG',{dateStyle:'medium'}).format(activeAdvert.expiresAt!)}` : 'Promote your business for 1–3 months.'}</small></a></div></section>
      <section className="panel score-breakdown"><div className="panel-head"><h2>Performance</h2><span className="status approved">{responseLabel}</span></div><div className="job-detail-body"><p><b>{score?.response.legitimateEnquiries ?? 0}</b> legitimate enquiries · <b>{score?.response.respondedEnquiries ?? 0}</b> responses · <b>{reviews}</b> reviews</p><p>Response performance contribution: <b>{score?.response.responsePerformanceScore.toFixed(1) ?? '0.0'}/10</b></p></div></section>
      <section className="panel" id="jobs"><div className="panel-head"><h2>Recent job activity</h2><a href="/dashboard/professional/jobs">View all →</a></div>{professional.jobs.length ? professional.jobs.map(j => <div className="table-row" key={j.id}><div className="job-name"><b>{j.category.name}</b><span>{j.customer.fullName}</span></div><small>{j.location}</small><small>{new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' }).format(j.createdAt)}</small><span className={`status ${j.status.toLowerCase()}`}>{j.status.replaceAll('_', ' ')}</span></div>) : <div className="empty">New job activity will appear here after your professional profile is approved.</div>}</section>
    </main></AppShell>;
}
