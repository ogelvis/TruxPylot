// Shared "what should I do next" rules for role dashboards.
// Pure functions only — no Prisma/DB access here. Pages fetch data themselves
// (they already need most of these counts for their metrics tiles) and pass
// it in, so this file stays easy to unit test and reuse across roles.

export type ActionUrgency = 'high' | 'medium' | 'low';

export interface NextAction {
  id: string;
  label: string;
  href: string;
  urgency: ActionUrgency;
}

const URGENCY_ORDER: Record<ActionUrgency, number> = { high: 0, medium: 1, low: 2 };

function sortByUrgency(actions: NextAction[]): NextAction[] {
  return [...actions].sort((a, b) => URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency]);
}

function daysUntil(date: Date | null | undefined, now: Date): number | null {
  if (!date) return null;
  return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export interface ProfessionalActionInput {
  verificationStatus: string;
  unansweredEnquiries: number;
  awaitingQuotes: number;
  unreadMessages: number;
  servicesCount: number;
  portfolioItemsCount: number;
  reviewsCount: number;
  eligibleForPublicScore: boolean;
  top10ExpiresAt?: Date | null;
  advertExpiresAt?: Date | null;
  now?: Date;
}

export function getProfessionalActions(input: ProfessionalActionInput): NextAction[] {
  const now = input.now ?? new Date();
  const actions: NextAction[] = [];

  if (input.unansweredEnquiries > 0) {
    actions.push({
      id: 'unanswered-enquiries',
      label: `Reply to ${input.unansweredEnquiries} unanswered ${input.unansweredEnquiries === 1 ? 'enquiry' : 'enquiries'}.`,
      href: '/dashboard/professional/jobs',
      urgency: 'high',
    });
  }

  if (input.awaitingQuotes > 0) {
    actions.push({
      id: 'awaiting-quotes',
      label: `${input.awaitingQuotes} quote${input.awaitingQuotes === 1 ? '' : 's'} still awaiting a customer decision — follow up if it has been a while.`,
      href: '/dashboard/professional/jobs',
      urgency: 'medium',
    });
  }

  if (input.unreadMessages > 0) {
    actions.push({
      id: 'unread-messages',
      label: `Reply to ${input.unreadMessages} unread message${input.unreadMessages === 1 ? '' : 's'}.`,
      href: '/dashboard/professional/messages',
      urgency: 'medium',
    });
  }

  if (input.verificationStatus !== 'APPROVED') {
    actions.push({
      id: 'verification-pending',
      label: 'Complete verification to unlock Top 10 placement and build customer trust.',
      href: '/dashboard/professional/verification',
      urgency: 'high',
    });
  }

  if (input.servicesCount === 0) {
    actions.push({
      id: 'no-services',
      label: 'Add your services so customers can find and request you.',
      href: '/dashboard/professional/profile',
      urgency: 'high',
    });
  }

  if (input.portfolioItemsCount === 0) {
    actions.push({
      id: 'no-portfolio',
      label: 'Add approved portfolio work to strengthen your profile.',
      href: '/dashboard/professional/profile',
      urgency: 'low',
    });
  }

  if (!input.eligibleForPublicScore && input.reviewsCount < 3) {
    const remaining = 3 - input.reviewsCount;
    actions.push({
      id: 'reviews-for-score',
      label: `Collect ${remaining} more review${remaining === 1 ? '' : 's'} to unlock your public score.`,
      href: '/dashboard/professional/reviews',
      urgency: 'low',
    });
  }

  const top10Days = daysUntil(input.top10ExpiresAt, now);
  if (top10Days !== null && top10Days <= 3) {
    actions.push({
      id: 'top10-expiring',
      label: top10Days <= 0 ? 'Your Top 10 placement has expired — renew to stay visible.' : `Your Top 10 placement expires in ${top10Days} day${top10Days === 1 ? '' : 's'} — renew to stay visible.`,
      href: '/dashboard/professional/growth?feature=top10',
      urgency: 'high',
    });
  }

  const advertDays = daysUntil(input.advertExpiresAt, now);
  if (advertDays !== null && advertDays <= 3) {
    actions.push({
      id: 'advert-expiring',
      label: advertDays <= 0 ? 'Your Instant Advert has expired — renew to keep promoting your business.' : `Your Instant Advert expires in ${advertDays} day${advertDays === 1 ? '' : 's'} — renew to keep promoting your business.`,
      href: '/dashboard/professional/growth?feature=advert',
      urgency: 'medium',
    });
  }

  return sortByUrgency(actions);
}

export interface CustomerActionInput {
  jobsAwaitingQuoteReview: number;
  jobsAwaitingPayment: number;
  jobsAwaitingConfirmationOrReview: number;
  unreadMessages: number;
  hasAnyJobs: boolean;
}

export function getCustomerActions(input: CustomerActionInput): NextAction[] {
  const actions: NextAction[] = [];

  if (input.jobsAwaitingQuoteReview > 0) {
    actions.push({
      id: 'quotes-to-review',
      label: `You have ${input.jobsAwaitingQuoteReview} quote${input.jobsAwaitingQuoteReview === 1 ? '' : 's'} to review.`,
      href: '/dashboard/customer/jobs',
      urgency: 'high',
    });
  }

  if (input.jobsAwaitingPayment > 0) {
    actions.push({
      id: 'jobs-awaiting-payment',
      label: `${input.jobsAwaitingPayment} accepted job${input.jobsAwaitingPayment === 1 ? '' : 's'} waiting on payment to get started.`,
      href: '/dashboard/customer/jobs',
      urgency: 'high',
    });
  }

  if (input.jobsAwaitingConfirmationOrReview > 0) {
    actions.push({
      id: 'jobs-to-confirm-or-review',
      label: `${input.jobsAwaitingConfirmationOrReview} completed job${input.jobsAwaitingConfirmationOrReview === 1 ? '' : 's'} ready for you to confirm or review.`,
      href: '/dashboard/customer/jobs',
      urgency: 'medium',
    });
  }

  if (input.unreadMessages > 0) {
    actions.push({
      id: 'unread-messages',
      label: `Reply to ${input.unreadMessages} unread message${input.unreadMessages === 1 ? '' : 's'}.`,
      href: '/dashboard/customer/messages',
      urgency: 'medium',
    });
  }

  if (!input.hasAnyJobs) {
    actions.push({
      id: 'no-jobs-yet',
      label: 'Tell us what you need help with to get your first quote.',
      href: '/marketplace',
      urgency: 'low',
    });
  }

  return sortByUrgency(actions);
}
