import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const now = new Date();
  const soon = new Date(now.getTime() + 60 * 60 * 1000);
  const bookings = await prisma.booking.findMany({ where: { status: 'CONFIRMED', startAt: { gt: now, lte: new Date(now.getTime() + 24 * 60 * 60 * 1000) }, OR: [{ reminder24hAt: { lte: now } }, { reminder1hAt: { lte: now } }] } });
  let sent = 0;
  for (const booking of bookings) {
    const oneHour = booking.startAt <= soon && booking.reminder1hAt !== null && booking.reminder1hAt <= now;
    const type = `booking_${oneHour ? '1h' : '24h'}`;
    const existing = await prisma.notification.findFirst({ where: { type, link: `/dashboard/customer/jobs/${booking.jobId}` } });
    if (!existing) {
      await prisma.notification.createMany({ data: [
        { userId: booking.customerId, type, title: 'Upcoming appointment', body: `Your appointment starts in about ${oneHour ? '1 hour' : '24 hours'}.`, link: `/dashboard/customer/jobs/${booking.jobId}` },
        { userId: booking.professionalId, type, title: 'Upcoming appointment', body: `Your appointment starts in about ${oneHour ? '1 hour' : '24 hours'}.`, link: `/dashboard/professional/jobs/${booking.jobId}` },
      ] });
      sent += 2;
    }
    await prisma.booking.update({ where: { id: booking.id }, data: oneHour ? { reminder1hAt: null } : { reminder24hAt: null } });
  }
  return NextResponse.json({ sent });
}
