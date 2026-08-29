import { NextResponse } from 'next/server';
import { z } from 'zod';
import { startPhoneVerification, isValidPhone } from '@/lib/twilio-verify';

const input = z.object({
  phone: z.string().refine(isValidPhone, 'Enter a valid phone number with country code, e.g. +2348012345678'),
  channel: z.enum(['sms', 'whatsapp', 'call']),
});

export async function POST(request: Request) {
  const parsed = input.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid request' }, { status: 400 });

  try {
    const result = await startPhoneVerification(parsed.data.phone, parsed.data.channel);
    return NextResponse.json({ status: result.status });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Could not send code' }, { status: 502 });
  }
}
