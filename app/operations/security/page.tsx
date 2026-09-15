import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { AppShell } from '@/components/app-shell';
import { SecurityCenter } from '@/components/security-center';
export default async function OperationsSecurity(){const session=await getSession();if(!session||!['EDITOR','OPERATOR'].includes(session.role))redirect('/login');return <AppShell role={session.role} name={session.email} active="/operations"><main className="dash-page"><p className="page-kicker">OPERATIONS / SECURITY</p><h1>Account Security</h1><p className="subcopy">Protect your TruxPylot staff account.</p><SecurityCenter /></main></AppShell>}
