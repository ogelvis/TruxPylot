import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AppShell } from '@/components/app-shell';
import { SecurityCenter } from '@/components/security-center';
import { AdminSecurityPanel } from '@/components/admin-security-panel';
export default async function AdminSecurity({ searchParams }: { searchParams: Promise<{ required?: string }> }) { const session=await getSession(); if(!session || !['ADMIN','SUPER_ADMIN'].includes(session.role)) redirect('/login'); const user=await prisma.user.findUnique({where:{id:session.userId},select:{email:true}}); const q=await searchParams; return <AppShell role="ADMIN" name="Platform admin" active="/dashboard/admin/security"><main className="dash-page"><div className="overview-top"><div><p className="page-kicker">CONTROL CENTER / SECURITY</p><h1>Security Center</h1><p className="subcopy">Protect the administrative control plane, review access activity and manage recovery.</p></div><span className="status approved">{user?.email}</span></div><SecurityCenter required={q.required==='1'} /><AdminSecurityPanel /></main></AppShell> }
