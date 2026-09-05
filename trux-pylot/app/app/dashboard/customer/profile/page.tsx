import { requireRole } from '@/lib/guard';
import { prisma } from '@/lib/prisma';
import { AppShell } from '@/components/app-shell';
import { CustomerProfileForm } from '@/components/customer-profile-form';
import { AvatarUpload } from '@/components/avatar-upload';

export default async function CustomerProfile() {
  const session = await requireRole('CUSTOMER');
  const customer = await prisma.customer.findUnique({ where: { userId: session.userId }, include: { user: true } });
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
      </main>
    </AppShell>
  );
}
