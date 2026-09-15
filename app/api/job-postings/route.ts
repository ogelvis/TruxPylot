import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

const input = z.object({
  title: z.string().trim().min(3).max(160),
  location: z.string().trim().min(2).max(160),
  description: z.string().trim().min(10).max(5000),
  category: z.string().trim().max(120).optional(),
  budget: z.coerce.number().int().min(0).max(100000000).optional(),
  deadline: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'CUSTOMER') return NextResponse.json({ error: 'Job giver sign-in required.' }, { status: 401 });
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Please check the job details and try again.' }, { status: 400 });
  const customer = await prisma.customer.findUnique({ where: { userId: session.userId } });
  if (!customer) return NextResponse.json({ error: 'Customer profile missing.' }, { status: 403 });
  const deadline = parsed.data.deadline ? new Date(parsed.data.deadline) : null;
  if (deadline && Number.isNaN(deadline.getTime())) return NextResponse.json({ error: 'Choose a valid deadline.' }, { status: 400 });
  const posting = await prisma.jobPosting.create({ data: { customerId: customer.id, title: parsed.data.title, location: parsed.data.location, description: parsed.data.description, category: parsed.data.category || null, budget: parsed.data.budget || null, deadline } });
  return NextResponse.json({ ok: true, posting });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mine = url.searchParams.get('mine') === '1';
  const session = await getSession();
  if (mine) {
    if (!session || session.role !== 'CUSTOMER') return NextResponse.json({ error: 'Sign-in required.' }, { status: 401 });
    const customer = await prisma.customer.findUnique({ where: { userId: session.userId } });
    if (!customer) return NextResponse.json({ error: 'Customer profile missing.' }, { status: 403 });
    const postings = await prisma.jobPosting.findMany({ where: { customerId: customer.id }, include: { interests: { select: { id: true, status: true, createdAt: true } } }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ postings });
  }
  const postings = await prisma.jobPosting.findMany({ where: { status: 'OPEN' }, include: { customer: { select: { id: true, fullName: true, businessName: true, accountType: true, avatarUrl: true, state: true, city: true } } }, orderBy: { createdAt: 'desc' }, take: 100 });
  return NextResponse.json({ postings });
}
