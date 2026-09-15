import { requireRole } from '@/lib/guard';
import { AppShell } from '@/components/app-shell';
import { AdminStaffInvite } from '@/components/admin-staff-invite';

export default async function AdminStaffPage() {
  const session = await requireRole('ADMIN');
  return <AppShell role="ADMIN" name="Platform admin" active="/dashboard/admin/staff">
    <AdminStaffInvite />
  </AppShell>;
}
