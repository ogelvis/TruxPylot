import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { listNigeriaBanks } from '@/lib/paystack-transfers';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'PROFESSIONAL') return NextResponse.json({ error: 'Professional sign-in required.' }, { status: 401 });
  try {
    return NextResponse.json({ banks: await listNigeriaBanks() }, { headers: { 'Cache-Control': 'private, max-age=3600' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load banks.' }, { status: 502 });
  }
}
