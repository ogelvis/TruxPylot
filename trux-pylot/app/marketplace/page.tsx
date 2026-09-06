import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type SearchParams = {
  category?: string;
  q?: string;
  location?: string;
  rating?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
};

function money(value: number | null | undefined) {
  if (value == null) return 'Contact for price';
  return `₦${value.toLocaleString('en-NG')}`;
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();
}

function Icon({ type }: { type: 'search' | 'filter' | 'location' | 'star' | 'arrow' | 'check' }) {
  const common = {
    width: 19,
    height: 19,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  if (type === 'search') return <svg {...common}><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.2 4.2" /></svg>;
  if (type === 'filter') return <svg {...common}><path d="M4 6h16M7 12h10M10 18h4" /></svg>;
  if (type === 'location') return <svg {...common}><path d="M20 10c0 5-8 10-8 10S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>;
  if (type === 'star') return <svg {...common}><path d="m12 3 2.7 5.6 6.3.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.5l6.3-.9L12 3Z" /></svg>;
  if (type === 'check') return <svg {...common}><path d="m5 12 4 4L19 6" /></svg>;
  return <svg {...common}><path d="M5 12h13" /><path d="m13 6 6 6-6 6" /></svg>;
}

export default async function Marketplace({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const category = params.category?.trim() || '';
  const q = params.q?.trim() || '';
  const location = params.location?.trim() || '';
  const rating = Number(params.rating || 0);
  const minPrice = Number(params.minPrice || 0);
  const maxPrice = Number(params.maxPrice || 0);
  const sort = params.sort || 'recommended';

  const searchTerms = q
    ? [q, q.toLowerCase(), q.replace(/\s+/g, '-'), q.replace(/\s+/g, ' ')]
    : [];

  const professionalsRaw = await prisma.professional.findMany({
    where: {
      verificationStatus: 'APPROVED',
      ...(category ? { services: { some: { category: { slug: category } } } } : {}),
      ...(rating > 0 ? { rating: { gte: rating } } : {}),
      ...(location ? {
        OR: [
          { location: { contains: location, mode: 'insensitive' } },
          { city: { contains: location, mode: 'insensitive' } },
          { state: { contains: location, mode: 'insensitive' } },
          { area: { contains: location, mode: 'insensitive' } },
        ],
      } : {}),
      ...(q ? {
        AND: [{
          OR: [
            ...searchTerms.map(term => ({ fullName: { contains: term, mode: 'insensitive' as const } })),
            ...searchTerms.map(term => ({ businessName: { contains: term, mode: 'insensitive' as const } })),
            ...searchTerms.map(term => ({ profession: { contains: term, mode: 'insensitive' as const } })),
            ...searchTerms.map(term => ({ bio: { contains: term, mode: 'insensitive' as const } })),
            ...searchTerms.map(term => ({ location: { contains: term, mode: 'insensitive' as const } })),
            { services: { some: { category: { name: { contains: q, mode: 'insensitive' } } } } },
          ],
        }],
      } : {}),
      ...(minPrice > 0 || maxPrice > 0 ? {
        services: {
          some: {
            ...(category ? { category: { slug: category } } : {}),
            ...(minPrice > 0 || maxPrice > 0 ? {
              startingPrice: {
                ...(minPrice > 0 ? { gte: minPrice } : {}),
                ...(maxPrice > 0 ? { lte: maxPrice } : {}),
              },
            } : {}),
          },
        },
      } : {}),
    },
    include: {
      services: { include: { category: true } },
      premiumPurchases: { where: { status: 'SUCCESS' }, take: 1 },
    },
    orderBy: [{ rating: 'desc' }, { completedJobs: 'desc' }],
  });

  const categories = await prisma.serviceCategory.findMany({ where: { active: true }, orderBy: { name: 'asc' } });
  const selectedCategory = categories.find(c => c.slug === category);

  const professionals = [...professionalsRaw].sort((a, b) => {
    if (sort === 'rating') return b.rating - a.rating || b.completedJobs - a.completedJobs;
    if (sort === 'jobs') return b.completedJobs - a.completedJobs || b.rating - a.rating;
    if (sort === 'price-low') {
      const ap = a.services.find(s => !category || s.category.slug === category)?.startingPrice ?? Number.MAX_SAFE_INTEGER;
      const bp = b.services.find(s => !category || s.category.slug === category)?.startingPrice ?? Number.MAX_SAFE_INTEGER;
      return ap - bp || b.rating - a.rating;
    }
    if (sort === 'price-high') {
      const ap = a.services.find(s => !category || s.category.slug === category)?.startingPrice ?? 0;
      const bp = b.services.find(s => !category || s.category.slug === category)?.startingPrice ?? 0;
      return bp - ap || b.rating - a.rating;
    }
    return (b.premiumPurchases.length - a.premiumPurchases.length) || (b.rating - a.rating) || (b.completedJobs - a.completedJobs);
  });

  const formParams = new URLSearchParams();
  if (category) formParams.set('category', category);

  const categoryName = selectedCategory?.name || 'all services';
  const heading = selectedCategory ? `Find trusted ${selectedCategory.name.toLowerCase()}s` : 'Find a trusted professional';

  return (
    <main className="marketplace-page">
      <header className="site-nav marketplace-nav">
        <Link href="/"><img src="/trux-pylot-logo.png" alt="Trux Pylot" /></Link>
        <nav>
          <a href="/marketplace">Find a professional</a>
          <a className="nav-cta" href="/register">Join as a professional</a>
        </nav>
      </header>

      <section className="marketplace-hero">
        <div className="marketplace-hero-glow" />
        <div className="marketplace-hero-inner">
          <div className="marketplace-copy">
            <span className="marketplace-eyebrow">TRUX PYLOT MARKETPLACE</span>
            <h1>{heading}</h1>
            <p>Search by service, professional or location. Compare verified people by rating, experience and starting price.</p>
          </div>

          <form className="marketplace-search" method="get">
            {category && <input type="hidden" name="category" value={category} />}
            <div className="marketplace-search-field">
              <Icon type="search" />
              <input name="q" defaultValue={q} placeholder={`Search ${selectedCategory?.name.toLowerCase() || 'services or professionals'}...`} aria-label="Search services or professionals" />
            </div>
            <button type="submit">Search <Icon type="arrow" /></button>
          </form>
        </div>
      </section>

      <section className="marketplace-content">
        <div className="marketplace-shell">
          <div className="marketplace-category-row">
            <div>
              <span className="marketplace-label">BROWSE BY SERVICE</span>
              <h2>{selectedCategory ? selectedCategory.name : 'All services'}</h2>
            </div>
            <span className="marketplace-count">{professionals.length} professional{professionals.length === 1 ? '' : 's'}</span>
          </div>

          <div className="marketplace-categories">
            <Link href="/marketplace" className={!category ? 'active' : ''}>All</Link>
            {categories.map(c => (
              <Link key={c.id} href={`/marketplace?category=${c.slug}`} className={category === c.slug ? 'active' : ''}>{c.name}</Link>
            ))}
          </div>

          <form className="marketplace-filter-panel" method="get">
            {category && <input type="hidden" name="category" value={category} />}
            {q && <input type="hidden" name="q" value={q} />}
            <div className="filter-heading"><span><Icon type="filter" /> Refine results</span><Link href={category ? `/marketplace?category=${category}` : '/marketplace'}>Clear filters</Link></div>
            <div className="marketplace-filters">
              <label><span>Location</span><div className="filter-input"><Icon type="location" /><input name="location" defaultValue={location} placeholder="City, state or area" /></div></label>
              <label><span>Minimum rating</span><select name="rating" defaultValue={rating || ''}><option value="">Any rating</option><option value="4">4.0+ stars</option><option value="4.5">4.5+ stars</option><option value="4.8">4.8+ stars</option></select></label>
              <label><span>Min. price</span><input name="minPrice" type="number" min="0" step="1000" defaultValue={minPrice || ''} placeholder="₦0" /></label>
              <label><span>Max. price</span><input name="maxPrice" type="number" min="0" step="1000" defaultValue={maxPrice || ''} placeholder="No limit" /></label>
              <label><span>Sort by</span><select name="sort" defaultValue={sort}><option value="recommended">Recommended</option><option value="rating">Highest rated</option><option value="jobs">Most completed jobs</option><option value="price-low">Lowest starting price</option><option value="price-high">Highest starting price</option></select></label>
              <button type="submit" className="filter-apply"><Icon type="filter" /> Apply filters</button>
            </div>
          </form>

          <div className="marketplace-results-head">
            <div><strong>{professionals.length}</strong> verified professional{professionals.length === 1 ? '' : 's'} {q ? <>matching <b>“{q}”</b></> : <>available for {categoryName}</>}</div>
            {sort !== 'recommended' && <span className="sort-note">Sorted by {sort === 'rating' ? 'rating' : sort === 'jobs' ? 'completed jobs' : sort === 'price-low' ? 'lowest price' : 'highest price'}</span>}
          </div>

          <div className="professional-grid marketplace-grid">
            {professionals.map(p => {
              const service = p.services.find(s => !category || s.category.slug === category) || p.services[0];
              return (
                <Link key={p.id} href={`/marketplace/${p.id}`} className="professional-card marketplace-card">
                  <div className="marketplace-card-top">
                    <div className="marketplace-avatar">
                      {p.avatarUrl ? <img src={p.avatarUrl} alt={p.fullName} /> : <span>{initials(p.fullName)}</span>}
                    </div>
                    <div className="marketplace-card-title">
                      <div className="card-badges">
                        {p.premiumPurchases.length > 0 && <span className="premium-badge">★ Premium</span>}
                        <span className="verified-badge"><Icon type="check" /> Verified</span>
                      </div>
                      <b>{p.businessName || p.fullName}</b>
                      <span>{p.profession || service?.category.name || 'Professional'}</span>
                    </div>
                  </div>
                  <div className="marketplace-rating"><span><Icon type="star" /> {p.rating.toFixed(1)}</span><span>{p.completedJobs} jobs completed</span></div>
                  <p className="professional-meta"><Icon type="location" /> {p.location || p.city || p.state || 'Location not specified'}</p>
                  {p.services.length > 0 && <div className="professional-tags">{p.services.slice(0, 4).map(s => <span key={s.id} className="tag">{s.category.name}</span>)}</div>}
                  <div className="marketplace-card-bottom"><span>From <strong>{money(service?.startingPrice)}</strong></span><span className="view-profile">View profile <Icon type="arrow" /></span></div>
                </Link>
              );
            })}
            {!professionals.length && (
              <div className="marketplace-empty">
                <div className="marketplace-empty-icon"><Icon type="search" /></div>
                <h3>No professionals found</h3>
                <p>Try another search, broaden your location, or remove one of the filters.</p>
                <Link href={category ? `/marketplace?category=${category}` : '/marketplace'}>Reset search</Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
