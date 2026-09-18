import Link from 'next/link';
import { requireRole } from '@/lib/guard';
import { prisma } from '@/lib/prisma';
import { AppShell } from '@/components/app-shell';
import { VerificationStatus } from '@prisma/client';

const STATUSES: VerificationStatus[] = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'MORE_INFO_REQUIRED'];
const STATUS_LABEL: Record<VerificationStatus, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  MORE_INFO_REQUIRED: 'More info required',
};

const dateFmt = new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' });

export default async function VerificationsQueue({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  await requireRole('ADMIN');
  const { q, status } = await searchParams;
  const activeStatus = status && STATUSES.includes(status as VerificationStatus) ? (status as VerificationStatus) : undefined;
  const query = q?.trim();

  const [requests, grouped] = await Promise.all([
    prisma.verificationRequest.findMany({
      where: {
        status: activeStatus,
        OR: query
          ? [
              { id: { contains: query, mode: 'insensitive' } },
              { professional: { fullName: { contains: query, mode: 'insensitive' } } },
              { professional: { user: { email: { contains: query, mode: 'insensitive' } } } },
              { professional: { user: { phone: { contains: query, mode: 'insensitive' } } } },
            ]
          : undefined,
      },
      include: { professional: { include: { user: true } }, documents: true },
      orderBy: { createdAt: activeStatus || query ? 'desc' : 'asc' },
      take: 60,
    }),
    prisma.verificationRequest.groupBy({ by: ['status'], _count: { _all: true } }),
  ]);

  const countFor = (s: VerificationStatus) => grouped.find((g) => g.status === s)?._count._all ?? 0;
  const total = grouped.reduce((sum, g) => sum + g._count._all, 0);

  return (
    <AppShell role="ADMIN" name="Platform admin" active="/dashboard/admin/verifications">
      <main className="dash-page">
        <p className="page-kicker">TRUST OPERATIONS</p>
        <h1>Verification center.</h1>
        <p className="subcopy">Review, approve, reject, or request more information on professional verification submissions.</p>

        <section className="metrics">
          <div className="metric"><span>Total requests</span><b>{total}</b><small>All time</small></div>
          {STATUSES.map((s) => (
            <div className="metric" key={s}>
              <span>{STATUS_LABEL[s]}</span>
              <b>{countFor(s)}</b>
              <small><Link href={`/dashboard/admin/verifications?status=${s}`}>View →</Link></small>
            </div>
          ))}
        </section>

        <form className="user-filters" method="get">
          <input type="text" name="q" placeholder="Search by name, email, phone, or request ID…" defaultValue={query} />
          <select name="status" defaultValue={activeStatus ?? 'ALL'}>
            <option value="ALL">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
          <button type="submit">Filter</button>
        </form>

        <div className="panel">
          {requests.length ? requests.map((r) => (
            <Link href={`/dashboard/admin/verifications/${r.id}`} className="table-row job-row" key={r.id}>
              <div className="job-name">
                <b>{r.professional.fullName}</b>
                <span>{r.professional.user.email} · {r.documents.length} document{r.documents.length === 1 ? '' : 's'}</span>
              </div>
              <small>{r.professional.profession ?? 'Not specified'}</small>
              <small>{dateFmt.format(r.createdAt)}</small>
              <span className={`status ${r.status.toLowerCase()}`}>{r.status.replaceAll('_', ' ')}</span>
            </Link>
          )) : (
            <div className="empty">No verification requests match these filters.</div>
          )}
        </div>
      </main>
    </AppShell>
  );
}
