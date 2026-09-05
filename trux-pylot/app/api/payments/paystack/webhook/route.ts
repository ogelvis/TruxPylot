import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPaystackSignature, applySuccessfulPayment, applySuccessfulPremiumPayment, isPremiumReference } from '@/lib/payments';
// One Paystack webhook URL handles both job payments and Premium tier
// purchases — routed purely by reference prefix (see makePremiumReference
// in lib/payments.ts), so nothing needs to change in the Paystack
// dashboard config and the existing job path below is untouched.
export async function POST(request:Request){const raw=await request.text();if(!verifyPaystackSignature(raw,request.headers.get('x-paystack-signature')))return NextResponse.json({error:'Invalid signature'},{status:401});const event=JSON.parse(raw);if(event.event!=='charge.success')return NextResponse.json({received:true});const reference=event.data?.reference as string;const amount=event.data?.amount as number;const result=isPremiumReference(reference)?await applySuccessfulPremiumPayment(reference,amount,event.data?.id):await applySuccessfulPayment(reference,amount,event.data?.id);if(!result.ok&&result.reason==='amount_mismatch')return NextResponse.json({error:'Amount mismatch'},{status:400});return NextResponse.json({received:true});}
