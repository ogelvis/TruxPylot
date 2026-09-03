import { requireRole } from '@/lib/guard';
import { prisma } from '@/lib/prisma';
import { AppShell } from '@/components/app-shell';
import { ProfileForm } from '@/components/profile-form';
import { AvatarUpload } from '@/components/avatar-upload';

export default async function ManageProfile() {
  const session = await requireRole('PROFESSIONAL');
  const professional = await prisma.professional.findUnique({
    where: { userId: session.userId },
    include: { user: true, services: { include: { category: true } } },
  });
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

          <section className="panel">
            <div className="panel-head"><h2>Services offered</h2></div>
            <div className="job-detail-body">
              {professional.services.length ? (
                <div className="professional-tags">
                  {professional.services.map(s => (
                    <span key={s.id} className="tag">
                      {s.category.name}{s.startingPrice ? ` · from ₦${(s.startingPrice / 100).toLocaleString()}` : ''}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="subcopy" style={{ marginBottom: 0 }}>You have not added any services yet.</p>
              )}
              <p className="hint-text">Service categories are managed by the platform. Contact support to add or change which categories you appear under.</p>
            </div>
          </section>
        </div>
      </main>
    </AppShell>
  );
}
