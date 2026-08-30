import Link from 'next/link';
import { requireRole } from '@/lib/guard';
import { prisma } from '@/lib/prisma';
import { AppShell } from '@/components/app-shell';
import { Role, UserStatus } from '@prisma/client';

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ q?: string; role?: string; status?: string }> }) {
  await requireRole('ADMIN');
  const { q, role, status } = await searchParams;

  const users = await prisma.user.findMany({
    where: {
      email: q ? { contains: q, mode: 'insensitive' } : undefined,
      role: role && role !== 'ALL' ? (role as Role) : undefined,
      status: status && status !== 'ALL' ? (status as UserStatus) : undefined,
    },
    include: { customer: true, professional: true },
    orderBy: { createdAt: 'desc' },
    take: 60,
  });

  return (
    <AppShell role="ADMIN" name="Platform admin" active="/dashboard/admin/users">
      <main className="dash-page">
        <p className="page-kicker">USER MANAGEMENT</p>
        <h1>Manage platform users.</h1>
        <p className="subcopy">{users.length} user{users.length === 1 ? '' : 's'} shown.</p>

        <form className="user-filters" method="get">
          <input type="text" name="q" placeholder="Search by email…" defaultValue={q} />
          <select name="role" defaultValue={role ?? 'ALL'}>
            <option value="ALL">All roles</option>
            <option value="CUSTOMER">Customers</option>
            <option value="PROFESSIONAL">Professionals</option>
          </select>
          <select name="status" defaultValue={status ?? 'ALL'}>
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="BLOCKED">Blocked</option>
          </select>
          <button type="submit">Filter</button>
        </form>

        <div className="panel">
          {users.length ? users.map(u => (
            <Link href={`/dashboard/admin/users/${u.id}`} className="table-row job-row" key={u.id}>
              <div className="job-name">
                <b>{u.customer?.fullName ?? u.professional?.fullName ?? u.email}</b>
                <span>{u.email} · {u.role.toLowerCase()}</span>
              </div>
              <small>{new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' }).format(u.createdAt)}</small>
              <span className={`status ${u.status.toLowerCase()}`}>{u.status}</span>
            </Link>
          )) : <div className="empty">No users match these filters.</div>}
        </div>
      </main>
    </AppShell>
  );
}
