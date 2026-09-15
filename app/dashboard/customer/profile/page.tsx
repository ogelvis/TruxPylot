import { requireRole } from '@/lib/guard';
import { prisma } from '@/lib/prisma';
import { AppShell } from '@/components/app-shell';
import { CustomerProfileForm } from '@/components/customer-profile-form';
import { AvatarUpload } from '@/components/avatar-upload';
import { JobPostingForm } from '@/components/job-posting-form';

export default async function CustomerProfile() {
  const session = await requireRole('CUSTOMER');
  const customer = await prisma.customer.findUnique({ where: { userId: session.userId }, include: { user: true, jobPostings: { where: { status: 'OPEN' }, orderBy: { createdAt: 'desc' } } } });
  if (!customer) return null;

  return (
    <AppShell role="CUSTOMER" name={customer.fullName} avatarUrl={customer.avatarUrl} active="/dashboard/customer/profile">
      <main className="dash-page">
        <h1>Keep your details current.</h1>
        <p className="subcopy">This helps professionals know where and how to reach you.</p>

        <section className="panel" style={{ maxWidth: 560 }}>
          <AvatarUpload name={customer.fullName} currentUrl={customer.avatarUrl} />
          <div className="panel-head"><h2>Your information</h2></div>
          <div className="job-detail-body">
            <CustomerProfileForm
              fullName={customer.fullName}
              phone={customer.user.phone ?? ''}
              state={customer.state ?? ''}
              city={customer.city ?? ''}
              area={customer.area ?? ''}
              street={customer.street ?? ''}
            />
          </div>
        </section>

        <section className="panel job-giver-panel">
          <div className="panel-head"><div><span className="identity-badge job-giver">{customer.accountType === 'BUSINESS' ? 'BUSINESS / JOB GIVER' : 'JOB GIVER'}</span><h2>Have a job?</h2><p>Post an opening so verified TruxPylot professionals can discover it and express interest.</p></div></div>
          <JobPostingForm />
          {customer.jobPostings.length > 0 && <div className="job-postings-list"><h3>Your open jobs</h3>{customer.jobPostings.map(job => <article className="mini-job" key={job.id}><div><b>{job.title}</b><span>{job.location}</span></div><a href={`/job-givers/${customer.id}`}>View public profile →</a></article>)}</div>}
        </section>
      </main>
    </AppShell>
  );
}
