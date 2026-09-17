import { prisma } from '@/lib/prisma';

const RESPONSE_WINDOW_MINUTES = 1440;
const ACTIVITY_WINDOW_DAYS = 90;

type ReviewRecord = { rating: number; job?: { status: string } | null };
type EnquiryRecord = {
  status: string;
  requiresProfessionalResponse: boolean;
  responseExcluded: boolean;
  responseAvailableAt: Date | null;
  professionalRespondedAt: Date | null;
};

export type ResponsePerformance = {
  state: 'NO_RESPONSE_DATA' | 'NO_RESPONSES' | 'INSUFFICIENT_RESPONSE_TIME_DATA' | 'CALCULATED';
  legitimateEnquiries: number;
  respondedEnquiries: number;
  validResponseTimes: number;
  responseRateScore: number;
  responseSpeedScore: number;
  responsePerformanceScore: number;
  medianResponseMinutes: number | null;
};

export type TruxPylotScore = {
  score: number;
  eligibleForPublicScore: boolean;
  publicLabel: 'New Professional' | 'Building Reputation' | null;
  level: 'Newcomer' | 'Verified' | 'Trusted' | 'Top Pro' | 'Elite Pro' | null;
  legitimateRatings: number;
  completedJobs: number;
  components: {
    customerRating: number;
    completedJobs: number;
    reliability: number;
    responsePerformance: number;
    profileCompleteness: number;
    portfolio: number;
    reviewParticipation: number;
    platformActivity: number;
  };
  response: ResponsePerformance;
};

function median(values: number[]) {
  const ordered = [...values].sort((a, b) => a - b);
  const middle = Math.floor(ordered.length / 2);
  return ordered.length % 2 ? ordered[middle] : (ordered[middle - 1] + ordered[middle]) / 2;
}

export function calculateResponsePerformance(enquiries: EnquiryRecord[]): ResponsePerformance {
  const legitimate = enquiries.filter(e =>
    e.requiresProfessionalResponse && !e.responseExcluded && e.status !== 'CANCELLED' && e.responseAvailableAt !== null
  );
  const responded = legitimate.filter(e => e.professionalRespondedAt !== null);
  const validTimes = responded
    .map(e => (e.professionalRespondedAt as Date).getTime() - (e.responseAvailableAt as Date).getTime())
    .filter(ms => ms > 0 && ms <= RESPONSE_WINDOW_MINUTES * 60 * 1000)
    .map(ms => ms / 60000);

  if (!legitimate.length) return { state: 'NO_RESPONSE_DATA', legitimateEnquiries: 0, respondedEnquiries: 0, validResponseTimes: 0, responseRateScore: 0, responseSpeedScore: 0, responsePerformanceScore: 0, medianResponseMinutes: null };
  const responseRateScore = (responded.length / legitimate.length) * 5;
  if (!responded.length) return { state: 'NO_RESPONSES', legitimateEnquiries: legitimate.length, respondedEnquiries: 0, validResponseTimes: 0, responseRateScore: 0, responseSpeedScore: 0, responsePerformanceScore: 0, medianResponseMinutes: null };
  if (!validTimes.length) return { state: 'INSUFFICIENT_RESPONSE_TIME_DATA', legitimateEnquiries: legitimate.length, respondedEnquiries: responded.length, validResponseTimes: 0, responseRateScore, responseSpeedScore: 0, responsePerformanceScore: responseRateScore, medianResponseMinutes: null };
  const medianResponseMinutes = median(validTimes);
  const responseSpeedScore = 5 * Math.max(0, 1 - medianResponseMinutes / RESPONSE_WINDOW_MINUTES);
  return { state: 'CALCULATED', legitimateEnquiries: legitimate.length, respondedEnquiries: responded.length, validResponseTimes: validTimes.length, responseRateScore, responseSpeedScore, responsePerformanceScore: responseRateScore + responseSpeedScore, medianResponseMinutes };
}

