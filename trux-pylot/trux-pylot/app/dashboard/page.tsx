import { redirect } from 'next/navigation';
import { getSession, dashboardPath } from '@/lib/auth';
export default async function Dashboard(){const session=await getSession();if(!session)redirect('/login');redirect(dashboardPath(session.role));}
