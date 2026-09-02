import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { ScrollReveal } from '@/components/scroll-reveal';
import { Counter } from '@/components/counter';

export const dynamic = 'force-dynamic';

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Find a service',
    text: 'Search or browse by category to find the right kind of professional for your job.',
  },
  {
    step: '02',
    title: 'Choose a verified pro',
    text: 'Compare ratings, experience and completed jobs before you decide who to book.',
  },
  {
    step: '03',
    title: 'Book & pay securely',
    text: 'Confirm the job details and pay through a protected, trackable transaction.',
  },
  {
    step: '04',
    title: 'Get the job done',
    text: 'Your professional completes the work — rate and review once it is finished.',
  },
];

const TRUST_POINTS = [
  {
    icon: '✓',
    title: 'Verified professionals',
    text: 'Every professional passes an identity review before they can accept a job.',
  },
  {
    icon: '◈',
    title: 'Secure payments',
    text: 'Funds are held safely and only released once a job is confirmed complete.',
  },
  {
    icon: '★',
    title: 'Real customer reviews',
    text: 'Ratings come only from customers with a completed job on the platform.',
  },
  {
    icon: '◎',
    title: 'Service accountability',
    text: 'Every job is tracked from request to completion, with support if something goes wrong.',
  },
];

// Placeholder testimonials — swap for real customer quotes before launch.
const TESTIMONIALS = [
  {
    quote:
      'I needed a plumber the same day and had someone verified at my door within hours.',
    name: 'Amaka O.',
    role: 'Homeowner, Lagos',
  },
  {
    quote:
      'Managing maintenance requests for our estate used to take days. Now it takes minutes.',
    name: 'Tunde F.',
    role: 'Estate manager, Abuja',
  },
  {
    quote:
      'Getting verified opened up a steady stream of jobs I would not have found on my own.',
    name: 'Chiamaka N.',
    role: 'Electrician, Port Harcourt',
  },
];