export function calculateTruxPylotScore(input: {
  completedJobs: number;
  verificationStatus: string;
  fullName: string;
  profession: string | null;
  bio: string | null;
  location: string | null;
  yearsExperience: number | null;
  avatarUrl: string | null;
  serviceCount: number;
  settledJobs: number;
  eligibleJobs: number;
  legitimateRatings: ReviewRecord[];
  enquiries: EnquiryRecord[];
  approvedPortfolioItems: number;
  recentActivityCount: number;
}): TruxPylotScore {
  const ratings = input.legitimateRatings;
  const averageRating = ratings.length ? ratings.reduce((sum, review) => sum + review.rating, 0) / ratings.length : 0;
  const customerRating = (averageRating / 5) * 30;
  const completedJobs = Math.min(input.completedJobs / 20, 1) * 20;
  const reliability = input.eligibleJobs ? (input.settledJobs / input.eligibleJobs) * 15 : 0;
  const response = calculateResponsePerformance(input.enquiries);
  const profileFields = [input.fullName, input.profession, input.bio, input.location, input.yearsExperience, input.avatarUrl, input.serviceCount > 0];
  const profileCompleteness = (profileFields.filter(Boolean).length / profileFields.length) * 10;
  const portfolio = Math.min(input.approvedPortfolioItems / 5, 1) * 5;
  const reviewParticipation = input.settledJobs ? Math.min(ratings.length / input.settledJobs, 1) * 5 : 0;
  const platformActivity = Math.min(input.recentActivityCount / 10, 1) * 5;
  const components = { customerRating, completedJobs, reliability, responsePerformance: response.responsePerformanceScore, profileCompleteness, portfolio, reviewParticipation, platformActivity };
  const score = Math.round(Object.values(components).reduce((sum, value) => sum + value, 0));
  const eligibleForPublicScore = input.completedJobs >= 5 && ratings.length >= 3;
  const level = !eligibleForPublicScore ? null
    : score >= 92 && input.completedJobs >= 50 && ratings.length >= 20 ? 'Elite Pro'
    : score >= 85 && input.completedJobs >= 25 && ratings.length >= 10 ? 'Top Pro'
    : score >= 70 && input.completedJobs >= 10 && ratings.length >= 5 ? 'Trusted'
    : input.verificationStatus === 'APPROVED' ? 'Verified'
    : 'Newcomer';
  return {
    score, eligibleForPublicScore,
    publicLabel: eligibleForPublicScore ? null : input.completedJobs < 5 || ratings.length < 3 ? 'New Professional' : 'Building Reputation',
    level, legitimateRatings: ratings.length, completedJobs: input.completedJobs, components, response,
  };
}

export async function getTruxPylotScore(professionalId: string) {
  const professional = await prisma.professional.findUnique({
    where: { id: professionalId },
    select: {
      completedJobs: true, verificationStatus: true, fullName: true, profession: true, bio: true, location: true, yearsExperience: true, avatarUrl: true,
      services: { select: { id: true } },
      jobs: { select: { status: true, updatedAt: true } },
      reviews: { select: { rating: true, job: { select: { status: true } } } },
      serviceRequests: { select: { status: true, requiresProfessionalResponse: true, responseExcluded: true, responseAvailableAt: true, professionalRespondedAt: true, updatedAt: true } },
      portfolioItems: { where: { approved: true }, select: { id: true } },
    },
  });
  if (!professional) return null;
  const eligibleStatuses = new Set(['SETTLED', 'COMPLETED', 'CUSTOMER_CONFIRMED', 'CANCELLED', 'DISPUTED', 'REFUNDED']);
  const settledJobs = professional.jobs.filter(job => job.status === 'SETTLED').length;
  const eligibleJobs = professional.jobs.filter(job => eligibleStatuses.has(job.status)).length;
  const cutoff = Date.now() - ACTIVITY_WINDOW_DAYS * 86400000;
  const recentActivityCount = [
    ...professional.jobs.map(item => item.updatedAt),
    ...professional.serviceRequests.map(item => item.updatedAt),
  ].filter(date => date.getTime() >= cutoff).length + professional.reviews.length + professional.portfolioItems.length;
  return calculateTruxPylotScore({
    ...professional,
    serviceCount: professional.services.length,
    settledJobs,
    eligibleJobs,
    legitimateRatings: professional.reviews.filter(review => review.job?.status === 'SETTLED'),
    enquiries: professional.serviceRequests,
    approvedPortfolioItems: professional.portfolioItems.length,
    recentActivityCount,
  });
}
