import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthorizedTeamContext } from '@/lib/team';

const input = z.object({ professionalId: z.string().cuid().nullable() });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, context } = await getAuthorizedTeamContext();
  if (!session) return NextResponse.json({ error: 'Sign in to continue.' }, { status: 401 });
  if (!context || !context.canAssign) return NextResponse.json({ error: 'You are not allowed to assign business jobs.' }, { status: 403 });
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Choose a valid team member.' }, { status: 400 });
  const { id } = await params;
  const teamMembers = await prisma.teamMember.findMany({ where: { businessId: context.business.id, status: 'ACTIVE' }, select: { professionalId: true } });
  const teamIds = [context.business.id, ...teamMembers.flatMap(member => member.professionalId ? [member.professionalId] : [])];
  const job = await prisma.job.findUnique({ where: { id }, select: { id: true, professionalId: true } });
  if (!job) return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
  if (!teamIds.includes(job.professionalId || '')) return NextResponse.json({ error: 'Only jobs owned by this business can be assigned.' }, { status: 403 });
  if (parsed.data.professionalId) {
    const member = await prisma.teamMember.findFirst({ where: { businessId: context.business.id, professionalId: parsed.data.professionalId, status: 'ACTIVE' } });
    if (!member) return NextResponse.json({ error: 'That professional is not an active member of this business team.' }, { status: 400 });
  }
  const updated = await prisma.job.update({ where: { id }, data: { professionalId: parsed.data.professionalId } });
  return NextResponse.json({ ok: true, job: updated });
}
