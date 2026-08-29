import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
const input=z.object({categoryId:z.string().cuid(),description:z.string().min(10).max(2000),location:z.string().min(3),budget:z.number().int().positive().optional(),preferredAt:z.coerce.date().optional()});
export async function POST(request:Request) { const session=await getSession(); if(!session||session.role!=='CUSTOMER')return NextResponse.json({error:'Customer sign-in required'},{status:401}); const parsed=input.safeParse(await request.json()); if(!parsed.success)return NextResponse.json({error:'Invalid job request'},{status:400}); const customer=await prisma.customer.findUnique({where:{userId:session.userId}}); if(!customer)return NextResponse.json({error:'Customer profile missing'},{status:403}); const job=await prisma.job.create({data:{...parsed.data,customerId:customer.id}}); return NextResponse.json({job},{status:201}); }
