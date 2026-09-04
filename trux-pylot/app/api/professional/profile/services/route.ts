
Services route · TS
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
 
const input = z.object({
  categoryId: z.string().cuid(),
  startingPrice: z.number().int().positive().optional(),
});
 
export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'PROFESSIONAL') {
    return NextResponse.json({ error: 'Professional sign-in required.' }, { status: 401 });
  }
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Choose a valid service category.' }, { status: 400 });
 
  const professional = await prisma.professional.findUnique({ where: { userId: session.userId } });
  if (!professional) return NextResponse.json({ error: 'Professional profile missing.' }, { status: 403 });
 
  const category = await prisma.serviceCategory.findUnique({ where: { id: parsed.data.categoryId } });
  if (!category || !category.active) return NextResponse.json({ error: 'That service category is not available.' }, { status: 404 });
 
  const existing = await prisma.professionalService.findUnique({
    where: { professionalId_categoryId: { professionalId: professional.id, categoryId: category.id } },
  });
  if (existing) return NextResponse.json({ error: 'You already offer this service.' }, { status: 409 });
 
  const service = await prisma.professionalService.create({
    data: { professionalId: professional.id, categoryId: category.id, startingPrice: parsed.data.startingPrice },
    include: { category: true },
  });
 
  return NextResponse.json({ ok: true, service }, { status: 201 });
}
 
