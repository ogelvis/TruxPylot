import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

const input = z.object({
  professionalId: z.string().cuid(),
  categoryId: z.string().cuid(),
  description: z.string().min(10).max(2000),
  location: z.string().min(3).max(200),
  preferredDate: z.coerce.date().optional(),
  preferredTime: z.string().max(60).optional(),
  additionalRequirements: z.string().max(1000).optional(),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'CUSTOMER') {
    return NextResponse.json({ error: 'Sign in with a customer account to request a service.' }, { status: 401 });
  }
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Please check your details and try again.' }, { status: 400 });

  const customer = await prisma.customer.findUnique({ where: { userId: session.userId } });
  if (!customer) return NextResponse.json({ error: 'Customer profile missing.' }, { status: 403 });

  const professional = await prisma.professional.findUnique({
    where: { id: parsed.data.professionalId },
    include: { services: true },
  });
  if (!professional || professional.verificationStatus !== 'APPROVED') {
    return NextResponse.json({ error: 'This professional is not available for requests right now.' }, { status: 404 });
  }
  if (!professional.services.some(s => s.categoryId === parsed.data.categoryId)) {
    return NextResponse.json({ error: 'This professional does not offer that service.' }, { status: 400 });
  }

  // Deliberately does NOT notify or expose anything to the professional —
  // this goes to Truxpylot's Customer Service/Disburser (CSD) queue first.
  // See app/dashboard/admin/service-requests for the review workflow.
  const serviceRequest = await prisma.serviceRequest.create({
    data: {
      customerId: customer.id,
      professionalId: professional.id,
      categoryId: parsed.data.categoryId,
      description: parsed.data.description,
      location: parsed.data.location,
      preferredDate: parsed.data.preferredDate,
      preferredTime: parsed.data.preferredTime,
      additionalRequirements: parsed.data.additionalRequirements,
    },
  });

  return NextResponse.json({ serviceRequest }, { status: 201 });
}
