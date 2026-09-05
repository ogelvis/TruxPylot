import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { uploadVerificationDocument } from '@/lib/storage';

const RESUBMITTABLE = new Set(['DRAFT', 'REJECTED', 'MORE_INFO_REQUIRED']);

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'PROFESSIONAL') {
    return NextResponse.json({ error: 'Professional sign-in required.' }, { status: 401 });
  }

  const professional = await prisma.professional.findUnique({ where: { userId: session.userId } });
  if (!professional) return NextResponse.json({ error: 'Professional profile missing.' }, { status: 403 });
  if (!RESUBMITTABLE.has(professional.verificationStatus)) {
    return NextResponse.json({ error: 'Your verification is already ' + professional.verificationStatus.toLowerCase().replaceAll('_', ' ') + '.' }, { status: 409 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Could not read the uploaded files.' }, { status: 400 });
  }

  const files = formData.getAll('documents').filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) {
    return NextResponse.json({ error: 'Attach at least one document (e.g. a valid ID or trade certificate).' }, { status: 400 });
  }
  if (files.length > 5) {
    return NextResponse.json({ error: 'You can attach up to 5 documents at once.' }, { status: 400 });
  }

  const uploaded: { path: string; mimeType: string; size: number }[] = [];
  try {
    for (const file of files) {
      uploaded.push(await uploadVerificationDocument(professional.id, file));
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not upload your documents. Please try again.';
    console.error('[professional/verification] upload failed:', message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  await prisma.$transaction(async tx => {
    const req = await tx.verificationRequest.create({
      data: { professionalId: professional.id, status: 'SUBMITTED' },
    });
    await tx.verificationDocument.createMany({
      data: uploaded.map(u => ({ requestId: req.id, privateKey: u.path, mimeType: u.mimeType, size: u.size })),
    });
    await tx.professional.update({ where: { id: professional.id }, data: { verificationStatus: 'SUBMITTED' } });
  });

  return NextResponse.json({ ok: true });
}
