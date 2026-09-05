import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function ServiceMark() {
  return (
    <span className="tp-all-service-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v18M3 12h18" />
        <circle cx="12" cy="12" r="8.5" />
      </svg>
    </span>
  );
}

export default async function ServicesPage() {
  const categories = await prisma.serviceCategory.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
  });

  return (
    <main className="tp-services-page">
      <style>{`
        .tp-services-page{min-height:100vh;background:linear-gradient(180deg,#06183d 0,#0b2d78 390px,#f5f8fe 390px,#f5f8fe 100%);color:#10233f;padding-bottom:80px}
        .tp-services-wrap{width:min(1160px,calc(100% - 40px));margin:auto}
        .tp-services-nav{display:flex;align-items:center;justify-content:space-between;padding:22px 0}
        .tp-services-nav img{width:137px;height:45px;object-fit:cover;object-position:left;filter:brightness(0) invert(1)}
        .tp-services-back{color:#dce8ff;font-size:13px;font-weight:800;text-decoration:none;padding:10px 14px;border:1px solid #ffffff2b;border-radius:999px;background:#ffffff0d;transition:.22s ease}
        .tp-services-back:hover{background:#fff;color:#155eef;transform:translateY(-2px)}
        .tp-services-hero{padding:55px 0 82px;color:#fff;max-width:780px}
        .tp-services-kicker{margin:0 0 14px;color:#7edcff;font-size:11px;font-weight:900;letter-spacing:1.7px;text-transform:uppercase}
        .tp-services-hero h1{margin:0;font:800 clamp(42px,6vw,70px)/.98 Manrope,sans-serif;letter-spacing:-3.5px}
        .tp-services-hero p{max-width:650px;margin:22px 0 0;color:#c9d9f7;font-size:17px;line-height:1.7}
        .tp-all-services{margin-top:-28px;position:relative}
        .tp-all-services-head{display:flex;align-items:end;justify-content:space-between;gap:20px;margin-bottom:22px}
        .tp-all-services-head h2{margin:0;font:800 28px Manrope;letter-spacing:-1.3px;color:#10233f}
        .tp-all-services-head span{color:#71809a;font-size:13px}
        .tp-all-service-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
        .tp-all-service{position:relative;display:flex;flex-direction:column;min-height:190px;padding:25px;background:#fff;border:1px solid #dfe7f3;border-radius:20px;text-decoration:none;color:#10233f;overflow:hidden;box-shadow:0 14px 35px rgba(13,42,104,.06);transition:transform .28s ease,box-shadow .28s ease,border-color .28s ease}
        .tp-all-service:before{content:"";position:absolute;width:150px;height:150px;right:-65px;top:-70px;border-radius:50%;background:linear-gradient(135deg,#dceaff,#eef8ff);transition:transform .35s ease}
        .tp-all-service:hover{transform:translateY(-7px);border-color:#a9c6f5;box-shadow:0 24px 50px rgba(13,42,104,.14)}
        .tp-all-service:hover:before{transform:scale(1.45)}
        .tp-all-service>*{position:relative;z-index:1}
        .tp-all-service-icon{display:grid;place-items:center;width:48px;height:48px;border-radius:15px;background:linear-gradient(135deg,#e9f2ff,#d9edff);color:#1769ff;transition:transform .28s ease,background .28s ease}
        .tp-all-service:hover .tp-all-service-icon{transform:rotate(-7deg) scale(1.08);background:linear-gradient(135deg,#1769ff,#19c6ff);color:#fff}
        .tp-all-service-icon svg{width:22px;height:22px}
        .tp-all-service strong{margin-top:23px;font-size:17px}
        .tp-all-service small{margin-top:8px;color:#71809a;font-size:12px;line-height:1.55}
        .tp-all-service-arrow{margin-top:auto;align-self:flex-end;color:#1769ff;font-size:21px;transition:transform .25s ease}
        .tp-all-service:hover .tp-all-service-arrow{transform:translate(4px,-4px)}
        .tp-empty{background:#fff;border:1px solid #dfe7f3;border-radius:18px;padding:40px;color:#71809a}
        .tp-request-cta{margin-top:38px;padding:45px 48px;border-radius:24px;background:linear-gradient(135deg,#1769ff,#0b2d78);color:#fff;display:flex;align-items:center;justify-content:space-between;gap:25px;box-shadow:0 25px 55px rgba(13,42,104,.18);overflow:hidden;position:relative}
        .tp-request-cta:after{content:"";position:absolute;width:300px;height:300px;right:-120px;top:-170px;border:1px solid #ffffff24;border-radius:50%;box-shadow:0 0 0 55px #ffffff08,0 0 0 110px #ffffff05}
        .tp-request-cta>*{position:relative;z-index:1}
        .tp-request-cta h2{margin:0;font:800 30px Manrope;letter-spacing:-1.3px}
        .tp-request-cta p{margin:9px 0 0;color:#cbdcff;font-size:13px}
        .tp-request-button{display:inline-flex;align-items:center;gap:12px;padding:15px 20px;background:#fff;color:#155eef;border-radius:11px;font-size:13px;font-weight:900;text-decoration:none;white-space:nowrap;transition:.22s ease;box-shadow:0 10px 25px #061b5030}
        .tp-request-button:hover{transform:translateY(-3px);box-shadow:0 16px 30px #061b5040}
        @media(max-width:850px){.tp-all-service-grid{grid-template-columns:repeat(2,1fr)}.tp-request-cta{padding:35px;flex-direction:column;align-items:flex-start}}
        @media(max-width:560px){.tp-services-wrap{width:calc(100% - 28px)}.tp-services-nav img{width:116px;height:39px}.tp-services-hero{padding:42px 0 68px}.tp-services-hero h1{font-size:44px;letter-spacing:-2.3px}.tp-services-hero p{font-size:15px}.tp-all-services-head{display:block}.tp-all-services-head span{display:block;margin-top:7px}.tp-all-service-grid{grid-template-columns:1fr;gap:12px}.tp-all-service{min-height:175px;padding:22px}.tp-request-cta{margin-top:28px;padding:28px 23px;border-radius:19px}.tp-request-cta h2{font-size:25px}.tp-request-button{width:100%;justify-content:center}}
        @media(prefers-reduced-motion:reduce){.tp-services-page *{transition:none!important}}
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
                  <ServiceMark />
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
