import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Admin sign-in required.' }, { status: 401 });
  return NextResponse.json(await prisma.promotedProduct.findMany({ orderBy: { durationDays: 'asc' } }));
}
export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Admin sign-in required.' }, { status: 401 });
  const parsed = z.object({ id: z.string().cuid(), price: z.number().int().positive().optional(), active: z.boolean().optional() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid product update.' }, { status: 400 });
  const product = await prisma.promotedProduct.update({ where: { id: parsed.data.id }, data: { price: parsed.data.price, active: parsed.data.active } });
  await prisma.auditLog.create({ data: { userId: session.userId, action: 'PROMOTED_PRODUCT_UPDATED', entity: 'PromotedProduct', entityId: product.id, data: { price: product.price, active: product.active } } });
  return NextResponse.json(product);
}
