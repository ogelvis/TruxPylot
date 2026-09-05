import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEFAULT_CATEGORIES = ['Electrical', 'Plumbing', 'AC & Cooling', 'Cleaning', 'Carpentry', 'Solar & Generator'];

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '');
}

/** POST { secret, names?: string[] } — upserts service categories so the
 *  marketplace and professional-profile forms have something to select
 *  from. Safe to call more than once: existing categories are left as-is
 *  (upsert with empty `update`). Guarded by the same secret as
 *  /api/admin/bootstrap since there's no full admin-auth session flow for
 *  one-off setup tasks like this. */
export async function POST(request: Request) {
  const configuredSecret = process.env.ADMIN_BOOTSTRAP_SECRET;
  if (!configuredSecret) {
    return NextResponse.json({ error: 'Not configured on this server.' }, { status: 503 });
  }
  let body: { secret?: string; names?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Send { "secret": "..." } as JSON.' }, { status: 400 });
  }
  if (body.secret !== configuredSecret) {
    return NextResponse.json({ error: 'Invalid secret.' }, { status: 403 });
  }

  const names = body.names?.length ? body.names : DEFAULT_CATEGORIES;
  const created: string[] = [];
  for (const name of names) {
    const slug = slugify(name);
    const result = await prisma.serviceCategory.upsert({
      where: { slug },
      update: {},
      create: { name, slug },
    });
    created.push(result.name);
  }

  return NextResponse.json({ ok: true, categories: created });
}
