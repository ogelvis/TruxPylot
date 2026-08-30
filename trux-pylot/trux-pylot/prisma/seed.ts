import { PrismaClient, Role, VerificationStatus } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  for (const name of ['Electrical', 'Plumbing', 'AC & Cooling', 'Cleaning', 'Carpentry', 'Solar & Generator']) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '');
    await prisma.serviceCategory.upsert({ where: { slug }, update: {}, create: { name, slug } });
  }

  // Demo data only — this account is seeded directly and has no matching
  // Supabase auth user, so it can't actually sign in via the app's OTP
  // login. It exists purely to populate the marketplace with a sample
  // professional profile.
  const user = await prisma.user.upsert({
    where: { email: 'pro.demo@truxpylot.test' },
    update: {},
    create: {
      id: randomUUID(),
      email: 'pro.demo@truxpylot.test',
      role: Role.PROFESSIONAL,
      professional: {
        create: {
          fullName: 'Alex Okafor',
          profession: 'Electrician',
          location: 'Lekki, Lagos',
          verificationStatus: VerificationStatus.APPROVED,
          rating: 4.9,
          completedJobs: 128,
          wallet: { create: { availableBalance: 0, pendingBalance: 0 } },
        },
      },
    },
  });

  const professional = await prisma.professional.findUniqueOrThrow({ where: { userId: user.id } });
  const electrical = await prisma.serviceCategory.findUniqueOrThrow({ where: { slug: 'electrical' } });
  await prisma.professionalService.upsert({
    where: { professionalId_categoryId: { professionalId: professional.id, categoryId: electrical.id } },
    update: {},
    create: { professionalId: professional.id, categoryId: electrical.id, startingPrice: 15000 },
  });
}

main().finally(() => prisma.$disconnect());
