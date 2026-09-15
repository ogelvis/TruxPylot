import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

const input = z.object({
  jobId: z.string().cuid(),
  rating: z.number().int().min(1).max(5),
  review: z.string().max(1000).optional(),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'CUSTOMER') {
    return NextResponse.json({ error: 'Customer sign-in required.' }, { status: 401 });
  }
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid review.' }, { status: 400 });

  const customer = await prisma.customer.findUnique({ where: { userId: session.userId } });
  if (!customer) return NextResponse.json({ error: 'Customer profile missing.' }, { status: 403 });

  const job = await prisma.job.findUnique({ where: { id: parsed.data.jobId }, include: { review: true } });
  if (!job || job.customerId !== customer.id) {
    return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
  }
  if (job.status !== 'SETTLED') {
    return NextResponse.json({ error: 'You can review a job once it is fully settled.' }, { status: 409 });
  }
  if (job.review) {
    return NextResponse.json({ error: 'You already reviewed this job.' }, { status: 409 });
  }
  if (!job.professionalId) {
    return NextResponse.json({ error: 'This job has no assigned professional to review.' }, { status: 400 });
  }

  await prisma.$transaction(async tx => {
    await tx.review.create({
      data: {
        jobId: job.id,
        customerId: customer.id,
        professionalId: job.professionalId!,
        rating: parsed.data.rating,
        review: parsed.data.review,
      },
    });
    const agg = await tx.review.aggregate({ where: { professionalId: job.professionalId! }, _avg: { rating: true } });
    await tx.professional.update({
      where: { id: job.professionalId! },
      data: { rating: agg._avg.rating ?? parsed.data.rating },
    });
  });

  return NextResponse.json({ ok: true });
}
