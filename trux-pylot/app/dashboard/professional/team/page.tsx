import { requireRole } from '@/lib/guard';
import { prisma } from '@/lib/prisma';
import { getTeamContext } from '@/lib/team';
import { AppShell } from '@/components/app-shell';
import { TeamManagement } from '@/components/team-management';

export default async function ProfessionalTeamPage() {
  const session = await requireRole('PROFESSIONAL');
  const professional = await prisma.professional.findUnique({ where: { userId: session.userId } });
  const context = await getTeamContext(session);
  if (!professional || !context) return null;
  return <AppShell role="PROFESSIONAL" name={professional.businessName || professional.fullName} avatarUrl={professional.avatarUrl} verified={professional.verificationStatus === 'APPROVED'} active="/dashboard/professional/team" isBusiness>
    <main className="dash-page"><div className="overview-top"><div><h1>Team management</h1><p className="subcopy">Manage members, permissions, and business job assignments.</p></div></div><TeamManagement /></main>
  </AppShell>;
}
