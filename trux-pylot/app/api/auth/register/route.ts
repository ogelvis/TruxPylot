import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
const input = z.object({email:z.string().email(),password:z.string().min(12),fullName:z.string().min(2),role:z.enum(['CUSTOMER','PROFESSIONAL']),phone:z.string().min(7).optional(),location:z.string().min(2).optional()});
export async function POST(request: Request) { const parsed=input.safeParse(await request.json()); if(!parsed.success) return NextResponse.json({error:'Invalid registration details'},{status:400}); const d=parsed.data; const exists=await prisma.user.findUnique({where:{email:d.email}}); if(exists) return NextResponse.json({error:'Email already registered'},{status:409}); const passwordHash=await bcrypt.hash(d.password,12); const user=await prisma.user.create({data:{email:d.email,passwordHash,role:d.role,phone:d.phone,customer:d.role==='CUSTOMER'?{create:{fullName:d.fullName,location:d.location}}:undefined,professional:d.role==='PROFESSIONAL'?{create:{fullName:d.fullName,location:d.location}}:undefined},select:{id:true,email:true,role:true}}); return NextResponse.json({user},{status:201}); }
