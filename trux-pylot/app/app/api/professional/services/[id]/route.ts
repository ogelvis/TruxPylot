
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
 
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'PROFESSIONAL') {
    return NextResponse.json({ error: 'Professional sign-in required.' }, { status: 401 });
  }
  const { id } = await params;
 
  const professional = await prisma.professional.findUnique({ where: { userId: session.userId } });
  if (!professional) return NextResponse.json({ error: 'Professional profile missing.' }, { status: 403 });
 
  const service = await prisma.professionalService.findUnique({ where: { id } });
  if (!service || service.professionalId !== professional.id) {
    return NextResponse.json({ error: 'Service not found.' }, { status: 404 });
  }
 
  await prisma.professionalService.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
 
