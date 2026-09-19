import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== 'PROFESSIONAL') {
    return NextResponse.json({ error: 'Professional sign-in required.' }, { status: 401 });
  }

  const professional = await prisma.professional.findUnique({ where: { userId: session.userId } });
  if (!professional) return NextResponse.json({ error: 'Professional profile missing.' }, { status: 403 });

  const post = await prisma.portfolioItem.findUnique({ where: { id } });
  if (!post || post.professionalId !== professional.id) {
    return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
  }

  await prisma.portfolioItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