export default async function Home() {
  const [
    categories,
    verifiedCount,
    completedJobsCount,
    customerCount,
  ] = await Promise.all([
    prisma.serviceCategory.findMany({
      where: { active: true },
      take: 12,
      orderBy: { name: 'asc' },
    }),
    prisma.professional.count({
      where: { verificationStatus: 'APPROVED' },
    }),
    prisma.job.count({
      where: { status: 'SETTLED' },
    }),
    prisma.customer.count(),
  ]);

  return (
    <main className="tp-page">
      <ScrollReveal />

      <noscript>
        <style>{`
          .reveal {
            opacity: 1 !important;
            transform: none !important;
          }
        `}</style>
      </noscript>

      <style>{`
        .tp-page {
          --tp-ink: #101828;
          --tp-muted: #667085;
          --tp-light: #f7f9fc;
          --tp-border: #e4e7ec;
          --tp-blue: #155eef;
          --tp-blue-dark: #0b4bc4;
          --tp-navy: #0b1220;
          --tp-white: #ffffff;
          --tp-green: #12b76a;
          background: #fff;
          color: var(--tp-ink);
          overflow: hidden;
        }

        .tp-page *,
        .tp-page *::before,
        .tp-page *::after {
          box-sizing: border-box;
        }

        .tp-page a {
          text-decoration: none;
        }

        .tp-container {
          width: min(1180px, calc(100% - 40px));
          margin: 0 auto;
        }

        /* NAVIGATION */

        .tp-nav-wrap {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(255,255,255,.88);
          backdrop-filter: blur(18px);
          border-bottom: 1px solid rgba(228,231,236,.75);
        }

        .tp-nav {
          min-height: 76px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 30px;
        }

        .tp-logo {
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }

        .tp-logo img {
          width: 154px;
          height: auto;
          max-height: 48px;
          object-fit: contain;
          display: block;
        }

        .tp-nav-links {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 26px;
          flex: 1;
        }

        .tp-nav-links a {
          color: #475467;
          font-size: 14px;
          font-weight: 600;
          transition: .2s ease;
          white-space: nowrap;
        }

        .tp-nav-links a:hover {
          color: var(--tp-blue);
        }

        .tp-nav-signup {
          color: #fff !important;
          background: var(--tp-blue);
          padding: 12px 19px;
          border-radius: 10px;
          box-shadow: 0 5px 14px rgba(21,94,239,.18);
        }

        .tp-nav-signup:hover {
          background: var(--tp-blue-dark);
          color: #fff !important;
          transform: translateY(-1px);
        }

        /* HERO */

        .tp-hero {
          position: relative;
          background:
            radial-gradient(circle at 80% 20%, rgba(21,94,239,.10), transparent 30%),
            linear-gradient(180deg, #f8fbff 0%, #fff 100%);
          padding: 86px 0 65px;
        }

        .tp-hero::before {
          content: '';
          position: absolute;
          width: 520px;
          height: 520px;
          border-radius: 50%;
          background: rgba(21,94,239,.045);
          right: -250px;
          top: -180px;
          pointer-events: none;
        }

        .tp-hero-grid {
          position: relative;
          display: grid;
          grid-template-columns: 1.08fr .92fr;
          align-items: center;
          gap: 65px;
        }

        .tp-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          margin: 0 0 19px;
          color: var(--tp-blue);
          font-size: 12px;
          font-weight: 800;
          letter-spacing: .13em;
          text-transform: uppercase;
        }

        .tp-eyebrow::before {
          content: '';
          width: 28px;
          height: 2px;
          background: var(--tp-blue);
          border-radius: 2px;
        }

        .tp-hero h1 {
          max-width: 720px;
          margin: 0;
          color: #0b1220;
          font-size: clamp(46px, 6vw, 76px);
          line-height: .98;
          letter-spacing: -.055em;
          font-weight: 800;
        }

        .tp-hero h1 em {
          color: var(--tp-blue);
          font-style: normal;
        }

        .tp-hero-copy {
          max-width: 600px;
          margin: 25px 0 0;
          color: #667085;
          font-size: 19px;
          line-height: 1.7;
        }

        .tp-hero-actions {
          display: flex;
          align-items: center;
          gap: 13px;
          flex-wrap: wrap;
          margin-top: 32px;
        }

        .tp-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          min-height: 52px;
          padding: 0 22px;
          background: var(--tp-blue);
          color: #fff;
          border-radius: 11px;
          font-size: 15px;
          font-weight: 700;
          box-shadow: 0 12px 25px rgba(21,94,239,.20);
          transition: .22s ease;
        }

        .tp-primary:hover {
          background: var(--tp-blue-dark);
          transform: translateY(-2px);
          box-shadow: 0 15px 30px rgba(21,94,239,.25);
        }

        .tp-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 52px;
          padding: 0 21px;
          border: 1px solid #d0d5dd;
          background: #fff;
          color: #344054;
          border-radius: 11px;
          font-size: 15px;
          font-weight: 700;
          transition: .2s ease;
        }

        .tp-secondary:hover {
          border-color: var(--tp-blue);
          color: var(--tp-blue);
        }

        .tp-hero-note {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 22px;
          color: #667085;
          font-size: 13px;
        }

        .tp-check {
          width: 23px;
          height: 23px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #e9f8f1;
          color: var(--tp-green);
          font-weight: 800;
        }

        /* HERO CARD */

        .tp-hero-visual {
          position: relative;
          min-height: 430px;
          border-radius: 28px;
          padding: 30px;
          background:
            linear-gradient(145deg, #0d1b33 0%, #122b52 58%, #155eef 100%);
          box-shadow: 0 30px 70px rgba(16,24,40,.18);
          overflow: hidden;
        }

        .tp-hero-visual::before {
          content: '';
          position: absolute;
          width: 300px;
          height: 300px;
          border: 1px solid rgba(255,255,255,.10);
          border-radius: 50%;
          right: -90px;
          top: -80px;
        }

        .tp-hero-visual::after {
          content: '';
          position: absolute;
          width: 420px;
          height: 420px;
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 50%;
          left: -190px;
          bottom: -260px;
        }

        .tp-dashboard-top {
          position: relative;
          z-index: 2;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
        }

        .tp-dashboard-title {
          color: #fff;
          font-size: 18px;
          font-weight: 800;
        }

        .tp-live {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 7px 10px;
          background: rgba(255,255,255,.10);
          border: 1px solid rgba(255,255,255,.13);
          border-radius: 999px;
          color: #d1fadf;
          font-size: 11px;
          font-weight: 700;
        }

        .tp-live::before {
          content: '';
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #32d583;
          box-shadow: 0 0 0 4px rgba(50,213,131,.13);
        }

        .tp-search-card {
          position: relative;
          z-index: 2;
          background: #fff;
          border-radius: 18px;
          padding: 18px;
          box-shadow: 0 20px 35px rgba(0,0,0,.15);
        }

        .tp-search-label {
          display: block;
          color: #344054;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 9px;
        }

        .tp-search-field {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 14px;
          border: 1px solid #e4e7ec;
          border-radius: 11px;
          color: #98a2b3;
          font-size: 13px;
        }

        .tp-search-icon {
          width: 17px;
          height: 17px;
          border: 2px solid #98a2b3;
          border-radius: 50%;
          position: relative;
          flex-shrink: 0;
        }

        .tp-search-icon::after {
          content: '';
          width: 7px;
          height: 2px;
          background: #98a2b3;
          position: absolute;
          right: -5px;
          bottom: -2px;
          transform: rotate(45deg);
          border-radius: 2px;
        }

        .tp-category-pills {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 14px;
        }

        .tp-category-pill {
          padding: 8px 10px;
          border-radius: 8px;
          background: #f2f4f7;
          color: #475467;
          font-size: 11px;
          font-weight: 700;
        }

        .tp-job-card {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 13px;
          margin-top: 14px;
          padding: 15px;
          background: rgba(255,255,255,.10);
          border: 1px solid rgba(255,255,255,.11);
          border-radius: 15px;
          color: #fff;
        }

        .tp-avatar {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,.14);
          font-weight: 800;
        }

        .tp-job-main {
          flex: 1;
        }

        .tp-job-main b {
          display: block;
          font-size: 13px;
        }

        .tp-job-main span {
          display: block;
          margin-top: 3px;
          color: #b9c8dd;
          font-size: 11px;
        }

        .tp-verified {
          padding: 6px 8px;
          border-radius: 7px;
          background: rgba(50,213,131,.12);
          color: #6ce9a6;
          font-size: 10px;
          font-weight: 800;
        }

        /* STATS */

        .tp-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
          margin-top: 58px;
          background: #fff;
          border: 1px solid var(--tp-border);
          border-radius: 18px;
          box-shadow: 0 10px 35px rgba(16,24,40,.05);
          overflow: hidden;
        }

        .tp-stat {
          padding: 27px 30px;
          border-right: 1px solid var(--tp-border);
        }

        .tp-stat:last-child {
          border-right: 0;
        }

        .tp-stat strong {
          display: block;
          color: #101828;
          font-size: 32px;
          line-height: 1;
          letter-spacing: -.04em;
        }

        .tp-stat span {
          display: block;
          margin-top: 9px;
          color: #98a2b3;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .11em;
        }

        /* GENERAL SECTIONS */

        .tp-section {
          padding: 100px 0;
        }

        .tp-section-light {
          background: #f8fafc;
        }

        .tp-section-dark {
          background: #0b1220;
          color: #fff;
        }

        .tp-section-heading {
          max-width: 700px;
          margin-bottom: 45px;
        }

        .tp-section-heading h2 {
          margin: 0;
          font-size: clamp(34px, 4vw, 50px);
          line-height: 1.08;
          letter-spacing: -.045em;
        }

        .tp-section-heading p {
          margin: 17px 0 0;
          color: var(--tp-muted);
          line-height: 1.7;
          font-size: 16px;
        }

        .tp-section-dark .tp-section-heading p {
          color: #98a2b3;
        }

        /* SERVICES */

        .tp-services {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }

        .tp-service {
          min-height: 120px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          padding: 20px;
          border: 1px solid var(--tp-border);
          border-radius: 15px;
          background: #fff;
          color: #101828;
          font-weight: 750;
          transition: .22s ease;
        }

        .tp-service::after {
          content: '↗';
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f2f4f7;
          color: #667085;
          font-size: 14px;
          transition: .2s ease;
        }

        .tp-service:hover {
          border-color: #b2ccff;
          transform: translateY(-4px);
          box-shadow: 0 14px 30px rgba(16,24,40,.08);
        }

        .tp-service:hover::after {
          background: var(--tp-blue);
          color: #fff;
        }

        /* TRUST */

        .tp-trust-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .tp-trust-card {
          padding: 28px;
          border: 1px solid #e4e7ec;
          background: #fff;
          border-radius: 18px;
          transition: .22s ease;
        }

        .tp-trust-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 15px 30px rgba(16,24,40,.07);
        }

        .tp-icon {
          width: 45px;
          height: 45px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: #eef4ff;
          color: var(--tp-blue);
          font-size: 20px;
          font-weight: 900;
          margin-bottom: 24px;
        }

        .tp-trust-card b {
          display: block;
          font-size: 16px;
        }

        .tp-trust-card p {
          margin: 10px 0 0;
          color: #667085;
          line-height: 1.65;
          font-size: 13px;
        }

        /* STEPS */

        .tp-steps {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          border-top: 1px solid var(--tp-border);
          border-bottom: 1px solid var(--tp-border);
        }

        .tp-step {
          position: relative;
          min-height: 255px;
          padding: 30px 27px;
          border-right: 1px solid var(--tp-border);
        }

        .tp-step:last-child {
          border-right: 0;
        }

        .tp-step-number {
          display: block;
          margin-bottom: 55px;
          color: var(--tp-blue);
          font-size: 12px;
          font-weight: 900;
          letter-spacing: .12em;
        }

        .tp-step b {
          display: block;
          font-size: 18px;
        }

        .tp-step p {
          color: #667085;
          font-size: 13px;
          line-height: 1.65;
          margin: 10px 0 0;
        }

        /* SPLIT SECTIONS */

        .tp-split {
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          gap: 90px;
        }

        .tp-split.reverse .tp-copy {
          order: 2;
        }

        .tp-split.reverse .tp-list {
          order: 1;
        }

        .tp-copy h2 {
          margin: 0;
          max-width: 600px;
          font-size: clamp(34px, 4vw, 52px);
          line-height: 1.06;
          letter-spacing: -.045em;
        }

        .tp-copy p {
          max-width: 570px;
          margin: 19px 0 0;
          color: #667085;
          font-size: 16px;
          line-height: 1.75;
        }

        .tp-copy .tp-primary {
          margin-top: 27px;
        }

        .tp-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 12px;
        }

        .tp-list li {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 20px;
          background: #fff;
          border: 1px solid var(--tp-border);
          border-radius: 13px;
          color: #344054;
          font-weight: 650;
        }

        .tp-list li::before {
          content: '✓';
          width: 28px;
          height: 28px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #eef4ff;
          color: var(--tp-blue);
          font-weight: 900;
          font-size: 12px;
        }

        /* PROFESSIONAL CTA */

        .tp-pro-box {
          display: grid;
          grid-template-columns: 1.1fr .9fr;
          gap: 70px;
          align-items: center;
          padding: 60px;
          border-radius: 28px;
          background:
            radial-gradient(circle at 90% 10%, rgba(21,94,239,.18), transparent 30%),
            #0b1220;
          color: #fff;
          overflow: hidden;
          position: relative;
        }

        .tp-pro-box h2 {
          margin: 0;
          max-width: 650px;
          font-size: clamp(35px, 4vw, 52px);
          line-height: 1.05;
          letter-spacing: -.045em;
        }

        .tp-pro-box p {
          max-width: 590px;
          color: #98a2b3;
          line-height: 1.75;
          margin: 20px 0 0;
        }

        .tp-benefits {
          display: grid;
          gap: 10px;
        }

        .tp-benefit {
          padding: 18px 20px;
          border: 1px solid rgba(255,255,255,.10);
          border-radius: 13px;
          background: rgba(255,255,255,.045);
        }

        .tp-benefit b {
          display: block;
          font-size: 14px;
        }

        .tp-benefit span {
          display: block;
          color: #98a2b3;
          font-size: 12px;
          margin-top: 4px;
        }

        /* TESTIMONIALS */

        .tp-testimonials {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .tp-testimonial {
          padding: 30px;
          background: #fff;
          border: 1px solid var(--tp-border);
          border-radius: 18px;
        }

        .tp-stars {
          color: #f79009;
          letter-spacing: 2px;
          font-size: 13px;
        }

        .tp-testimonial p {
          margin: 22px 0 28px;
          color: #344054;
          font-size: 15px;
          line-height: 1.7;
        }

        .tp-testimonial b {
          display: block;
          color: #101828;
          font-size: 14px;
        }

        .tp-testimonial span {
          display: block;
          margin-top: 4px;
          color: #98a2b3;
          font-size: 12px;
        }

        /* FINAL CTA */

        .tp-final {
          padding: 110px 20px;
          background:
            radial-gradient(circle at 50% 0%, rgba(21,94,239,.12), transparent 35%),
            #0b1220;
          color: #fff;
          text-align: center;
        }

        .tp-final h2 {
          max-width: 820px;
          margin: 0 auto;
          font-size: clamp(40px, 6vw, 68px);
          line-height: 1;
          letter-spacing: -.055em;
        }

        .tp-final p {
          max-width: 570px;
          margin: 20px auto 0;
          color: #98a2b3;
          line-height: 1.7;
        }

        .tp-final-actions {
          display: flex;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 30px;
        }

        .tp-final .tp-secondary {
          background: transparent;
          border-color: #344054;
          color: #fff;
        }

        .tp-final .tp-secondary:hover {
          border-color: #98a2b3;
          color: #fff;
        }

        /* FOOTER */

        .tp-footer {
          background: #070d18;
          color: #fff;
          padding: 65px 0 25px;
        }

        .tp-footer-top {
          display: grid;
          grid-template-columns: 1.3fr 2fr;
          gap: 70px;
          padding-bottom: 55px;
          border-bottom: 1px solid rgba(255,255,255,.08);
        }

        .tp-footer-logo img {
          width: 155px;
          height: auto;
          display: block;
          filter: brightness(0) invert(1);
          opacity: .95;
        }

        .tp-footer-tagline {
          max-width: 300px;
          color: #667085;
          font-size: 13px;
          line-height: 1.7;
          margin-top: 18px;
        }

        .tp-footer-cols {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 25px;
        }

        .tp-footer-col b {
          display: block;
          margin-bottom: 17px;
          color: #fff;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: .08em;
        }

        .tp-footer-col a {
          display: block;
          color: #667085;
          font-size: 13px;
          margin: 10px 0;
          transition: .2s ease;
        }

        .tp-footer-col a:hover {
          color: #fff;
        }

        .tp-footer-bottom {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          padding-top: 23px;
          color: #475467;
          font-size: 12px;
        }

        /* RESPONSIVE */

        @media (max-width: 1050px) {
          .tp-nav-links {
            gap: 15px;
          }

          .tp-hero-grid {
            gap: 40px;
          }

          .tp-services,
          .tp-trust-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .tp-pro-box {
            padding: 45px;
          }
        }

        @media (max-width: 820px) {
          .tp-nav {
            min-height: 68px;
          }

          .tp-nav-links a:nth-child(2),
          .tp-nav-links a:nth-child(3),
          .tp-nav-links a:nth-child(4) {
            display: none;
          }

          .tp-hero {
            padding: 60px 0 45px;
          }

          .tp-hero-grid,
          .tp-split,
          .tp-pro-box,
          .tp-footer-top {
            grid-template-columns: 1fr;
          }

          .tp-hero-visual {
            min-height: 390px;
          }

          .tp-stats {
            margin-top: 35px;
          }

          .tp-steps {
            grid-template-columns: repeat(2, 1fr);
          }

          .tp-step:nth-child(2) {
            border-right: 0;
          }

          .tp-step:nth-child(-n+2) {
            border-bottom: 1px solid var(--tp-border);
          }

          .tp-testimonials {
            grid-template-columns: 1fr;
          }

          .tp-split.reverse .tp-copy,
          .tp-split.reverse .tp-list {
            order: initial;
          }

          .tp-footer-cols {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 600px) {
          .tp-container {
            width: min(100% - 28px, 1180px);
          }

          .tp-logo img {
            width: 125px;
          }

          .tp-nav-links {
            gap: 8px;
          }

          .tp-nav-links a:nth-child(1),
          .tp-nav-links a:nth-child(5) {
            display: none;
          }

          .tp-nav-signup {
            padding: 10px 13px;
          }

          .tp-hero h1 {
            font-size: 47px;
          }

          .tp-hero-copy {
            font-size: 16px;
          }

          .tp-hero-actions {
            align-items: stretch;
            flex-direction: column;
          }

          .tp-primary,
          .tp-secondary {
            width: 100%;
          }

          .tp-hero-visual {
            min-height: 370px;
            padding: 20px;
            border-radius: 20px;
          }

          .tp-stats {
            grid-template-columns: 1fr;
          }

          .tp-stat {
            border-right: 0;
            border-bottom: 1px solid var(--tp-border);
          }

          .tp-stat:last-child {
            border-bottom: 0;
          }

          .tp-section {
            padding: 70px 0;
          }

          .tp-services,
          .tp-trust-grid,
          .tp-steps {
            grid-template-columns: 1fr;
          }

          .tp-step {
            border-right: 0;
            border-bottom: 1px solid var(--tp-border);
          }

          .tp-step:last-child {
            border-bottom: 0;
          }

          .tp-pro-box {
            padding: 30px 22px;
            border-radius: 20px;
          }

          .tp-footer-cols {
            grid-template-columns: 1fr 1fr;
          }

          .tp-footer-bottom {
            flex-direction: column;
          }
        }
      `}</style>

      {/* NAVIGATION */}
      <div className="tp-nav-wrap">
        <header className="tp-nav tp-container">
          <Link href="/" className="tp-logo">
            <img src="/trux-pylot-logo.png" alt="Trux Pylot" />
          </Link>

          <nav className="tp-nav-links">
            <Link href="/marketplace">Find a professional</Link>
            <Link href="#services">Services</Link>
            <Link href="#how-it-works">How It Works</Link>
            <Link href="/register">Become a Professional</Link>
            <Link href="/login">Log In</Link>
            <Link href="/register" className="tp-nav-signup">
              Sign Up
            </Link>
          </nav>
        </header>
      </div>

      {/* HERO */}
      <section className="tp-hero">
        <div className="tp-container">
          <div className="tp-hero-grid">
            <div className="reveal">
              <p className="tp-eyebrow">TRUSTED PROFESSIONALS, READY TO WORK</p>

              <h1>
                Get the right pro for <em>every job.</em>
              </h1>

              <p className="tp-hero-copy">
                Book dependable, verified experts for your home, business or
                estate — all from one trusted platform.
              </p>

              <div className="tp-hero-actions">
                <Link href="/marketplace" className="tp-primary">
                  Find a professional <span>→</span>
                </Link>

                <Link href="/register" className="tp-secondary">
                  Become a professional
                </Link>
              </div>

              <div className="tp-hero-note">
                <span className="tp-check">✓</span>
                Verified professionals • Secure payments • Tracked jobs
              </div>
            </div>

            <div
              className="tp-hero-visual reveal"
              style={{ transitionDelay: '120ms' }}
            >
              <div className="tp-dashboard-top">
                <span className="tp-dashboard-title">Find a professional</span>
                <span className="tp-live">TRUX PYLOT</span>
              </div>

              <div className="tp-search-card">
                <span className="tp-search-label">
                  What service do you need?
                </span>

                <div className="tp-search-field">
                  <span className="tp-search-icon" />
                  Search for a service...
                </div>

                <div className="tp-category-pills">
                  {categories.slice(0, 4).map((category) => (
                    <span className="tp-category-pill" key={category.id}>
                      {category.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="tp-job-card">
                <div className="tp-avatar">TP</div>

                <div className="tp-job-main">
                  <b>Verified professional</b>
                  <span>Ready to accept your job request</span>
                </div>

                <span className="tp-verified">✓ VERIFIED</span>
              </div>

              <div className="tp-job-card">
                <div className="tp-avatar">₦</div>

                <div className="tp-job-main">
                  <b>Secure payment</b>
                  <span>Your transaction stays protected</span>
                </div>

                <span className="tp-verified">SECURE</span>
              </div>
            </div>
          </div>

          {/* LIVE PLATFORM STATS */}
          <div className="tp-stats reveal">
            <div className="tp-stat">
              <strong>
                <Counter target={verifiedCount} />
              </strong>
              <span>VERIFIED PROFESSIONALS</span>
            </div>

            <div className="tp-stat">
              <strong>
                <Counter target={completedJobsCount} />
              </strong>
              <span>JOBS COMPLETED</span>
            </div>

            <div className="tp-stat">
              <strong>
                <Counter target={customerCount} />
              </strong>
              <span>CUSTOMERS SERVED</span>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="tp-section" id="services">
        <div className="tp-container">
          <div className="tp-section-heading reveal">
            <p className="tp-eyebrow">EXPLORE THE MARKETPLACE</p>
            <h2>Whatever you need done, start here.</h2>
            <p>
              Discover trusted professionals across the services you need
              most.
            </p>
          </div>

          <div className="tp-services">
            {categories.map((category, i) => (
              <Link
                key={category.id}
                href={`/marketplace?category=${category.slug}`}
                className="tp-service reveal"
                style={{ transitionDelay: `${i * 40}ms` }}
              >
                <span>{category.name}</span>
              </Link>
            ))}

            {!categories.length && (
              <p>Service categories are being set up. Check back soon.</p>
            )}
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="tp-section tp-section-light">
        <div className="tp-container">
          <div className="tp-section-heading reveal">
            <p className="tp-eyebrow">WHY TRUX PYLOT</p>
            <h2>Built for trust from booking to payment.</h2>
            <p>
              Every part of the experience is designed to give customers and
              professionals more confidence.
            </p>
          </div>

          <div className="tp-trust-grid">
            {TRUST_POINTS.map((point, i) => (
              <div
                className="tp-trust-card reveal"
                key={point.title}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <span className="tp-icon">{point.icon}</span>
                <b>{point.title}</b>
                <p>{point.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="tp-section" id="how-it-works">
        <div className="tp-container">
          <div className="tp-section-heading reveal">
            <p className="tp-eyebrow">HOW IT WORKS</p>
            <h2>Four simple steps to a job well done.</h2>
          </div>

          <div className="tp-steps">
            {HOW_IT_WORKS.map((step, i) => (
              <div
                className="tp-step reveal"
                key={step.step}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <span className="tp-step-number">{step.step}</span>
                <b>{step.title}</b>
                <p>{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ESTATES */}
      <section className="tp-section tp-section-light">
        <div className="tp-container">
          <div className="tp-split reveal">
            <div className="tp-copy">
              <p className="tp-eyebrow">FOR ESTATES</p>

              <h2>Give your estate a trusted service network.</h2>

              <p>
                Equip your residents with verified professionals for
                maintenance and repairs, backed by a service history for every
                job requested across the estate.
              </p>

              <Link href="/register" className="tp-primary">
                Partner your estate with Trux Pylot →
              </Link>
            </div>

            <ul className="tp-list">
              <li>Verified service providers on call</li>
              <li>Centralized maintenance requests</li>
              <li>Full service history per resident</li>
              <li>Faster turnaround, less back-and-forth</li>
            </ul>
          </div>
        </div>
      </section>

      {/* BUSINESSES */}
      <section className="tp-section">
        <div className="tp-container">
          <div className="tp-split reverse reveal">
            <div className="tp-copy">
              <p className="tp-eyebrow">FOR BUSINESSES</p>

              <h2>Keep operations running, without the chasing.</h2>

              <p>
                Book recurring or one-off professional services for your
                business and track every request from a single place — no more
                chasing down contractors.
              </p>

              <Link href="/register" className="tp-primary">
                Get business services →
              </Link>
            </div>

            <ul className="tp-list">
              <li>Repairs and facility maintenance</li>
              <li>Recurring cleaning and servicing</li>
              <li>Electrical and AC upkeep</li>
              <li>One dashboard for every request</li>
            </ul>
          </div>
        </div>
      </section>

      {/* PROFESSIONALS */}
      <section className="tp-section tp-section-light">
        <div className="tp-container">
          <div className="tp-pro-box reveal">
            <div>
              <p className="tp-eyebrow">FOR PROFESSIONALS</p>

              <h2>Grow your reputation. Get more jobs.</h2>

              <p>
                Get verified, build a rating that speaks for itself, and
                receive job requests from customers, estates and businesses
                actively looking for someone like you.
              </p>

              <Link href="/register" className="tp-primary">
                Become a Trux Pylot professional →
              </Link>
            </div>

            <div className="tp-benefits">
              <div className="tp-benefit">
                <b>Get verified</b>
                <span>Stand out with a trust badge</span>
              </div>

              <div className="tp-benefit">
                <b>Manage jobs</b>
                <span>Accept, quote and track in one place</span>
              </div>

              <div className="tp-benefit">
                <b>Get paid</b>
                <span>Secure, tracked payments</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="tp-section">
        <div className="tp-container">
          <div className="tp-section-heading reveal">
            <p className="tp-eyebrow">WHAT PEOPLE SAY</p>
            <h2>Real people. Real jobs.</h2>
          </div>

          <div className="tp-testimonials">
            {TESTIMONIALS.map((testimonial, i) => (
              <div
                className="tp-testimonial reveal"
                key={testimonial.name}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className="tp-stars">★★★★★</div>

                <p>&ldquo;{testimonial.quote}&rdquo;</p>

                <b>{testimonial.name}</b>
                <span>{testimonial.role}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="tp-final reveal">
        <div className="tp-container">
          <h2>Whatever the job, find someone you can trust.</h2>

          <p>
            From quick repairs to ongoing business maintenance, Trux Pylot
            connects you with professionals ready to work.
          </p>

          <div className="tp-final-actions">
            <Link href="/marketplace" className="tp-primary">
              Find a professional →
            </Link>

            <Link href="/register" className="tp-secondary">
              Join as a professional
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="tp-footer">
        <div className="tp-container">
          <div className="tp-footer-top">
            <div className="tp-footer-logo">
              <Link href="/">
                <img src="/trux-pylot-logo.png" alt="Trux Pylot" />
              </Link>

              <p className="tp-footer-tagline">
                A trusted marketplace connecting customers, businesses and
                estates with verified professionals.
              </p>
            </div>

            <div className="tp-footer-cols">
              <div className="tp-footer-col">
                <b>Company</b>
                <Link href="/#how-it-works">How It Works</Link>
                <Link href="/register">Become a Professional</Link>
                <Link href="/marketplace">For Businesses</Link>
                <Link href="/marketplace">For Estates</Link>
              </div>

              <div className="tp-footer-col">
                <b>Platform</b>
                <Link href="/marketplace">Find a Professional</Link>
                <Link href="/#services">Services</Link>
                <Link href="/login">Log In</Link>
                <Link href="/register">Sign Up</Link>
              </div>

              <div className="tp-footer-col">
                <b>Support</b>
                <a href="mailto:support@truxpylot.co">Help Center</a>
                <a href="mailto:support@truxpylot.co">Contact</a>
              </div>

              <div className="tp-footer-col">
                <b>Account</b>
                <Link href="/login">Admin Login</Link>
                <Link href="/login">Customer Login</Link>
                <Link href="/register">Create Account</Link>
              </div>
            </div>
          </div>

          <div className="tp-footer-bottom">
            <span>
              © {new Date().getFullYear()} Trux Pylot. All rights reserved.
            </span>

            <span>Trusted professionals. Better service.</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
