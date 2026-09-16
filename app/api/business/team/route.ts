import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthorizedTeamContext } from '@/lib/team';

const addInput = z.object({
  email: z.string().email().transform(value => value.toLowerCase()),
  role: z.enum(['ADMIN', 'MANAGER', 'STAFF', 'TECHNICIAN', 'SUPPORT']).default('STAFF'),
});
const updateInput = z.object({
  role: z.enum(['ADMIN', 'MANAGER', 'STAFF', 'TECHNICIAN', 'SUPPORT']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export async function GET() {
  const { session, context } = await getAuthorizedTeamContext();
  if (!session) return NextResponse.json({ error: 'Sign in to continue.' }, { status: 401 });
  if (!context) return NextResponse.json({ error: 'You are not part of a business team.' }, { status: 403 });
  const members = await prisma.teamMember.findMany({
    where: { businessId: context.business.id },
    include: { professional: { select: { id: true, fullName: true, profession: true, avatarUrl: true, user: { select: { email: true } } } } },
    orderBy: { invitedAt: 'asc' },
  });
  const jobs = await prisma.job.groupBy({
    by: ['professionalId', 'status'],
    where: { professionalId: { in: [context.business.id, ...members.flatMap(member => member.professionalId ? [member.professionalId] : [])] } },
    _count: { _all: true },
  });
  const stats = members.map(member => ({
    assigned: jobs.filter(job => job.professionalId === member.professionalId).reduce((sum, job) => sum + job._count._all, 0),
    inProgress: jobs.find(job => job.professionalId === member.professionalId && job.status === 'IN_PROGRESS')?._count._all ?? 0,
    completed: jobs.filter(job => job.professionalId === member.professionalId && ['COMPLETED', 'CUSTOMER_CONFIRMED', 'SETTLED'].includes(job.status)).reduce((sum, job) => sum + job._count._all, 0),
  }));
  const teamIds = [context.business.id, ...members.flatMap(member => member.professionalId ? [member.professionalId] : [])];
  const teamJobs = await prisma.job.findMany({
    where: { professionalId: { in: teamIds } },
    select: { id: true, professionalId: true, status: true, location: true, createdAt: true, category: { select: { name: true } }, customer: { select: { fullName: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return NextResponse.json({ business: { id: context.business.id, name: context.business.businessName || context.business.fullName }, canManage: context.canManage, canAssign: context.canAssign, members: members.map((member, index) => ({ ...member, stats: stats[index] })), jobs: teamJobs });
}

export async function POST(request: Request) {
  const { session, context } = await getAuthorizedTeamContext();
  if (!session) return NextResponse.json({ error: 'Sign in to continue.' }, { status: 401 });
  if (!context || !context.canManage) return NextResponse.json({ error: 'Only the business owner or an admin can manage the team.' }, { status: 403 });
  const parsed = addInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Enter a valid email and role.' }, { status: 400 });
  if (parsed.data.email === session.email.toLowerCase()) return NextResponse.json({ error: 'The business owner is already a team owner.' }, { status: 400 });
  const existingUser = await prisma.user.findUnique({ where: { email: parsed.data.email }, include: { professional: true } });
  const member = await prisma.teamMember.upsert({
    where: { businessId_email: { businessId: context.business.id, email: parsed.data.email } },
    create: { businessId: context.business.id, email: parsed.data.email, role: parsed.data.role, professionalId: existingUser?.professional?.id, status: existingUser?.professional ? 'ACTIVE' : 'INVITED', joinedAt: existingUser?.professional ? new Date() : null },
    update: { role: parsed.data.role, professionalId: existingUser?.professional?.id, status: existingUser?.professional ? 'ACTIVE' : 'INVITED', deactivatedAt: null, joinedAt: existingUser?.professional ? new Date() : null },
  });
  return NextResponse.json({ member }, { status: 201 });
}

export async function PATCH(request: Request) {
  const { session, context } = await getAuthorizedTeamContext();
  if (!session) return NextResponse.json({ error: 'Sign in to continue.' }, { status: 401 });
  if (!context || !context.canManage) return NextResponse.json({ error: 'Only the business owner or an admin can manage the team.' }, { status: 403 });
  const body = await request.json().catch(() => null);
  const id = z.string().cuid().safeParse(body?.id);
  const parsed = updateInput.safeParse(body);
  if (!id.success || !parsed.success || (!parsed.data.role && !parsed.data.status)) return NextResponse.json({ error: 'Invalid team update.' }, { status: 400 });
  const member = await prisma.teamMember.findFirst({ where: { id: id.data, businessId: context.business.id } });
  if (!member) return NextResponse.json({ error: 'Team member not found.' }, { status: 404 });
  const updated = await prisma.teamMember.update({ where: { id: member.id }, data: { ...parsed.data, deactivatedAt: parsed.data.status === 'INACTIVE' ? new Date() : null } });
  return NextResponse.json({ member: updated });
}

export async function DELETE(request: Request) {
  const { session, context } = await getAuthorizedTeamContext();
  if (!session) return NextResponse.json({ error: 'Sign in to continue.' }, { status: 401 });
  if (!context || !context.canManage) return NextResponse.json({ error: 'Only the business owner or an admin can manage the team.' }, { status: 403 });
  const id = z.string().cuid().safeParse((await request.json().catch(() => null))?.id);
  if (!id.success) return NextResponse.json({ error: 'Invalid team member.' }, { status: 400 });
  await prisma.teamMember.deleteMany({ where: { id: id.data, businessId: context.business.id } });
  return NextResponse.json({ ok: true });
}
