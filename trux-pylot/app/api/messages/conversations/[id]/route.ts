import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const input = z.object({ body: z.string().trim().min(1).max(3000) });

async function getConversationForUser(id: string, session: NonNullable<Awaited<ReturnType<typeof getSession>>>) {
  const userProfile = session.role === 'CUSTOMER'
    ? await prisma.customer.findUnique({ where: { userId: session.userId }, select: { id: true } })
    : session.role === 'PROFESSIONAL'
    ? await prisma.professional.findUnique({ where: { userId: session.userId }, select: { id: true } })
    : null;
  if (!userProfile) return null;
  return prisma.conversation.findFirst({
    where: session.role === 'CUSTOMER'
      ? { id, customerId: userProfile.id }
      : { id, professionalId: userProfile.id },
    include: {
      customer: { select: { fullName: true, avatarUrl: true, userId: true } },
      professional: { select: { id: true, fullName: true, avatarUrl: true, profession: true, userId: true } },
      messages: { orderBy: { createdAt: 'asc' }, select: { id: true, body: true, senderId: true, readAt: true, createdAt: true } },
    },
  });
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role === 'ADMIN') return NextResponse.json({ error: 'Not permitted.' }, { status: 403 });
  const conversation = await getConversationForUser((await params).id, session);
  if (!conversation) return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
  await prisma.message.updateMany({ where: { conversationId: conversation.id, senderId: { not: session.userId }, readAt: null }, data: { readAt: new Date() } });
  return NextResponse.json({ conversation });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role === 'ADMIN') return NextResponse.json({ error: 'Not permitted.' }, { status: 403 });
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Message cannot be empty.' }, { status: 400 });
  const conversation = await getConversationForUser((await params).id, session);
  if (!conversation) return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
  const message = await prisma.message.create({ data: { conversationId: conversation.id, senderId: session.userId, body: parsed.data.body } });
  await prisma.conversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } });
  const recipientId = session.role === 'CUSTOMER' ? conversation.professional.userId : conversation.customer.userId;
  await prisma.notification.create({ data: { userId: recipientId, type: 'message', title: 'New message', body: parsed.data.body.slice(0, 120), link: `/dashboard/${session.role === 'CUSTOMER' ? 'professional' : 'customer'}/messages?conversation=${conversation.id}` } });
  return NextResponse.json({ message }, { status: 201 });
}
