import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEFAULT_CATEGORIES = ['Painter', 'Plumber', 'Electrician', 'Bricklayer / Mason', 'Carpenter', 'Welder', 'Cleaner', 'Barber', 'Hair Stylist', 'Nail Technician', 'Tailor / Fashion Designer', 'Graphic Designer', 'Photographer', 'Videographer', 'Web Designer', 'Software Developer', 'Phone Repair Technician', 'Computer Repair Technician', 'AC Technician', 'Generator Technician', 'Auto Mechanic', 'Car Wash / Detailing', 'Furniture Maker', 'Interior Decorator', 'Tiler', 'POP Installer', 'Aluminium / Glass Installer', 'Door Installer', 'Roofer', 'Landscaper / Gardener', 'Pest Control', 'Mover', 'Truck / Van Driver', 'Delivery Service', 'Caterer', 'Baker', 'Private Chef', 'Laundry Service', 'Babysitter', 'Caregiver', 'Tutor', 'Typist / Document Services', 'Accountant', 'Legal Consultant', 'Social Media Manager', 'Digital Marketer', 'Printing Services', 'Locksmith', 'Security System Installer', 'Satellite / CCTV Installer', 'Solar Installer', 'Water Treatment Technician', 'Refrigerator Technician', 'Appliance Repair Technician'];

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
