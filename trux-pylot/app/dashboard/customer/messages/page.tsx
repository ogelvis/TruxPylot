import { requireRole } from '@/lib/guard';
import { AppShell } from '@/components/app-shell';
import { MessagesInbox } from '@/components/messages-inbox';

export default async function CustomerMessages({ searchParams }: { searchParams: Promise<{ conversation?: string; professional?: string }> }) {
  const session = await requireRole('CUSTOMER');
  const customer = await (await import('@/lib/prisma')).prisma.customer.findUnique({ where: { userId: session.userId } });
  const params = await searchParams;
  return <AppShell role="CUSTOMER" name={customer?.fullName ?? 'Customer'} avatarUrl={customer?.avatarUrl} active="/dashboard/customer/messages"><main className="dash-page"><h1>Your messages</h1><p className="subcopy">Keep conversations connected to the professionals you are considering.</p><MessagesInbox currentUserId={session.userId} role="CUSTOMER" initialConversationId={params.conversation} initialProfessionalId={params.professional} /></main></AppShell>;
}
