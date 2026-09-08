import { requireRole } from '@/lib/guard';
import { AppShell } from '@/components/app-shell';
import ReferralAdminPanel from '@/components/referral-admin-panel';
export default async function AdminReferrals() { await requireRole('ADMIN'); return <AppShell role="ADMIN" name="Administrator" active="/dashboard/admin"><ReferralAdminPanel /></AppShell>; }
