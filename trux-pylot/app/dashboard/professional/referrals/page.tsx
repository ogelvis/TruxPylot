import { requireRole } from '@/lib/guard';
import { prisma } from '@/lib/prisma';
import { AppShell } from '@/components/app-shell';
import ReferralPanel from '@/components/referral-panel';

export default async function ProfessionalReferrals() {
  const session = await requireRole('PROFESSIONAL');
  const professional = await prisma.professional.findUnique({ where: { userId: session.userId } });
  return <AppShell role="PROFESSIONAL" name={professional?.fullName ?? 'Professional'} avatarUrl={professional?.avatarUrl} active="/dashboard/professional"><ReferralPanel /></AppShell>;
}
