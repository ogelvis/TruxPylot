import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { normalizeEmail, sendEmailOtp } from '@/lib/otp';
import { rateLimit } from '@/lib/rate-limit';
const input=z.object({email:z.string().email().transform(normalizeEmail)});
export async function POST(request:Request){const parsed=input.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({message:'If an eligible account exists, recovery instructions will be sent to its verified email.'});const email=parsed.data.email;const ip=request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';const l=rateLimit(`pwreset:${email}:${ip}`,5,15*60*1000);const generic={message:'If an eligible account exists, recovery instructions will be sent to its verified email.'};if(!l.allowed)return NextResponse.json(generic);const user=await prisma.user.findUnique({where:{email},});if(user&&user.status!=='BLOCKED'){try{await sendEmailOtp(email,{shouldCreateUser:false})}catch(error){console.error('[password-reset/request]',error instanceof Error?error.message:error)}}return NextResponse.json(generic);}
