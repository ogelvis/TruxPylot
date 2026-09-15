import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { normalizeEmail, sendEmailOtp } from '@/lib/otp';
import { rateLimit } from '@/lib/rate-limit';
const input=z.object({email:z.string().email().transform(normalizeEmail)});
export async function POST(request:Request){const parsed=input.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({message:'If the account is eligible for recovery, a verification code will be sent to its verified email.'});const email=parsed.data.email;const ip=request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';const l=rateLimit(`recovery:${email}:${ip}`,5,15*60*1000);if(!l.allowed)return NextResponse.json({message:'If the account is eligible for recovery, a verification code will be sent to its verified email.'});const user=await prisma.user.findUnique({where:{email}});if(user&&user.status==='SUSPENDED'){try{await sendEmailOtp(email,{shouldCreateUser:false})}catch(error){console.error('[account-recovery/request]',error instanceof Error?error.message:error)}}return NextResponse.json({message:'If the account is eligible for recovery, a verification code will be sent to its verified email.'})}
