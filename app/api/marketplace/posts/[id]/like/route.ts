import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Sign in to like a post.' }, { status: 401 });

  const post = await prisma.portfolioItem.findUnique({ where: { id }, select: { id: true, approved: true } });
  if (!post || !post.approved) return NextResponse.json({ error: 'Post not found.' }, { status: 404 });

  const existing = await prisma.portfolioLike.findUnique({
    where: { portfolioItemId_userId: { portfolioItemId: id, userId: session.userId } },
  });

  if (existing) {
    await prisma.portfolioLike.delete({ where: { id: existing.id } });
  } else {
    await prisma.portfolioLike.create({ data: { portfolioItemId: id, userId: session.userId } });
  }

  const likeCount = await prisma.portfolioLike.count({ where: { portfolioItemId: id } });
  return NextResponse.json({ ok: true, liked: !existing, likeCount });
}
