import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadAvatar } from '@/lib/storage';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== 'CUSTOMER' && session.role !== 'PROFESSIONAL')) {
    return NextResponse.json({ error: 'Sign in to update your photo.' }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Could not read the uploaded file.' }, { status: 400 });
  }
  const file = formData.get('avatar');
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'Choose an image to upload.' }, { status: 400 });
  }

  let url: string;
  try {
    url = await uploadAvatar(session.userId, file);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not upload your photo. Please try again.';
    console.error('[profile/avatar] upload failed:', message);
    // Validation errors (bad type/too large) are safe to show verbatim —
    // uploadAvatar() throws those with a user-facing message already.
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (session.role === 'CUSTOMER') {
    await prisma.customer.update({ where: { userId: session.userId }, data: { avatarUrl: url } });
  } else {
    await prisma.professional.update({ where: { userId: session.userId }, data: { avatarUrl: url } });
  }

  return NextResponse.json({ url });
}
