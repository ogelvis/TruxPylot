import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminSession } from '@/lib/auth';

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
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });

  let body: { names?: string[] };
  try { body = await request.json(); } catch { body = {}; }
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
