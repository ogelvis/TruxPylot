import { requireRole } from '@/lib/guard';
import { AppShell } from '@/components/app-shell';
import { MessagesInbox } from '@/components/messages-inbox';

export default async function ProfessionalMessages({ searchParams }: { searchParams: Promise<{ conversation?: string }> }) {
  const session = await requireRole('PROFESSIONAL');
  const professional = await (await import('@/lib/prisma')).prisma.professional.findUnique({ where: { userId: session.userId } });
  return <AppShell role="PROFESSIONAL" name={professional?.fullName ?? 'Professional'} avatarUrl={professional?.avatarUrl} verified={professional?.verificationStatus === 'APPROVED'} active="/dashboard/professional/messages"><main className="dash-page"><h1>Your messages</h1><p className="subcopy">Reply to customers and keep every conversation in context.</p><MessagesInbox currentUserId={session.userId} role="PROFESSIONAL" initialConversationId={(await searchParams).conversation} /></main></AppShell>;
}
