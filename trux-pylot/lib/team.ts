import { prisma } from '@/lib/prisma';
import { getSession, type Session } from '@/lib/auth';
import type { BusinessTeamRole } from '@prisma/client';

export async function getTeamContext(session: Session) {
  if (session.role !== 'PROFESSIONAL') return null;
  const professional = await prisma.professional.findUnique({ where: { userId: session.userId } });
  if (!professional) return null;
  if (professional.accountType === 'BUSINESS') {
    return { business: professional, membership: null, canManage: true, canAssign: true };
  }
  let membership = await prisma.teamMember.findFirst({
    where: { professionalId: professional.id, status: 'ACTIVE' },
    include: { business: true },
  });
  if (!membership) {
    const invitation = await prisma.teamMember.findFirst({
      where: { email: session.email.toLowerCase(), status: 'INVITED', professionalId: null },
      include: { business: true },
    });
    if (invitation) {
      membership = await prisma.teamMember.update({
        where: { id: invitation.id },
        data: { professionalId: professional.id, status: 'ACTIVE', joinedAt: new Date() },
        include: { business: true },
      });
    }
  }
  if (!membership) return null;
  return {
    business: membership.business,
    membership,
    canManage: membership.role === 'ADMIN',
    canAssign: membership.role === 'ADMIN' || membership.role === 'MANAGER',
  };
}

export async function getAuthorizedTeamContext() {
  const session = await getSession();
  if (!session) return { session: null, context: null };
  return { session, context: await getTeamContext(session) };
}

export function canManageTeam(role: BusinessTeamRole | null) {
  return role === null || role === 'ADMIN';
}

export function canAssignTeamJobs(role: BusinessTeamRole | null) {
  return role === null || role === 'ADMIN' || role === 'MANAGER';
}
