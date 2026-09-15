import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Sign in to continue.' }, { status: 401 });
  const body = await request.json().catch(() => null);
  const id = String(body?.id || '');
  if (!id) return NextResponse.json({ error: 'Device id is required.' }, { status: 400 });
  await prisma.recognizedDevice.updateMany({ where: { id, userId: session.userId }, data: { revokedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
