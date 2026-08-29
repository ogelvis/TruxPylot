import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const input = z.object({
  secret: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(12),
  fullName: z.string().min(2).max(120).optional(),
});

// One-time use: this route only ever works while zero ADMIN accounts exist.
// Once the first admin is created, every future call is rejected regardless
// of the secret, so leaking this URL/secret later is not a standing risk.
export async function POST(request: Request) {
  const configuredSecret = process.env.ADMIN_BOOTSTRAP_SECRET;
  if (!configuredSecret) {
    return NextResponse.json({ error: 'Bootstrap is not configured on this server.' }, { status: 503 });
  }

  const parsed = input.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please provide a valid secret, email and password (12+ characters).' }, { status: 400 });
  }
  if (parsed.data.secret !== configuredSecret) {
    return NextResponse.json({ error: 'Invalid secret.' }, { status: 403 });
  }

  const existingAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (existingAdmin) {
    return NextResponse.json({ error: 'An admin account already exists. This endpoint is now permanently disabled.' }, { status: 409 });
  }

  const existingEmail = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existingEmail) {
    return NextResponse.json({ error: 'That email is already registered to a non-admin account.' }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const user = await prisma.user.create({
    data: { email: parsed.data.email, passwordHash, role: 'ADMIN', status: 'ACTIVE' },
    select: { id: true, email: true },
  });

  await prisma.auditLog.create({
    data: { userId: user.id, action: 'BOOTSTRAP_ADMIN_CREATED', entity: 'User', entityId: user.id },
  });

  return NextResponse.json({ ok: true, email: user.email }, { status: 201 });
}
