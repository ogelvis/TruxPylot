import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const referral = await prisma.referralCode.findUnique({ where: { code: code.toUpperCase() } });
  const destination = new URL('/register', request.url);
  if (referral?.active) {
    destination.searchParams.set('ref', referral.code);
    await prisma.referralCode.update({ where: { id: referral.id }, data: { clicks: { increment: 1 } } });
  }
  return NextResponse.redirect(destination);
}
