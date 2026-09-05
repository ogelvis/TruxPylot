import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { ScrollReveal } from '@/components/scroll-reveal';
import { Counter } from '@/components/counter';
import { ProPhoto } from '@/components/pro-photo';

export const dynamic = 'force-dynamic';

const PRO_ACCENTS = ['drop', 'spark', 'shield', 'drop'];

const HOW_IT_WORKS = [
  ['01', 'Tell us what you need', 'Choose a service and share a few details about the job.'],
  ['02', 'Meet the right pro', 'Review verified profiles, ratings and experience before you choose.'],
  ['03', 'Track it through', 'Book securely, follow progress and leave a review when it is done.'],
];

function Mark({ type }: { type: 'check' | 'shield' | 'search' | 'clock' | 'star' }) {
  const common = {
    width: 24,
    height: 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  if (type === 'check') return <svg {...common}><path d="m5 12 4 4L19 6" /></svg>;
  if (type === 'shield') return <svg {...common}><path d="M12 3 19 6v5c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6l7-3Z" /><path d="m9 12 2 2 4-4" /></svg>;
  if (type === 'search') return <svg {...common}><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></svg>;
  if (type === 'clock') return <svg {...common}><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" /></svg>;
  return <svg {...common}><path d="m12 3 2.7 5.6 6.3.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.5l6.3-.9L12 3Z" /></svg>;
}

export default async function Home() {
  const [categories, verifiedCount, completedJobsCount, customerCount, featuredPros] = await Promise.all([
    prisma.serviceCategory.findMany({
      where: { active: true },
      take: 12,
      orderBy: { name: 'asc' },
    }),
    prisma.professional.count({ where: { verificationStatus: 'APPROVED' } }),
    prisma.job.count({ where: { status: 'SETTLED' } }),
    prisma.customer.count(),
    prisma.professional.findMany({
      where: { verificationStatus: 'APPROVED' },
      orderBy: { rating: 'desc' },
      take: 4,
    }),
  ]);

  const heroPro = featuredPros[0];
  const heroRating = heroPro?.rating ? Number(heroPro.rating).toFixed(1) : '4.9';

  return (
    <main className="tp-home tp-upgraded-home">
      <style>{`
        .tp-upgraded-home {
          --ink:#07152f;
          --muted:#66748f;
          --line:#e5ebf5;
          --blue:#1769ff;
          --blue-dark:#0a45c7;
          --cyan:#19c6ff;
          --soft:#f5f8ff;
          background:#fff;
          color:var(--ink);
          overflow:hidden;
        }
        .tp-upgraded-home * { box-sizing:border-box; }
        .tp-upgraded-home a { text-decoration:none; }
        .tp-upgraded-home .tp-container { width:min(1180px,calc(100% - 40px)); margin:0 auto; }

        .tp-upgraded-home .tp-nav {
          position:sticky; top:0; z-index:50;
          background:rgba(255,255,255,.88);
          backdrop-filter:blur(18px);
          border-bottom:1px solid rgba(218,226,240,.7);
        }
        .tp-upgraded-home .tp-nav-inner {
          min-height:78px; display:flex; align-items:center; justify-content:space-between; gap:30px;
        }
        .tp-upgraded-home .tp-logo img { display:block; width:155px; height:auto; }
        .tp-upgraded-home .tp-links { display:flex; align-items:center; gap:25px; }
        .tp-upgraded-home .tp-links a:not(.tp-login):not(.tp-signup) {
          color:#596782; font-size:13px; font-weight:650; transition:.2s ease;
        }
        .tp-upgraded-home .tp-links a:hover { color:var(--blue); }
        .tp-upgraded-home .tp-login { color:var(--ink); font-size:13px; font-weight:800; }
        .tp-upgraded-home .tp-signup {
          color:#fff; background:var(--ink); padding:12px 18px; border-radius:12px;
          font-size:13px; font-weight:800; box-shadow:0 8px 20px rgba(7,21,47,.12);
          transition:.2s ease;
        }
        .tp-upgraded-home .tp-signup:hover { transform:translateY(-2px); background:#102b58; }

        .tp-upgraded-home .tp-hero {
          position:relative; padding:88px 0 35px;
          background:
            radial-gradient(circle at 78% 20%,rgba(25,198,255,.17),transparent 27%),
            radial-gradient(circle at 18% 8%,rgba(23,105,255,.11),transparent 28%),
            linear-gradient(180deg,#f7faff 0%,#fff 74%);
        }
        .tp-upgraded-home .tp-hero:before {
          content:""; position:absolute; width:500px; height:500px; right:-220px; top:130px;
          border:1px solid rgba(23,105,255,.1); border-radius:50%;
          box-shadow:0 0 0 70px rgba(23,105,255,.025),0 0 0 140px rgba(23,105,255,.018);
        }
        .tp-upgraded-home .tp-hero-grid {
          display:grid; grid-template-columns:minmax(0,1.03fr) minmax(440px,.97fr);
          align-items:center; gap:60px; position:relative; z-index:1;
        }
        .tp-upgraded-home .tp-kicker {
          margin:0 0 17px; color:var(--blue); font-size:11px; font-weight:900;
          letter-spacing:.18em; text-transform:uppercase;
        }
        .tp-upgraded-home .tp-hero h1 {
          margin:0; max-width:720px; font-size:clamp(48px,6vw,76px);
          line-height:.98; letter-spacing:-.055em; font-weight:900;
        }
        .tp-upgraded-home .tp-hero h1 em { color:var(--blue); font-style:normal; }
        .tp-upgraded-home .tp-lede {
          max-width:610px; margin:25px 0 0; color:#65728a; font-size:17px; line-height:1.75;
        }
        .tp-upgraded-home .tp-actions { display:flex; align-items:center; gap:24px; margin-top:31px; }
        .tp-upgraded-home .tp-button {
          display:inline-flex; align-items:center; justify-content:center; gap:16px;
          min-height:54px; padding:0 23px; border-radius:14px; background:var(--blue);
          color:#fff; font-size:14px; font-weight:850; box-shadow:0 16px 32px rgba(23,105,255,.23);
          transition:.25s ease;
        }
        .tp-upgraded-home .tp-button:hover { transform:translateY(-3px); background:var(--blue-dark); box-shadow:0 20px 38px rgba(23,105,255,.28); }
        .tp-upgraded-home .tp-button span { font-size:20px; }
        .tp-upgraded-home .tp-text-button { color:var(--ink); font-size:14px; font-weight:850; }
        .tp-upgraded-home .tp-text-button:hover { color:var(--blue); }
        .tp-upgraded-home .tp-assurance {
          display:flex; align-items:center; gap:9px; color:#68758d; font-size:12px; font-weight:700; margin:22px 0 0;
        }
        .tp-upgraded-home .tp-assurance > span {
          display:grid; place-items:center; width:25px; height:25px; border-radius:50%;
          background:#e9f8f0; color:#18a968;
        }
        .tp-upgraded-home .tp-assurance svg { width:15px; height:15px; }

        .tp-upgraded-home .tp-hero-art {
          position:relative; min-height:510px; display:flex; align-items:center; justify-content:center;
        }
        .tp-upgraded-home .tp-glow {
          position:absolute; width:390px; height:390px; border-radius:50%;
          background:radial-gradient(circle,rgba(23,105,255,.18),rgba(25,198,255,.08) 42%,transparent 70%);
          filter:blur(8px);
        }
        .tp-upgraded-home .tp-art-orbit {
          position:absolute; border:1px solid rgba(23,105,255,.15); border-radius:50%;
          transform:rotate(-16deg);
        }
        .tp-upgraded-home .orbit-one { width:420px; height:280px; }
        .tp-upgraded-home .orbit-two { width:330px; height:430px; transform:rotate(36deg); border-color:rgba(25,198,255,.13); }
        .tp-upgraded-home .tp-live-card {
          position:relative; z-index:3; width:min(390px,88%); border-radius:26px;
          background:rgba(255,255,255,.92); border:1px solid rgba(222,230,243,.95);
          box-shadow:0 30px 80px rgba(20,49,98,.16); padding:22px;
          transform:rotate(2deg); transition:.35s ease;
        }
        .tp-upgraded-home .tp-live-card:hover { transform:rotate(0) translateY(-7px); }
        .tp-upgraded-home .tp-live-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
        .tp-upgraded-home .tp-available {
          display:inline-flex; align-items:center; gap:7px; padding:8px 10px; border-radius:30px;
          background:#eefaf5; color:#12985d; font-size:10px; font-weight:900; text-transform:uppercase; letter-spacing:.07em;
        }
        .tp-upgraded-home .tp-live-dot { width:7px; height:7px; border-radius:50%; background:#20c778; box-shadow:0 0 0 5px rgba(32,199,120,.1); }
        .tp-upgraded-home .tp-mini-label { color:#9aa6b9; font-size:10px; font-weight:800; }
        .tp-upgraded-home .tp-live-person {
          display:flex; align-items:center; gap:15px; padding:14px; border-radius:18px;
          background:linear-gradient(135deg,#f6f9ff,#edf5ff);
        }
        .tp-upgraded-home .tp-live-avatar { width:62px; height:62px; flex:none; overflow:hidden; border-radius:17px; }
        .tp-upgraded-home .tp-live-avatar > * { width:100%; height:100%; }
        .tp-upgraded-home .tp-live-person strong { display:block; color:var(--ink); font-size:16px; }
        .tp-upgraded-home .tp-live-person span { display:block; margin-top:4px; color:#748198; font-size:11px; }
        .tp-upgraded-home .tp-verified { display:flex; align-items:center; gap:4px; margin-top:8px; color:#168b59!important; font-weight:800; }
        .tp-upgraded-home .tp-verified svg { width:13px; height:13px; }
        .tp-upgraded-home .tp-live-details { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:12px; }
        .tp-upgraded-home .tp-live-detail {
          padding:15px; border:1px solid #e7edf7; border-radius:16px; background:#fff;
        }
        .tp-upgraded-home .tp-live-detail small { display:block; color:#99a5b8; font-size:9px; font-weight:800; text-transform:uppercase; letter-spacing:.08em; }
        .tp-upgraded-home .tp-live-detail b { display:block; margin-top:5px; color:var(--ink); font-size:16px; }
        .tp-upgraded-home .tp-live-detail b span { color:#f4a51c; }
        .tp-upgraded-home .tp-floating {
          position:absolute; z-index:5; display:flex; align-items:center; gap:10px;
          padding:13px 15px; background:#fff; border:1px solid #e6edf7; border-radius:15px;
          box-shadow:0 18px 40px rgba(17,44,88,.13); color:var(--ink);
        }
        .tp-upgraded-home .tp-floating svg { color:var(--blue); width:20px; height:20px; }
        .tp-upgraded-home .tp-floating b { display:block; font-size:12px; }
        .tp-upgraded-home .tp-floating small { display:block; color:#8793a8; font-size:9px; margin-top:3px; }
        .tp-upgraded-home .tp-float-one { top:72px; left:0; }
        .tp-upgraded-home .tp-float-two { bottom:73px; right:-2px; }

        .tp-upgraded-home .tp-stats {
          position:relative; z-index:4; display:grid; grid-template-columns:repeat(3,1fr);
          margin-top:35px; background:#07152f; border-radius:24px; overflow:hidden;
          box-shadow:0 22px 55px rgba(7,21,47,.16);
        }
        .tp-upgraded-home .tp-stats > div { padding:25px 30px; border-right:1px solid rgba(255,255,255,.1); }
        .tp-upgraded-home .tp-stats > div:last-child { border-right:0; }
        .tp-upgraded-home .tp-stats strong { display:block; color:#fff; font-size:31px; letter-spacing:-.04em; }
        .tp-upgraded-home .tp-stats span { display:block; margin-top:4px; color:#93a4c4; font-size:11px; font-weight:750; text-transform:uppercase; letter-spacing:.08em; }

        .tp-upgraded-home .tp-section { padding-top:105px; padding-bottom:105px; }
        .tp-upgraded-home .tp-section-heading { max-width:690px; margin-bottom:42px; }
        .tp-upgraded-home .tp-section-heading h2 {
          margin:0; font-size:clamp(36px,4vw,56px); line-height:1.02; letter-spacing:-.045em;
        }
        .tp-upgraded-home .tp-section-heading > p:last-child { color:#728096; line-height:1.7; margin:17px 0 0; font-size:15px; }

        .tp-upgraded-home .tp-service-list {
          display:grid; grid-template-columns:repeat(4,1fr); gap:12px;
        }
        .tp-upgraded-home .tp-service {
          min-height:130px; padding:21px; display:flex; flex-direction:column; justify-content:space-between;
          border:1px solid var(--line); border-radius:19px; background:#fff; color:var(--ink);
          box-shadow:0 7px 22px rgba(25,55,100,.035); transition:.25s ease;
        }
        .tp-upgraded-home .tp-service:hover {
          border-color:#b9d1ff; transform:translateY(-5px); box-shadow:0 18px 35px rgba(23,105,255,.1);
          background:#f9fbff;
        }
        .tp-upgraded-home .tp-service > span { color:#9aa6b9; font-size:10px; font-weight:900; letter-spacing:.08em; }
        .tp-upgraded-home .tp-service strong { font-size:16px; line-height:1.2; }
        .tp-upgraded-home .tp-service b { align-self:flex-end; color:var(--blue); font-size:20px; }

        .tp-upgraded-home .tp-trust-section {
          padding:105px 0; background:#f4f7fc; position:relative;
        }
        .tp-upgraded-home .tp-trust-grid {
          display:grid; grid-template-columns:1.15fr .85fr .85fr; gap:18px; align-items:stretch;
        }
        .tp-upgraded-home .tp-trust-intro { padding:20px 25px 20px 0; }
        .tp-upgraded-home .tp-trust-intro h2 { margin:0; font-size:clamp(34px,4vw,53px); line-height:1.02; letter-spacing:-.045em; }
        .tp-upgraded-home .tp-trust-intro > p:last-child { color:#758198; line-height:1.75; max-width:480px; }
        .tp-upgraded-home .tp-problem-box,.tp-upgraded-home .tp-solution-box {
          padding:28px; border-radius:22px; background:#fff; border:1px solid #e4eaf4;
        }
        .tp-upgraded-home .tp-solution-box { background:#07152f; border-color:#07152f; color:#fff; }
        .tp-upgraded-home .tp-box-heading { display:flex; gap:13px; align-items:center; }
        .tp-upgraded-home .tp-box-heading h3 { margin:0; font-size:16px; }
        .tp-upgraded-home .tp-box-icon {
          width:42px; height:42px; display:grid; place-items:center; border-radius:13px;
          background:#f2f5fa; color:#738098;
        }
        .tp-upgraded-home .tp-box-icon.solution { background:rgba(255,255,255,.1); color:#59caff; }
        .tp-upgraded-home .tp-problem-box ul,.tp-upgraded-home .tp-solution-box ul { padding:0; margin:25px 0 0; list-style:none; }
        .tp-upgraded-home .tp-problem-box li,.tp-upgraded-home .tp-solution-box li {
          position:relative; padding:13px 0 13px 20px; border-top:1px solid #edf0f5;
          color:#758198; font-size:12px; line-height:1.55;
        }
        .tp-upgraded-home .tp-solution-box li { border-color:rgba(255,255,255,.1); color:#c4d0e5; }
        .tp-upgraded-home .tp-problem-box li:before,.tp-upgraded-home .tp-solution-box li:before {
          content:""; position:absolute; left:0; top:19px; width:6px; height:6px; border-radius:50%; background:#b4bdca;
        }
        .tp-upgraded-home .tp-solution-box li:before { background:#39c8ff; }

        .tp-upgraded-home .tp-steps {
          display:grid; grid-template-columns:repeat(3,1fr); gap:16px;
        }
        .tp-upgraded-home .tp-step {
          min-height:245px; padding:28px; border:1px solid var(--line); border-radius:22px;
          position:relative; overflow:hidden; background:#fff; transition:.25s ease;
        }
        .tp-upgraded-home .tp-step:hover { transform:translateY(-5px); box-shadow:0 20px 45px rgba(15,45,90,.08); }
        .tp-upgraded-home .tp-step:after {
          content:""; position:absolute; width:130px; height:130px; right:-55px; bottom:-55px;
          border-radius:50%; background:#f0f5ff;
        }
        .tp-upgraded-home .tp-step > span {
          display:inline-flex; width:43px; height:43px; align-items:center; justify-content:center;
          border-radius:13px; background:#edf4ff; color:var(--blue); font-size:11px; font-weight:900;
        }
        .tp-upgraded-home .tp-step h3 { margin:45px 0 10px; font-size:19px; }
        .tp-upgraded-home .tp-step p { margin:0; color:#77849a; font-size:13px; line-height:1.7; max-width:290px; }

        .tp-upgraded-home .tp-pros { padding:105px 0; background:#f8faff; }
        .tp-upgraded-home .tp-pro-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:15px; }
        .tp-upgraded-home .tp-pro-card {
          background:#fff; border:1px solid #e5ebf4; border-radius:22px; padding:12px;
          color:var(--ink); transition:.25s ease; box-shadow:0 8px 25px rgba(20,50,90,.035);
        }
        .tp-upgraded-home .tp-pro-card:hover { transform:translateY(-6px); box-shadow:0 20px 45px rgba(20,50,90,.1); border-color:#c9dbfa; }
        .tp-upgraded-home .tp-pro-card > div:last-child { padding:15px 7px 8px; }
        .tp-upgraded-home .tp-pro-card strong { display:block; font-size:15px; }
        .tp-upgraded-home .tp-pro-card > div:last-child > span { display:block; margin-top:4px; color:#78859a; font-size:11px; }
        .tp-upgraded-home .tp-pro-card small { display:flex; align-items:center; gap:5px; margin-top:13px; color:#16925b; font-size:9px; font-weight:850; }
        .tp-upgraded-home .tp-pro-card small svg { width:13px; height:13px; }

        .tp-upgraded-home .tp-final-cta {
          padding:105px 0; background:
            radial-gradient(circle at 78% 50%,rgba(25,198,255,.25),transparent 25%),
            linear-gradient(115deg,#07152f,#0b3274 55%,#1166dc);
          color:#fff; text-align:center; position:relative; overflow:hidden;
        }
        .tp-upgraded-home .tp-final-cta:before {
          content:""; position:absolute; width:500px; height:500px; left:-300px; top:-250px;
          border:1px solid rgba(255,255,255,.09); border-radius:50%;
          box-shadow:0 0 0 70px rgba(255,255,255,.025),0 0 0 140px rgba(255,255,255,.018);
        }
        .tp-upgraded-home .tp-final-cta .tp-container { position:relative; z-index:1; }
        .tp-upgraded-home .tp-final-cta .tp-kicker { color:#61d7ff; }
        .tp-upgraded-home .tp-final-cta h2 {
          max-width:800px; margin:0 auto 31px; font-size:clamp(40px,5vw,65px);
          line-height:1; letter-spacing:-.05em;
        }
        .tp-upgraded-home .tp-button.light { background:#fff; color:#07152f; box-shadow:0 16px 35px rgba(0,0,0,.16); }
        .tp-upgraded-home .tp-button.light:hover { background:#eef6ff; }

        .tp-upgraded-home .tp-footer { background:#fff; padding-top:70px; }
        .tp-upgraded-home .tp-footer-grid {
          display:grid; grid-template-columns:1.6fr 1fr 1fr 1.15fr; gap:35px; padding-bottom:60px;
        }
        .tp-upgraded-home .tp-footer-grid > div { display:flex; flex-direction:column; gap:12px; }
        .tp-upgraded-home .tp-footer-grid > div:first-child { padding-right:25px; }
        .tp-upgraded-home .tp-footer-grid p { color:#7a879b; font-size:12px; line-height:1.7; max-width:280px; }
        .tp-upgraded-home .tp-footer-grid strong { color:var(--ink); font-size:11px; text-transform:uppercase; letter-spacing:.1em; margin-bottom:5px; }
        .tp-upgraded-home .tp-footer-grid a:not(.tp-logo) { color:#77849a; font-size:12px; transition:.2s ease; }
        .tp-upgraded-home .tp-footer-grid a:hover { color:var(--blue); }
        .tp-upgraded-home .tp-footer-bottom {
          min-height:65px; border-top:1px solid #edf0f5; display:flex; align-items:center;
          justify-content:space-between; color:#98a3b4; font-size:10px;
        }

        @media (max-width:980px) {
          .tp-upgraded-home .tp-links { gap:15px; }
          .tp-upgraded-home .tp-links a:not(.tp-login):not(.tp-signup) { display:none; }
          .tp-upgraded-home .tp-hero-grid { grid-template-columns:1fr; gap:25px; }
          .tp-upgraded-home .tp-hero { padding-top:65px; }
          .tp-upgraded-home .tp-hero-art { min-height:450px; }
          .tp-upgraded-home .tp-service-list { grid-template-columns:repeat(3,1fr); }
          .tp-upgraded-home .tp-trust-grid { grid-template-columns:1fr 1fr; }
          .tp-upgraded-home .tp-trust-intro { grid-column:1/-1; padding-right:0; }
          .tp-upgraded-home .tp-pro-grid { grid-template-columns:repeat(2,1fr); }
          .tp-upgraded-home .tp-footer-grid { grid-template-columns:repeat(2,1fr); }
        }

        @media (max-width:650px) {
          .tp-upgraded-home .tp-container { width:min(100% - 28px,1180px); }
          .tp-upgraded-home .tp-nav-inner { min-height:68px; }
          .tp-upgraded-home .tp-logo img { width:130px; }
          .tp-upgraded-home .tp-login { display:none; }
          .tp-upgraded-home .tp-signup { padding:10px 14px; }
          .tp-upgraded-home .tp-hero { padding:55px 0 25px; }
          .tp-upgraded-home .tp-hero h1 { font-size:46px; line-height:1; }
          .tp-upgraded-home .tp-lede { font-size:14px; line-height:1.7; }
          .tp-upgraded-home .tp-actions { flex-direction:column; align-items:stretch; gap:17px; }
          .tp-upgraded-home .tp-button { width:100%; }
          .tp-upgraded-home .tp-text-button { text-align:center; }
          .tp-upgraded-home .tp-hero-art { min-height:395px; }
          .tp-upgraded-home .tp-live-card { width:92%; padding:16px; }
          .tp-upgraded-home .tp-art-orbit { transform:scale(.78) rotate(-16deg); }
          .tp-upgraded-home .orbit-two { transform:scale(.78) rotate(36deg); }
          .tp-upgraded-home .tp-float-one { top:27px; left:-2px; }
          .tp-upgraded-home .tp-float-two { right:-3px; bottom:24px; }
          .tp-upgraded-home .tp-stats { grid-template-columns:1fr; margin-top:10px; }
          .tp-upgraded-home .tp-stats > div { padding:18px 20px; border-right:0; border-bottom:1px solid rgba(255,255,255,.1); }
          .tp-upgraded-home .tp-stats > div:last-child { border-bottom:0; }
          .tp-upgraded-home .tp-section,.tp-upgraded-home .tp-trust-section,.tp-upgraded-home .tp-pros { padding-top:72px; padding-bottom:72px; }
          .tp-upgraded-home .tp-section-heading { margin-bottom:30px; }
          .tp-upgraded-home .tp-section-heading h2,.tp-upgraded-home .tp-trust-intro h2 { font-size:38px; }
          .tp-upgraded-home .tp-service-list { grid-template-columns:repeat(2,1fr); gap:9px; }
          .tp-upgraded-home .tp-service { min-height:112px; padding:16px; }
          .tp-upgraded-home .tp-service strong { font-size:13px; }
          .tp-upgraded-home .tp-trust-grid,.tp-upgraded-home .tp-steps,.tp-upgraded-home .tp-pro-grid { grid-template-columns:1fr; }
          .tp-upgraded-home .tp-trust-intro { grid-column:auto; }
          .tp-upgraded-home .tp-step { min-height:205px; }
          .tp-upgraded-home .tp-step h3 { margin-top:30px; }
          .tp-upgraded-home .tp-final-cta { padding:75px 0; }
          .tp-upgraded-home .tp-final-cta h2 { font-size:42px; }
          .tp-upgraded-home .tp-footer-grid { grid-template-columns:1fr 1fr; gap:28px 20px; }
          .tp-upgraded-home .tp-footer-grid > div:first-child { grid-column:1/-1; }
          .tp-upgraded-home .tp-footer-bottom { flex-direction:column; justify-content:center; gap:5px; text-align:center; }
        }
      `}</style>

      <ScrollReveal />

      <header className="tp-nav">
        <div className="tp-container tp-nav-inner">
          <Link href="/" className="tp-logo" aria-label="Trux Pylot home">
            <img src="/trux-pylot-logo.png" alt="Trux Pylot" />
          </Link>

          <nav className="tp-links" aria-label="Main navigation">
            <Link href="/marketplace">Find a professional</Link>
            <a href="#services">Services</a>
            <a href="#how-it-works">How it works</a>
            <Link href="/register">Become a professional</Link>
            <Link href="/support">Contact</Link>
            <Link href="/login" className="tp-login">Log in</Link>
            <Link href="/register" className="tp-signup">Get started</Link>
          </nav>
        </div>
      </header>

      <section className="tp-hero">
        <div className="tp-container tp-hero-grid">
          <div className="reveal">
            <p className="tp-kicker">THE TRUSTED PROFESSIONAL NETWORK</p>
            <h1>Get the right person for the job. <em>Without the guesswork.</em></h1>
            <p className="tp-lede">
              Find verified professionals across Nigeria, compare real profiles and ratings,
              book with confidence, and keep your service moving from request to completion.
            </p>

            <div className="tp-actions">
              <Link href="/marketplace" className="tp-button">Find a professional <span>↗</span></Link>
              <Link href="/register" className="tp-text-button">Join the network →</Link>
            </div>

            <p className="tp-assurance">
              <span><Mark type="check" /></span>
              Identity-checked professionals across Nigeria
            </p>
          </div>

          <div className="tp-hero-art reveal" style={{ transitionDelay: '120ms' }}>
            <div className="tp-glow" />
            <div className="tp-art-orbit orbit-one" />
            <div className="tp-art-orbit orbit-two" />

            <div className="tp-floating tp-float-one">
              <Mark type="shield" />
              <span><b>Verified network</b><small>Built around trust</small></span>
            </div>

            <div className="tp-floating tp-float-two">
              <Mark type="clock" />
              <span><b>Tracked service</b><small>From request to done</small></span>
            </div>

            <div className="tp-live-card">
              <div className="tp-live-top">
                <span className="tp-available"><i className="tp-live-dot" /> Available now</span>
                <span className="tp-mini-label">TRUX PYLOT NETWORK</span>
              </div>

              <div className="tp-live-person">
                <div className="tp-live-avatar">
                  {heroPro ? (
                    <ProPhoto
                      src={heroPro.avatarUrl}
                      alt={heroPro.fullName}
                      accent={PRO_ACCENTS[0]}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      display: 'grid',
                      placeItems: 'center',
                      background: 'linear-gradient(135deg,#1769ff,#19c6ff)',
                      color: '#fff',
                      fontWeight: 900,
                      fontSize: 22,
                    }}>TP</div>
                  )}
                </div>
                <div>
                  <strong>{heroPro?.fullName ?? 'Verified Professional'}</strong>
                  <span>{heroPro?.profession ?? 'Ready to help with your next job'}</span>
                  <span className="tp-verified"><Mark type="check" /> Verified professional</span>
                </div>
              </div>

              <div className="tp-live-details">
                <div className="tp-live-detail">
                  <small>Customer rating</small>
                  <b><span>★</span> {heroRating}</b>
                </div>
                <div className="tp-live-detail">
                  <small>Network status</small>
                  <b>Available</b>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="tp-container tp-stats reveal">
          <div><strong><Counter target={verifiedCount} /></strong><span>verified professionals</span></div>
          <div><strong><Counter target={completedJobsCount} /></strong><span>jobs completed</span></div>
          <div><strong><Counter target={customerCount} /></strong><span>customers served</span></div>
        </div>
      </section>

      <section className="tp-section tp-container" id="services">
        <div className="tp-section-heading reveal">
          <p className="tp-kicker">START WITH THE JOB</p>
          <h2>Whatever needs doing.</h2>
          <p>One place to discover the people who can do it properly.</p>
        </div>

        <div className="tp-service-list">
          {categories.map((category, index) => (
            <Link
              href={`/marketplace?category=${category.slug}`}
              key={category.id}
              className="tp-service reveal"
              style={{ transitionDelay: `${index * 35}ms` }}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{category.name}</strong>
              <b>↗</b>
            </Link>
          ))}

          {!categories.length && (
            <p className="tp-muted">Service categories are being set up. Check back soon.</p>
          )}
        </div>
      </section>

      <section className="tp-trust-section">
        <div className="tp-container tp-trust-grid">
          <div className="tp-trust-intro reveal">
            <p className="tp-kicker">WHY TRUX PYLOT</p>
            <h2>Good work should never feel like a gamble.</h2>
            <p>
              Finding help should not mean calling random numbers, hoping someone is qualified,
              or wondering what happens when a job goes wrong.
            </p>
          </div>

          <div className="tp-problem-box reveal">
            <div className="tp-box-heading">
              <span className="tp-box-icon problem"><Mark type="search" /></span>
              <h3>The old way</h3>
            </div>
            <ul>
              <li>Who is actually qualified?</li>
              <li>Will they show up when they say they will?</li>
              <li>What happens when the job is poorly done?</li>
              <li>How much time will the search cost?</li>
            </ul>
          </div>

          <div className="tp-solution-box reveal">
            <div className="tp-box-heading">
              <span className="tp-box-icon solution"><Mark type="shield" /></span>
              <h3>The Trux Pylot way</h3>
            </div>
            <ul>
              <li>Verified professionals you can identify</li>
              <li>Real ratings and completed-job feedback</li>
              <li>Secure, tracked service with accountability</li>
              <li>One place to manage the journey</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="tp-section tp-container" id="how-it-works">
        <div className="tp-section-heading reveal">
          <p className="tp-kicker">A BETTER WAY TO GET THINGS DONE</p>
          <h2>Simple from first search to final review.</h2>
        </div>

        <div className="tp-steps">
          {HOW_IT_WORKS.map(([number, title, text], index) => (
            <article
              className="tp-step reveal"
              key={number}
              style={{ transitionDelay: `${index * 80}ms` }}
            >
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="tp-pros">
        <div className="tp-container">
          <div className="tp-section-heading reveal">
            <p className="tp-kicker">PEOPLE BEHIND THE WORK</p>
            <h2>Meet professionals ready to help.</h2>
            <p>Real skills, local knowledge and a reputation to protect.</p>
          </div>

          {featuredPros.length > 0 ? (
            <div className="tp-pro-grid">
              {featuredPros.map((pro, index) => (
                <Link
                  href={`/marketplace/${pro.id}`}
                  className="tp-pro-card reveal"
                  key={pro.id}
                  style={{ transitionDelay: `${index * 70}ms` }}
                >
                  <ProPhoto
                    src={pro.avatarUrl}
                    alt={`${pro.fullName}, ${pro.profession ?? 'professional'}`}
                    accent={PRO_ACCENTS[index % PRO_ACCENTS.length]}
                  />
                  <div>
                    <strong>{pro.fullName}</strong>
                    <span>{pro.profession ?? 'Professional'}</span>
                    <small><Mark type="check" /> Verified professional</small>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="tp-muted" style={{ marginTop: 30 }}>
              Be one of our first verified professionals — <Link href="/register">join Trux Pylot</Link> and get discovered here.
            </p>
          )}
        </div>
      </section>

      <section className="tp-final-cta reveal">
        <div className="tp-container">
          <p className="tp-kicker">YOUR NEXT JOB STARTS HERE</p>
          <h2>Stop guessing. Start with someone you can trust.</h2>
          <Link href="/marketplace" className="tp-button light">Find a professional <span>↗</span></Link>
        </div>
      </section>

      <footer className="tp-footer">
        <div className="tp-container tp-footer-grid">
          <div>
            <Link href="/" className="tp-logo">
              <img src="/trux-pylot-logo.png" alt="Trux Pylot" />
            </Link>
            <p>Trusted professionals, connected to the people who need them.</p>
          </div>

          <div>
            <strong>Explore</strong>
            <Link href="/marketplace">Find a professional</Link>
            <a href="#services">Services</a>
            <a href="#how-it-works">How it works</a>
          </div>

          <div>
            <strong>Join Trux Pylot</strong>
            <Link href="/register">Become a professional</Link>
            <Link href="/login">Log in</Link>
            <Link href="/register">Sign up</Link>
          </div>

          <div>
            <strong>Support</strong>
            <Link href="/support">Talk to an agent</Link>
            <Link href="/privacy">Privacy policy</Link>
            <a href="mailto:info@truxpylot.com">info@truxpylot.com</a>
            <a href="tel:+2348054306905">+234 805 430 6905</a>
            <Link href="/support">Contact & complaints</Link>
          </div>
        </div>

        <div className="tp-container tp-footer-bottom">
          <span>© {new Date().getFullYear()} Trux Pylot</span>
          <span>Built for reliable work across Nigeria.</span>
        </div>
      </footer>
    </main>
  );
}
