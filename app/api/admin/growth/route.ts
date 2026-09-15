import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const [premium, adverts, top10] = await Promise.all([
    prisma.premiumPurchase.findMany({ include: { professional: { select: { id: true, fullName: true, businessName: true, user: { select: { email: true } } } } }, orderBy: { createdAt: 'desc' }, take: 100 }),
    prisma.instantAdvertPurchase.findMany({ include: { professional: { select: { id: true, fullName: true, businessName: true, user: { select: { email: true } } } } }, orderBy: { createdAt: 'desc' }, take: 100 }),
    prisma.promotedListing.findMany({ include: { professional: { select: { id: true, fullName: true, businessName: true, user: { select: { email: true } } }, }, product: true }, orderBy: { createdAt: 'desc' }, take: 100 }),
  ]);
  return NextResponse.json({ premium, adverts, top10 }, { headers: { 'Cache-Control': 'private, no-store' } });
}
