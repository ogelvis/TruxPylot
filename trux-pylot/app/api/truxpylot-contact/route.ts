import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { sendCsdContactEmail } from '@/lib/email';

const input = z.object({
  professionalId: z.string().cuid(),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(180),
  phone: z.string().trim().max(40).optional(),
  message: z.string().trim().min(5).max(3000),
  profileUrl: z.string().url().optional(),
});

export async function POST(request: Request) {
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Please check your details and try again.' }, { status: 400 });
  }

  const session = await getSession();

  const professional = await prisma.professional.findUnique({
    where: { id: parsed.data.professionalId },
    include: {
      services: { include: { category: true } },
    },
  });

  if (!professional || professional.verificationStatus !== 'APPROVED') {
    return NextResponse.json({ error: 'This professional profile is not available.' }, { status: 404 });
  }

  let customerId: string | null = null;
  let customerName = parsed.data.name;
  let customerEmail = parsed.data.email;
  let customerPhone = parsed.data.phone || null;

  if (session?.role === 'CUSTOMER') {
    const customer = await prisma.customer.findUnique({
      where: { userId: session.userId },
      include: { user: { select: { email: true, phone: true } } },
    });
    if (customer) {
      customerId = customer.id;
      customerName = customer.fullName;
      customerEmail = customer.user.email;
      customerPhone = customer.user.phone || customerPhone;
    }
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://trux-pylot.onrender.com').replace(/\/$/, '');

  try {
    await sendCsdContactEmail({
      customerName,
      customerEmail,
      customerPhone,
      customerId,
      professionalName: professional.fullName,
      professionalBusinessName: professional.businessName,
      professionalId: professional.id,
      profession: professional.profession,
      professionalLocation: professional.location || [professional.area, professional.city, professional.state, professional.country].filter(Boolean).join(', ') || null,
      serviceNames: professional.services.map(s => s.category.name),
      message: parsed.data.message,
      profileUrl: parsed.data.profileUrl || `${appUrl}/marketplace/${professional.id}`,
    });
  } catch (error) {
    console.error('TruxPylot CSD contact email failed:', error);
    return NextResponse.json({ error: 'We could not send your message right now. Please try again.' }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
