import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function products() {
  const existing = await prisma.promotedProduct.count();
  if (!existing) await prisma.promotedProduct.createMany({ data: [
    { name: 'Promoted Top 10 — 30 days', durationDays: 30, price: 150000 },
    { name: 'Promoted Top 10 — 60 days', durationDays: 60, price: 300000 },
  ] });
  return prisma.promotedProduct.findMany({ where: { active: true }, orderBy: { durationDays: 'asc' } });
}

export async function GET() {
  const session = await getSession();
  await prisma.promotedListing.updateMany({ where: { active: true, expiresAt: { lte: new Date() } }, data: { active: false } });
  const productsList = await products();
  const listings = session?.role === 'PROFESSIONAL' ? await prisma.promotedListing.findMany({ where: { professional: { userId: session.userId }, active: true, expiresAt: { gt: new Date() } }, include: { product: true }, orderBy: { expiresAt: 'desc' } }) : [];
  return NextResponse.json({ products: productsList, listings });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'PROFESSIONAL') return NextResponse.json({ error: 'Professional sign-in required.' }, { status: 401 });
  const parsed = z.object({ productId: z.string().cuid() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Choose a valid promotion plan.' }, { status: 400 });
  const professional = await prisma.professional.findUnique({ where: { userId: session.userId }, select: { id: true } });
  const product = await prisma.promotedProduct.findUnique({ where: { id: parsed.data.productId } });
  if (!professional || !product || !product.active) return NextResponse.json({ error: 'Promotion plan unavailable.' }, { status: 404 });
  const result = await prisma.$transaction(async tx => {
    const wallet = await tx.wallet.upsert({ where: { professionalId: professional.id }, create: { professionalId: professional.id }, update: {} });
    if (wallet.availableBalance < product.price) throw new Error('INSUFFICIENT_BALANCE');
    const startsAt = new Date();
    const expiresAt = new Date(startsAt.getTime() + product.durationDays * 86400000);
    const transaction = await tx.walletTransaction.create({ data: { walletId: wallet.id, type: 'DEBIT', source: 'PROMOTED_TOP10', amount: product.price, description: product.name } });
    const listing = await tx.promotedListing.create({ data: { professionalId: professional.id, productId: product.id, transactionId: transaction.id, startsAt, expiresAt } });
    await tx.wallet.update({ where: { id: wallet.id }, data: { availableBalance: { decrement: product.price } } });
    return listing;
  }).catch(error => error instanceof Error && error.message === 'INSUFFICIENT_BALANCE' ? null : Promise.reject(error));
  if (!result) return NextResponse.json({ error: 'Insufficient available wallet balance.' }, { status: 400 });
  return NextResponse.json({ ok: true, listing: result }, { status: 201 });
}
