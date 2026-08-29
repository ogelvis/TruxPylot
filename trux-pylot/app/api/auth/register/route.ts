import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createSession, dashboardPath } from '@/lib/auth';

const input = z.object({
  email: z.string().email(),
  password: z.string().min(12),
  fullName: z.string().min(2),
  role: z.enum(['CUSTOMER', 'PROFESSIONAL']),
  phone: z.string().min(7).optional(),
  avatarUrl: z.string().max(400000).optional(), // base64 data URI, resized+compressed client-side
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

  const location = [d.area, d.city, d.state].filter(Boolean).join(', ') || undefined;
  const passwordHash = await bcrypt.hash(d.password, 12);

  const user = await prisma.user.create({
    data: {
      email: d.email,
      passwordHash,
      role: d.role,
      phone: d.phone,
      customer: d.role === 'CUSTOMER' ? {
        create: {
          fullName: d.fullName,
          avatarUrl: d.avatarUrl,
          country: d.country,
          state: d.state,
          city: d.city,
          area: d.area,
          street: d.street,
          location,
        },
      } : undefined,
      professional: d.role === 'PROFESSIONAL' ? {
        create: {
          fullName: d.fullName,
          avatarUrl: d.avatarUrl,
          country: d.country,
          state: d.state,
          city: d.city,
          area: d.area,
          street: d.street,
          location,
          profession: d.profession,
          yearsExperience: d.yearsExperience,
        },
      } : undefined,
    },
    select: { id: true, email: true, role: true },
  });

  const token = await createSession({ userId: user.id, role: user.role, email: user.email });
  const response = NextResponse.json({ redirect: dashboardPath(user.role) }, { status: 201 });
  response.cookies.set('tp_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 604800,
  });
  return response;
}
