import { requireRole } from '@/lib/guard';
import { prisma } from '@/lib/prisma';
import { AppShell } from '@/components/app-shell';
import { ProfileForm } from '@/components/profile-form';
import { AvatarUpload } from '@/components/avatar-upload';
import { ManageServicesForm } from '@/components/manage-services-form';
import { PortfolioComposer } from '@/components/portfolio-composer';
import { PortfolioPost } from '@/components/portfolio-post';

const dateFmt = new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' });

export default async function ManageProfile() {
  const session = await requireRole('PROFESSIONAL');
  const [professional, categories] = await Promise.all([
    prisma.professional.findUnique({
      where: { userId: session.userId },
      include: {
        user: true,
        services: { include: { category: true } },
        portfolioItems: {
          orderBy: { createdAt: 'desc' },
          include: { likes: { select: { id: true } }, comments: { orderBy: { createdAt: 'asc' } } },
        },
      },
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

        <section className="panel">
          <div className="panel-head">
            <h2>Portfolio</h2>
            <span className="profile-section-meta">Shown on your public profile</span>
          </div>
          <div className="job-detail-body">
            {professional.verificationStatus === 'APPROVED' ? (
              <PortfolioComposer />
            ) : (
              <p className="hint-text">Complete verification to start posting photos of your work to your public profile.</p>
            )}
          </div>
          {professional.portfolioItems.length > 0 && (
            <div className="social-post-grid">
              {professional.portfolioItems.map(item => (
                <PortfolioPost
                  key={item.id}
                  id={item.id}
                  images={item.images.length ? item.images : (item.imageUrl ? [item.imageUrl] : [])}
                  caption={item.description}
                  dateLabel={dateFmt.format(item.createdAt)}
                  initialLikeCount={item.likes.length}
                  initialLiked={false}
                  initialComments={item.comments.map(c => ({ id: c.id, authorName: c.authorName, body: c.body, createdAt: c.createdAt.toISOString() }))}
                  canInteract={false}
                  deletable
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </AppShell>
  );
}
