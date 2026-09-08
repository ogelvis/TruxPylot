import { requireRole } from '@/lib/guard';
import { prisma } from '@/lib/prisma';
import { AppShell } from '@/components/app-shell';
import ReferralPanel from '@/components/referral-panel';

export default async function CustomerReferrals() {
  const session = await requireRole('CUSTOMER');
  const customer = await prisma.customer.findUnique({ where: { userId: session.userId } });
  return <AppShell role="CUSTOMER" name={customer?.fullName ?? 'Customer'} avatarUrl={customer?.avatarUrl} active="/dashboard/customer"><ReferralPanel /></AppShell>;
}
