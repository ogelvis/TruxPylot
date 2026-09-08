import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

const input = z.object({ startAt: z.coerce.date(), endAt: z.coerce.date() });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'CUSTOMER') return NextResponse.json({ error: 'Customer sign-in required.' }, { status: 401 });
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success || parsed.data.endAt <= parsed.data.startAt) return NextResponse.json({ error: 'Choose a valid time slot.' }, { status: 400 });
  if (parsed.data.startAt <= new Date()) return NextResponse.json({ error: 'Choose a future time slot.' }, { status: 400 });
  if (parsed.data.endAt.getTime() - parsed.data.startAt.getTime() > 24 * 60 * 60 * 1000) return NextResponse.json({ error: 'Bookings cannot exceed 24 hours.' }, { status: 400 });
  const { id } = await params;
  const customer = await prisma.customer.findUnique({ where: { userId: session.userId } });
  const job = await prisma.job.findUnique({ where: { id }, include: { quotes: true, professional: true } });
  if (!customer || !job || job.customerId !== customer.id || !job.professional) return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
  if (!job.quotes.some(quote => quote.status === 'ACCEPTED')) return NextResponse.json({ error: 'Accept a proposal before booking.' }, { status: 409 });

  const conflict = await prisma.booking.findFirst({
    where: { professionalId: job.professional.userId, status: 'CONFIRMED', startAt: { lt: parsed.data.endAt }, endAt: { gt: parsed.data.startAt }, jobId: { not: job.id } },
  });
  if (conflict) return NextResponse.json({ error: 'That professional is already booked for this time.' }, { status: 409 });

  const reminder24hAt = new Date(parsed.data.startAt.getTime() - 24 * 60 * 60 * 1000);
  const reminder1hAt = new Date(parsed.data.startAt.getTime() - 60 * 60 * 1000);
  const booking = await prisma.booking.upsert({
    where: { jobId: job.id },
    create: { jobId: job.id, customerId: session.userId, professionalId: job.professional.userId, startAt: parsed.data.startAt, endAt: parsed.data.endAt, reminder24hAt, reminder1hAt },
    update: { startAt: parsed.data.startAt, endAt: parsed.data.endAt, status: 'CONFIRMED', reminder24hAt, reminder1hAt },
  });
  await prisma.notification.createMany({ data: [
    { userId: job.professional.userId, type: 'booking', title: 'Booking confirmed', body: 'A customer booked a time for your accepted proposal.', link: `/dashboard/professional/jobs/${job.id}` },
    { userId: session.userId, type: 'booking', title: 'Booking confirmed', body: 'Your appointment has been scheduled.', link: `/dashboard/customer/jobs/${job.id}` },
  ] });
  return NextResponse.json({ booking }, { status: 201 });
}
