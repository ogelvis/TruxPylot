import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { notifyUser, notifyAllAdmins } from '@/lib/notify';
import { sendNotificationEmail } from '@/lib/email';

const input = z.object({ jobPostingId: z.string().min(1), message: z.string().trim().min(10).max(1200) });

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'PROFESSIONAL') return NextResponse.json({ error: 'Verified professional sign-in required.' }, { status: 401 });
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Write a short interest message before sending.' }, { status: 400 });
  const professional = await prisma.professional.findUnique({ where: { userId: session.userId }, include: { user: { select: { email: true } } } });
  if (!professional) return NextResponse.json({ error: 'Professional profile missing.' }, { status: 403 });
  if (professional.verificationStatus !== 'APPROVED') return NextResponse.json({ error: 'Your professional profile must be verified before you can express interest in jobs.' }, { status: 403 });
  const job = await prisma.jobPosting.findUnique({ where: { id: parsed.data.jobPostingId }, include: { customer: { include: { user: { select: { id: true, email: true } } } } } });
  if (!job || job.status !== 'OPEN') return NextResponse.json({ error: 'This job opening is no longer available.' }, { status: 404 });
  const existing = await prisma.jobInterest.findUnique({ where: { jobPostingId_professionalId: { jobPostingId: job.id, professionalId: professional.id } } });
  if (existing) return NextResponse.json({ error: 'You have already expressed interest in this job.' }, { status: 409 });
  const interest = await prisma.jobInterest.create({ data: { jobPostingId: job.id, professionalId: professional.id, jobGiverId: job.customerId, message: parsed.data.message } });
  const proName = professional.accountType === 'BUSINESS' ? (professional.businessName || professional.fullName) : professional.fullName;
  const link = `/job-givers/${job.customerId}`;
  await notifyUser({ userId: job.customer.userId, type: 'JOB_INTEREST', title: 'A professional is interested in your job', body: `${proName} sent a short interest message for “${job.title}”.`, link }).catch(() => {});
  await notifyAllAdmins({ type: 'JOB_INTEREST', title: 'New professional job interest', body: `${proName} is interested in “${job.title}”. Review the opportunity and message from the admin area.`, link: '/dashboard/admin' }).catch(() => {});
  await sendNotificationEmail({ to: job.customer.user.email, subject: `Professional interest: ${job.title}`, title: 'A professional is available and interested', body: `${proName} is interested in your job “${job.title}”. Message: ${parsed.data.message}` , link }).catch(() => {});
  await sendNotificationEmail({ to: process.env.CSD_EMAIL || process.env.SUPPORT_EMAIL || 'info@truxpylot.com', subject: `TruxPylot job interest: ${job.title}`, title: 'New professional job interest', body: `${proName} expressed interest in “${job.title}”. Job giver: ${job.customer.businessName || job.customer.fullName}. Message: ${parsed.data.message}` }).catch(() => {});
  return NextResponse.json({ ok: true, interest });
}
