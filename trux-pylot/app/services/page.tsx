import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';


function ServiceMark({ slug }: { slug: string }) {
  const common = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const key = slug.toLowerCase();
  if (key.includes('plumb')) return <svg {...common}><path d="M7 4v6a5 5 0 0 0 10 0V4"/><path d="M5 4h4M15 4h4M12 15v5M9 20h6"/></svg>;
  if (key.includes('paint')) return <svg {...common}><path d="m4 20 6-6"/><path d="m9 15 5-5"/><path d="M14 4h5v5"/><path d="m19 4-8 8"/><path d="M4 20h5"/></svg>;
  if (key.includes('electric')) return <svg {...common}><path d="m13 2-8 11h6l-1 9 8-12h-6l1-8Z"/></svg>;
  if (key.includes('graphic') || key.includes('design')) return <svg {...common}><rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 16 3-4 3 2 2-3 3 5"/><circle cx="8" cy="8" r="1"/></svg>;
  if (key.includes('carpent')) return <svg {...common}><path d="m4 19 15-15"/><path d="m7 21-3-3 4-4 3 3-4 4Z"/><path d="m14 10 4 4"/></svg>;
  if (key.includes('weld')) return <svg {...common}><path d="M5 19h8"/><path d="M8 16V7h4l2 3-2 3h-4"/><path d="M15 7h4M16 4v3M19 4v3"/></svg>;
  if (key.includes('clean')) return <svg {...common}><path d="m9 3 6 6"/><path d="m12 6-8 8 4 4 8-8"/><path d="M15 12h5M17 9v6"/></svg>;
  if (key.includes('barber') || key.includes('hair')) return <svg {...common}><path d="M6 4v16M18 4v16"/><path d="M6 8h12M6 16h12"/><path d="M9 8v8M15 8v8"/></svg>;
  if (key.includes('photo') || key.includes('video')) return <svg {...common}><path d="M4 7h4l2-2h4l2 2h4v12H4V7Z"/><circle cx="12" cy="13" r="4"/></svg>;
  if (key.includes('web') || key.includes('software') || key.includes('developer')) return <svg {...common}><path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14"/></svg>;
  if (key.includes('phone') || key.includes('computer') || key.includes('appliance') || key.includes('repair')) return <svg {...common}><rect x="7" y="3" width="10" height="18" rx="2"/><path d="M10 6h4M11 18h2"/></svg>;
  if (key.includes('solar')) return <svg {...common}><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.9 4.9 7 7M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1"/></svg>;
  if (key.includes('mechanic') || key.includes('auto')) return <svg {...common}><path d="M14 6a4 4 0 0 0-5 5L4 16l4 4 5-5a4 4 0 0 0 5-5l-3 3-3-3 2-4Z"/></svg>;
  if (key.includes('delivery') || key.includes('driver') || key.includes('mover')) return <svg {...common}><path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z"/><circle cx="7" cy="19" r="2"/><circle cx="18" cy="19" r="2"/></svg>;
  if (key.includes('chef') || key.includes('cater') || key.includes('baker')) return <svg {...common}><path d="M5 12h14v8H5z"/><path d="M8 12a4 4 0 1 1 8 0"/><path d="M9 16h6"/></svg>;
  if (key.includes('laundry')) return <svg {...common}><circle cx="12" cy="13" r="4"/><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h1M11 7h1"/></svg>;
  if (key.includes('tutor') || key.includes('document') || key.includes('typist')) return <svg {...common}><path d="M5 3h10l4 4v14H5z"/><path d="M15 3v5h4M8 12h8M8 16h6"/></svg>;
  if (key.includes('account') || key.includes('consult')) return <svg {...common}><circle cx="12" cy="8" r="3"/><path d="M5 20a7 7 0 0 1 14 0"/></svg>;
  if (key.includes('print')) return <svg {...common}><path d="M7 9V4h10v5M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><path d="M7 14h10v7H7z"/></svg>;
  if (key.includes('lock') || key.includes('security')) return <svg {...common}><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>;
  if (key.includes('roof') || key.includes('mason') || key.includes('brick')) return <svg {...common}><path d="M3 19h18M4 19V10l8-6 8 6v9M8 19v-5h8v5"/></svg>;
  if (key.includes('garden') || key.includes('landscape') || key.includes('pest')) return <svg {...common}><path d="M12 21V10"/><path d="M12 13c-5 0-7-3-7-7 5 0 7 3 7 7ZM12 16c5 0 7-3 7-7-5 0-7 3-7 7Z"/></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="8.5"/><path d="M12 8v8M8 12h8"/></svg>;
}


