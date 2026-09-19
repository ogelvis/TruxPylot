import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { uploadPortfolioImages } from '@/lib/storage';

const MAX_IMAGES = 5;
const MAX_CAPTION_LENGTH = 1000;

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'PROFESSIONAL') {
    return NextResponse.json({ error: 'Professional sign-in required.' }, { status: 401 });
  }

  const professional = await prisma.professional.findUnique({ where: { userId: session.userId } });
  if (!professional) return NextResponse.json({ error: 'Professional profile missing.' }, { status: 403 });
  if (professional.verificationStatus !== 'APPROVED') {
    return NextResponse.json({ error: 'Complete verification before posting to your public profile.' }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Could not read the upload.' }, { status: 400 });
  }

  const caption = String(formData.get('caption') ?? '').trim();
  if (caption.length > MAX_CAPTION_LENGTH) {
    return NextResponse.json({ error: `Caption must be ${MAX_CAPTION_LENGTH} characters or fewer.` }, { status: 400 });
  }

  const files = formData.getAll('images').filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) {
    return NextResponse.json({ error: 'Add at least one image.' }, { status: 400 });
  }
  if (files.length > MAX_IMAGES) {
    return NextResponse.json({ error: `You can upload up to ${MAX_IMAGES} images per post.` }, { status: 400 });
  }

  let urls: string[];
  try {
    urls = await uploadPortfolioImages(professional.id, files);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not upload your images. Please try again.';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const post = await prisma.portfolioItem.create({
    data: {
      professionalId: professional.id,
      title: caption.slice(0, 60) || 'Completed project',
      description: caption || null,
      imageUrl: urls[0],
      images: urls,
      approved: true,
    },
  });

  return NextResponse.json({ ok: true, post });
}
