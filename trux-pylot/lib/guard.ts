import { redirect } from 'next/navigation';
import { Role } from '@prisma/client';
import { getSession } from '@/lib/auth';
export async function requireRole(role:Role){const session=await getSession();if(!session)redirect('/login');if(session.role!==role)redirect('/dashboard');return session;}