export default async function ServicesPage() {
  const categories = await prisma.serviceCategory.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
  });

  return (
    <main className="tp-services-page">
      <style>{`
        .tp-services-page{min-height:100dvh;background:linear-gradient(180deg,#06183d 0,#0b2d78 430px,#f5f8fe 430px,#f5f8fe 100%);color:#10233f;padding-bottom:72px;overflow-x:hidden;-webkit-text-size-adjust:100%}
        .tp-services-page *{box-sizing:border-box}
        .tp-services-page a{-webkit-tap-highlight-color:transparent}
        .tp-services-wrap{width:min(1160px,calc(100% - 40px));margin:0 auto}
        .tp-services-nav{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:20px 0}
        .tp-services-nav img{display:block;width:137px;height:auto;max-height:45px;object-fit:contain;object-position:left;filter:brightness(0) invert(1)}
        .tp-services-back{display:inline-flex;align-items:center;justify-content:center;min-height:42px;color:#dce8ff;font-size:13px;font-weight:800;text-decoration:none;padding:10px 15px;border:1px solid rgba(255,255,255,.18);border-radius:999px;background:rgba(255,255,255,.07);transition:.2s ease}
        .tp-services-back:hover{background:#fff;color:#155eef;transform:translateY(-2px)}
        .tp-services-hero{padding:55px 0 88px;color:#fff;max-width:800px}
        .tp-services-kicker{margin:0 0 14px;color:#73d9ff;font-size:11px;font-weight:900;letter-spacing:1.7px;text-transform:uppercase}
        .tp-services-hero h1{margin:0;font:800 clamp(40px,6vw,70px)/1.02 Manrope,Inter,system-ui,sans-serif;letter-spacing:-3.2px}
        .tp-services-hero p{max-width:680px;margin:20px 0 0;color:#c9d9f7;font-size:17px;line-height:1.7}
        .tp-all-services{margin-top:-32px;position:relative}
        .tp-all-services-head{display:flex;align-items:end;justify-content:space-between;gap:20px;margin-bottom:22px}
        .tp-all-services-head h2{margin:0;font:800 28px/1.1 Manrope,Inter,system-ui,sans-serif;letter-spacing:-1.2px;color:#10233f}
        .tp-all-services-head span{color:#71809a;font-size:13px}
        .tp-all-service-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
        .tp-all-service{position:relative;display:flex;flex-direction:column;min-width:0;min-height:190px;padding:24px;background:#fff;border:1px solid #dfe7f3;border-radius:20px;text-decoration:none;color:#10233f;overflow:hidden;box-shadow:0 14px 35px rgba(13,42,104,.06);transition:transform .25s ease,box-shadow .25s ease,border-color .25s ease}
        .tp-all-service:before{content:"";position:absolute;width:160px;height:160px;right:-75px;top:-75px;border-radius:50%;background:linear-gradient(135deg,#e7f0ff,#effaff);transition:transform .35s ease}
        .tp-all-service:hover{transform:translateY(-6px);border-color:#a9c6f5;box-shadow:0 24px 50px rgba(13,42,104,.14)}
        .tp-all-service:hover:before{transform:scale(1.45)}
        .tp-all-service>*{position:relative;z-index:1}
        .tp-all-service-icon{display:grid;place-items:center;flex:0 0 48px;width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#eef5ff,#e2f5ff);color:#1769ff;border:1px solid #d9e8ff;transition:transform .25s ease,background .25s ease,color .25s ease}
        .tp-all-service:hover .tp-all-service-icon{transform:translateY(-2px);background:linear-gradient(135deg,#1769ff,#19c6ff);color:#fff;border-color:transparent}
        .tp-all-service-icon svg{display:block;width:22px;height:22px}
        .tp-all-service strong{display:block;margin-top:20px;font-size:17px;line-height:1.25;overflow-wrap:anywhere}
        .tp-all-service small{display:block;margin-top:8px;color:#71809a;font-size:12px;line-height:1.55;overflow-wrap:anywhere}
        .tp-all-service-arrow{margin-top:auto;align-self:flex-end;color:#1769ff;font-size:21px;line-height:1;transition:transform .25s ease}
        .tp-all-service:hover .tp-all-service-arrow{transform:translate(4px,-4px)}
        .tp-empty{background:#fff;border:1px solid #dfe7f3;border-radius:18px;padding:40px;color:#71809a}
        .tp-request-cta{margin-top:38px;padding:45px 48px;border-radius:24px;background:linear-gradient(135deg,#1769ff,#0b2d78);color:#fff;display:flex;align-items:center;justify-content:space-between;gap:25px;box-shadow:0 25px 55px rgba(13,42,104,.18);overflow:hidden;position:relative}
        .tp-request-cta:after{content:"";position:absolute;width:300px;height:300px;right:-120px;top:-170px;border:1px solid rgba(255,255,255,.14);border-radius:50%;box-shadow:0 0 0 55px rgba(255,255,255,.03),0 0 0 110px rgba(255,255,255,.02)}
        .tp-request-cta>*{position:relative;z-index:1}
        .tp-request-cta h2{margin:0;font:800 30px/1.15 Manrope,Inter,system-ui,sans-serif;letter-spacing:-1.2px}
        .tp-request-cta p{margin:9px 0 0;color:#cbdcff;font-size:13px;line-height:1.6}
        .tp-request-button{display:inline-flex;align-items:center;justify-content:center;gap:12px;min-height:48px;padding:14px 20px;background:#fff;color:#155eef;border-radius:12px;font-size:13px;font-weight:900;text-decoration:none;white-space:nowrap;transition:.2s ease;box-shadow:0 10px 25px rgba(6,27,80,.19)}
        .tp-request-button:hover{transform:translateY(-3px);box-shadow:0 16px 30px rgba(6,27,80,.25)}
        @media(max-width:980px){.tp-all-service-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.tp-request-cta{padding:35px;flex-direction:column;align-items:flex-start}}
        @media(max-width:640px){.tp-services-page{background:linear-gradient(180deg,#06183d 0,#0b2d78 390px,#f5f8fe 390px,#f5f8fe 100%);padding-bottom:48px}.tp-services-wrap{width:min(100% - 28px,560px)}.tp-services-nav{padding:15px 0}.tp-services-nav img{width:116px;max-height:39px}.tp-services-back{min-height:40px;padding:9px 12px;font-size:12px}.tp-services-hero{padding:40px 0 68px}.tp-services-hero h1{font-size:clamp(38px,11vw,48px);letter-spacing:-2.2px}.tp-services-hero p{font-size:15px;line-height:1.65;margin-top:17px}.tp-all-services{margin-top:-20px}.tp-all-services-head{display:block;margin-bottom:18px}.tp-all-services-head h2{font-size:25px}.tp-all-services-head span{display:block;margin-top:7px;font-size:12px}.tp-all-service-grid{grid-template-columns:1fr;gap:11px}.tp-all-service{min-height:0;padding:19px;border-radius:17px}.tp-all-service-icon{width:44px;height:44px;flex-basis:44px;border-radius:13px}.tp-all-service-icon svg{width:21px;height:21px}.tp-all-service strong{margin-top:15px;font-size:15px}.tp-all-service small{font-size:11.5px;line-height:1.5}.tp-all-service-arrow{margin-top:15px;font-size:20px}.tp-request-cta{margin-top:26px;padding:25px 20px;border-radius:18px;gap:18px}.tp-request-cta h2{font-size:24px}.tp-request-button{width:100%;min-height:50px}}
        @media(max-width:380px){.tp-services-wrap{width:calc(100% - 22px)}.tp-services-back{padding-inline:10px}.tp-services-hero h1{font-size:37px}.tp-all-service{padding:17px}.tp-request-cta{padding:22px 17px}}
        @media(hover:none){.tp-all-service:hover,.tp-services-back:hover,.tp-request-button:hover{transform:none;box-shadow:inherit}.tp-all-service:active{transform:scale(.99)}}
        @media(prefers-reduced-motion:reduce){.tp-services-page *{transition:none!important;animation:none!important}}
      `}</style>

      <div className="tp-services-wrap">
        <nav className="tp-services-nav">
          <Link href="/" aria-label="TruxPylot home"><img src="/trux-pylot-logo.png" alt="TruxPylot" /></Link>
          <Link href="/" className="tp-services-back">← Back Home</Link>
        </nav>

        <header className="tp-services-hero">
          <p className="tp-services-kicker">TRUXPYLOT SERVICES</p>
          <h1>Find the right service for the job.</h1>
          <p>Explore the complete list of services available on TruxPylot and connect with professionals ready to get the work done.</p>
        </header>

        <section className="tp-all-services">
          <div className="tp-all-services-head">
            <h2>All Services</h2>
            <span>{categories.length} service categories available</span>
          </div>

          {categories.length ? (
            <div className="tp-all-service-grid">
              {categories.map((category) => (
                <Link key={category.id} href={`/marketplace?category=${category.slug}`} className="tp-all-service">
                  <ServiceMark slug={category.slug} />
                  <strong>{category.name}</strong>
                  {category.description && <small>{category.description}</small>}
                  <span className="tp-all-service-arrow">↗</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="tp-empty">No active services are available yet.</div>
          )}

          <div className="tp-request-cta">
            <div>
              <h2>Ready to get the job moving?</h2>
              <p>Request a service and find a professional through the TruxPylot marketplace.</p>
            </div>
            <Link href="/marketplace" className="tp-request-button">Request a Service <span>↗</span></Link>
          </div>
        </section>
      </div>
    </main>
  );
}
