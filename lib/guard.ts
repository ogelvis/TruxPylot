import { redirect } from 'next/navigation';
import { Role } from '@prisma/client';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
export async function requireRole(role:Role){const session=await getSession();if(!session)redirect('/login');if(session.role!==role)redirect('/dashboard');const user=await prisma.user.findUnique({where:{id:session.userId},select:{status:true,suspendedUntil:true,role:true}});if(!user||user.status==='BLOCKED'||(user.status==='SUSPENDED'&&(!user.suspendedUntil||user.suspendedUntil>new Date())))redirect('/login?blocked=1');return session;}
