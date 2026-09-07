import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const createInput = z.object({
  professionalId: z.string().cuid(),
  jobId: z.string().cuid().optional(),
  serviceRequestId: z.string().cuid().optional(),
});

async function participant(session: NonNullable<Awaited<ReturnType<typeof getSession>>>) {
  if (session.role === 'CUSTOMER') {
    const customer = await prisma.customer.findUnique({ where: { userId: session.userId } });
    return customer ? { customerId: customer.id } : null;
  }
  if (session.role === 'PROFESSIONAL') {
    const professional = await prisma.professional.findUnique({ where: { userId: session.userId } });
    return professional ? { professionalId: professional.id } : null;
  }
  return null;
}

export async function GET() {
  const session = await getSession();
  if (!session || session.role === 'ADMIN') return NextResponse.json({ error: 'Messaging is available to customers and professionals.' }, { status: 403 });
  const identity = await participant(session);
  if (!identity) return NextResponse.json({ error: 'Profile not found.' }, { status: 403 });

  const where = 'customerId' in identity ? { customerId: identity.customerId } : { professionalId: identity.professionalId };
  const conversations = await prisma.conversation.findMany({
    where,
    include: {
      customer: { select: { fullName: true, avatarUrl: true, userId: true } },
      professional: { select: { id: true, fullName: true, avatarUrl: true, profession: true, userId: true } },
      job: { select: { id: true, description: true } },
      serviceRequest: { select: { id: true, description: true } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { id: true, body: true, senderId: true, readAt: true, createdAt: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });
  return NextResponse.json({ conversations });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'CUSTOMER') return NextResponse.json({ error: 'Only customers can start a conversation.' }, { status: 403 });
  const parsed = createInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'A professional is required.' }, { status: 400 });
  const customer = await prisma.customer.findUnique({ where: { userId: session.userId } });
  const professional = await prisma.professional.findUnique({ where: { id: parsed.data.professionalId } });
  if (!customer || !professional) return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });
  const existing = await prisma.conversation.findFirst({
    where: { customerId: customer.id, professionalId: professional.id, jobId: parsed.data.jobId ?? null, serviceRequestId: parsed.data.serviceRequestId ?? null },
  });
  const conversation = existing ?? await prisma.conversation.create({
    data: { customerId: customer.id, professionalId: professional.id, jobId: parsed.data.jobId, serviceRequestId: parsed.data.serviceRequestId },
  });
  const enriched = await prisma.conversation.findUnique({
    where: { id: conversation.id },
    include: {
      customer: { select: { fullName: true, avatarUrl: true, userId: true } },
      professional: { select: { id: true, fullName: true, avatarUrl: true, profession: true, userId: true } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { id: true, body: true, senderId: true, readAt: true, createdAt: true } },
    },
  });
  return NextResponse.json({ conversation: enriched }, { status: 201 });
}
