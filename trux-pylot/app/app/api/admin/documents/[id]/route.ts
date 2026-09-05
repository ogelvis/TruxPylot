import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getVerificationDocumentUrl } from '@/lib/storage';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin permission required.' }, { status: 403 });
  }

  const { id } = await params;
  const doc = await prisma.verificationDocument.findUnique({ where: { id } });
  if (!doc) return NextResponse.json({ error: 'Document not found.' }, { status: 404 });

  try {
    const url = await getVerificationDocumentUrl(doc.privateKey);
    return NextResponse.redirect(url);
  } catch (err) {
    console.error('[admin/documents] signed URL failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Could not open this document right now.' }, { status: 502 });
  }
}
