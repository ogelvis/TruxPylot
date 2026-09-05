import { requireRole } from '@/lib/guard';
import { prisma } from '@/lib/prisma';
import { AppShell } from '@/components/app-shell';
import { ProfileForm } from '@/components/profile-form';
import { AvatarUpload } from '@/components/avatar-upload';
import { ManageServicesForm } from '@/components/manage-services-form';

export default async function ManageProfile() {
  const session = await requireRole('PROFESSIONAL');
  const [professional, categories] = await Promise.all([
    prisma.professional.findUnique({
      where: { userId: session.userId },
      include: { user: true, services: { include: { category: true } } },
    }),
    prisma.serviceCategory.findMany({ where: { active: true }, orderBy: { name: 'asc' } }),
  ]);
  if (!professional) return null;

  return (
    <AppShell role="PROFESSIONAL" name={professional.fullName} avatarUrl={professional.avatarUrl} verified={professional.verificationStatus==='APPROVED'} active="/dashboard/professional/profile">
      <main className="dash-page">
        <h1>Keep your profile current.</h1>
        <p className="subcopy">Changes here update your public profile and dashboard immediately.</p>

        <div className="detail-grid">
          <section className="panel">
            <AvatarUpload name={professional.fullName} currentUrl={professional.avatarUrl} />
            <div className="panel-head"><h2>Professional information</h2></div>
            <div className="job-detail-body">
              <ProfileForm
                fullName={professional.fullName}
                profession={professional.profession ?? ''}
                bio={professional.bio ?? ''}
                location={professional.location ?? ''}
                yearsExperience={professional.yearsExperience ?? ''}
                phone={professional.user.phone ?? ''}
                verificationStatus={professional.verificationStatus}
              />
            </div>
          </section>

          <ManageServicesForm
            availableCategories={categories}
            currentServices={professional.services}
          />
        </div>
      </main>
    </AppShell>
  );
}
