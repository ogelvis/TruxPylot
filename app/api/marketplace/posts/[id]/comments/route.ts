import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

const input = z.object({ body: z.string().trim().min(1).max(500) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Sign in to comment.' }, { status: 401 });

  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Write a comment (up to 500 characters).' }, { status: 400 });

  const post = await prisma.portfolioItem.findUnique({ where: { id }, select: { id: true, approved: true } });
  if (!post || !post.approved) return NextResponse.json({ error: 'Post not found.' }, { status: 404 });

  const authorName = session.role === 'CUSTOMER'
    ? (await prisma.customer.findUnique({ where: { userId: session.userId }, select: { fullName: true } }))?.fullName
    : session.role === 'PROFESSIONAL'
      ? (await prisma.professional.findUnique({ where: { userId: session.userId }, select: { fullName: true } }))?.fullName
      : null;

  if (!authorName) return NextResponse.json({ error: 'Sign in to comment.' }, { status: 403 });

  const comment = await prisma.portfolioComment.create({
    data: { portfolioItemId: id, userId: session.userId, authorName, body: parsed.data.body },
  });

  return NextResponse.json({ ok: true, comment });
}
