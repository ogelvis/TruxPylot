import Link from 'next/link';
import { requireRole } from '@/lib/guard';
import { prisma } from '@/lib/prisma';
import { AppShell } from '@/components/app-shell';
import type { Role, UserStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

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
  const active = users.filter(u => u.status === 'ACTIVE').length;
  const professionals = users.filter(u => u.role === 'PROFESSIONAL').length;
  const customers = users.filter(u => u.role === 'CUSTOMER').length;

  return (
    <AppShell role="ADMIN" name="Platform admin" active="/dashboard/admin/users">
      <main className="dash-page admin-users-future">
        <section className="admin-section-hero users-hero">
          <div>
            <span className="admin-future-kicker">MASTER CONTROL / PEOPLE</span>
            <h1>People, <em>organized.</em></h1>
            <p>Find, inspect and manage platform accounts without digging through a generic table.</p>
          </div>
          <div className="admin-hero-orbit"><span>LIVE</span><strong>{users.length}</strong><small>records in view</small></div>
        </section>

        <section className="admin-mini-metrics">
          <div><span>VISIBLE</span><b>{users.length}</b><small>matching accounts</small></div>
          <div><span>ACTIVE</span><b>{active}</b><small>currently active</small></div>
          <div><span>PROS</span><b>{professionals}</b><small>professional accounts</small></div>
          <div><span>CUSTOMERS</span><b>{customers}</b><small>customer accounts</small></div>
        </section>

        <section className="admin-control-panel">
          <div className="admin-panel-label"><span>01</span><div><b>ACCOUNT SEARCH</b><small>Filter the directory safely</small></div></div>
          <form className="admin-user-filters" method="get">
            <label><span>Email</span><input type="text" name="q" placeholder="Search account email…" defaultValue={q} /></label>
            <label><span>Role</span><select name="role" defaultValue={role ?? 'ALL'}><option value="ALL">All roles</option><option value="CUSTOMER">Customers</option><option value="PROFESSIONAL">Professionals</option></select></label>
            <label><span>Status</span><select name="status" defaultValue={status ?? 'ALL'}><option value="ALL">All statuses</option><option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option><option value="BLOCKED">Blocked</option></select></label>
            <button className="admin-future-btn primary" type="submit">Apply filters</button>
          </form>
        </section>

        <section className="admin-user-list">
          <div className="admin-list-head"><div><span>02 / DIRECTORY</span><h2>Platform accounts</h2></div><small>Click an account to inspect its control panel</small></div>
          {users.length ? users.map((u, i) => {
            const display = u.customer?.fullName ?? u.professional?.fullName ?? u.email;
            const initials = display.split(/\s+/).map(x => x[0]).join('').slice(0, 2).toUpperCase();
            return <Link href={`/dashboard/admin/users/${u.id}`} className="admin-user-card" key={u.id}>
              <span className="admin-user-index">{String(i + 1).padStart(2, '0')}</span>
              <span className="admin-user-avatar">{initials}</span>
              <span className="admin-user-main"><b>{display}</b><small>{u.email}</small></span>
              <span className="admin-user-role">{u.role}</span>
              <span className={`admin-user-status ${u.status.toLowerCase()}`}><i />{u.status}</span>
              <span className="admin-user-date">Joined {new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' }).format(u.createdAt)}</span>
              <span className="admin-user-arrow">↗</span>
            </Link>;
          }) : <div className="admin-future-empty"><b>No matching accounts</b><span>Try clearing one of the filters.</span></div>}
        </section>
      </main>
    </AppShell>
  );
}
