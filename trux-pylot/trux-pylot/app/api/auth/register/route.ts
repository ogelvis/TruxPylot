import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { issueVerificationEmail } from '@/lib/verification';
import { readPhoneTicket } from '@/lib/twilio-verify';

const input = z.object({
  email: z.string().email(),
  password: z.string().min(12),
  fullName: z.string().min(2),
  role: z.enum(['CUSTOMER', 'PROFESSIONAL']),
  phone: z.string().min(7).optional(),
  phoneVerificationTicket: z.string().optional(), // returned by /api/auth/phone/verify-otp once Twilio approves the code
  avatarUrl: z.string().max(400000).optional(),
  country: z.string().max(80).optional(),
  state: z.string().max(80).optional(),
  city: z.string().max(80).optional(),
  area: z.string().max(120).optional(),
  street: z.string().max(200).optional(),
  profession: z.string().max(120).optional(),
  yearsExperience: z.coerce.number().int().min(0).max(60).optional(),
});

export async function POST(request: Request) {
  const parsed = input.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Please check your details and try again.' }, { status: 400 });
  const d = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email: d.email } });
  if (exists) return NextResponse.json({ error: 'Email already registered' }, { status: 409 });

  // If a phone number was submitted, it must have been verified via Twilio
  // Verify first — /api/auth/phone/send-otp then /api/auth/phone/verify-otp,
  // which returns the ticket the client sends back here.
  let phoneVerifiedAt: Date | undefined;
  if (d.phone) {
    const verifiedPhone = d.phoneVerificationTicket ? await readPhoneTicket(d.phoneVerificationTicket) : null;
    if (!verifiedPhone || verifiedPhone !== d.phone) {
      return NextResponse.json({ error: 'Please verify your phone number before continuing.' }, { status: 400 });
    }
    const phoneOwner = await prisma.user.findUnique({ where: { phone: d.phone } });
    if (phoneOwner) return NextResponse.json({ error: 'Phone number already registered' }, { status: 409 });
    phoneVerifiedAt = new Date();
  }

  const location = [d.area, d.city, d.state].filter(Boolean).join(', ') || undefined;
  const passwordHash = await bcrypt.hash(d.password, 12);

  const user = await prisma.user.create({
    data: {
      email: d.email,
      passwordHash,
      role: d.role,
      phone: d.phone,
      phoneVerifiedAt,
      customer: d.role === 'CUSTOMER' ? {
        create: { fullName: d.fullName, avatarUrl: d.avatarUrl, country: d.country, state: d.state, city: d.city, area: d.area, street: d.street, location },
      } : undefined,
      professional: d.role === 'PROFESSIONAL' ? {
        create: { fullName: d.fullName, avatarUrl: d.avatarUrl, country: d.country, state: d.state, city: d.city, area: d.area, street: d.street, location, profession: d.profession, yearsExperience: d.yearsExperience },
      } : undefined,
    },
    select: { id: true, email: true, role: true },
  });

  const baseUrl = new URL(request.url).origin;
  const { sent } = await issueVerificationEmail(user.id, user.email, baseUrl);

  return NextResponse.json({ ok: true, email: user.email, emailSent: sent }, { status: 201 });
}
