'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';

export function WelcomeGate({ authenticated, children }: { authenticated: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  if (authenticated) return <>{children}</>;

  return (
    <section className="tp-welcome-gate" aria-label="Welcome to TruxPylot">
      <div className="tp-welcome-mark tp-welcome-mark-one" aria-hidden="true"><img src="/trux-pylot-logo.png" alt="" /></div>
      <div className="tp-welcome-mark tp-welcome-mark-two" aria-hidden="true"><img src="/trux-pylot-logo.png" alt="" /></div>
      <div className="tp-welcome-mark tp-welcome-mark-three" aria-hidden="true"><img src="/trux-pylot-logo.png" alt="" /></div>

      <div className="tp-welcome-content">
        <div className="tp-welcome-logo-wrap"><img className="tp-welcome-logo" src="/trux-pylot-logo.png" alt="Trux Pylot" /></div>
        <p className="tp-welcome-kicker">THE TRUSTED PROFESSIONAL NETWORK</p>
        <h1>One App. A gigantic ecosystem.</h1>
        <p className="tp-welcome-lede">Find the right professional. Connect with confidence. Get the job done.</p>

        <div className="tp-welcome-actions">
          <Link href="/register" className="tp-welcome-primary">Sign Up <span>→</span></Link>
          <Link href="/login" className="tp-welcome-secondary">Log In <span>→</span></Link>
        </div>

        <div className={`tp-welcome-info ${open ? 'is-open' : ''}`}>
          <button type="button" className="tp-welcome-info-toggle" onClick={() => setOpen(value => !value)} aria-expanded={open}>
            <span>What is TruxPylot?</span>
            <span className="tp-welcome-chevron" aria-hidden="true">⌄</span>
          </button>

          {open && (
            <div className="tp-welcome-info-body">
              <div>
                <h2>The problem</h2>
                <p>Finding reliable professionals can be difficult. People often depend on recommendations, random searches, social media posts, or multiple phone calls without knowing who they can actually trust.</p>
              </div>
              <div>
                <h2>The TruxPylot solution</h2>
                <p>TruxPylot brings customers and professionals together in one trusted platform.</p>
                <ul>
                  <li>Find professionals for the service you need</li>
                  <li>Compare real professional information</li>
                  <li>See ratings, reviews and trust signals</li>
                  <li>Discover professionals based on your needs</li>
                  <li>Connect with the right professional</li>
                  <li>Post a job when you need someone to come to you</li>
                </ul>
              </div>
              <div>
                <h2>For professionals</h2>
                <p>Get discovered, build your reputation, showcase your work and connect with people who need your services.</p>
              </div>
              <Link href="/register" className="tp-welcome-create">Create your account →</Link>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .tp-welcome-gate{position:relative;min-height:calc(100vh - 1px);overflow:hidden;display:grid;place-items:center;background:#073fc8;color:#fff;padding:48px 20px;font-family:Arial,Helvetica,sans-serif}
        .tp-welcome-content{position:relative;z-index:2;width:min(760px,100%);text-align:center}
        .tp-welcome-logo-wrap{display:inline-flex;align-items:center;justify-content:center;background:#fff;border-radius:18px;padding:10px 16px;margin:0 auto 22px;box-shadow:0 16px 36px rgba(0,0,0,.16)}
        .tp-welcome-logo{display:block;width:190px;height:auto;max-height:82px;object-fit:contain;object-position:center;margin:0}

        .tp-welcome-kicker{display:inline-flex;align-items:center;border:1px solid rgba(255,255,255,.35);border-radius:999px;padding:7px 13px;font-size:10px;font-weight:800;letter-spacing:1.5px;margin:0 0 18px;color:#fff}
        .tp-welcome-kicker:before{content:'';width:6px;height:6px;border-radius:50%;background:#fff;margin-right:8px}
        .tp-welcome-content h1{font-size:clamp(42px,7vw,76px);line-height:.98;letter-spacing:-3px;margin:0 auto 18px;max-width:720px;color:#fff}
        .tp-welcome-lede{max-width:610px;margin:0 auto;color:rgba(255,255,255,.86);font-size:17px;line-height:1.6}
        .tp-welcome-actions{display:flex;justify-content:center;gap:12px;margin:30px 0 18px}
        .tp-welcome-actions a{min-width:145px;padding:14px 22px;border-radius:9px;font-weight:800;text-decoration:none;transition:.2s ease}
        .tp-welcome-primary{background:#fff;color:#073fc8}.tp-welcome-primary:hover{transform:translateY(-2px);box-shadow:0 10px 24px rgba(0,0,0,.18)}
        .tp-welcome-secondary{border:1px solid rgba(255,255,255,.65);color:#fff;background:transparent}.tp-welcome-secondary:hover{background:rgba(255,255,255,.1);transform:translateY(-2px)}
        .tp-welcome-info{width:min(650px,100%);margin:0 auto;text-align:left;border:1px solid rgba(255,255,255,.28);border-radius:12px;background:rgba(255,255,255,.06);overflow:hidden}
        .tp-welcome-info-toggle{width:100%;display:flex;align-items:center;justify-content:space-between;padding:15px 18px;background:transparent;border:0;color:#fff;font:700 14px Arial,Helvetica,sans-serif;text-align:left}
        .tp-welcome-chevron{font-size:20px;line-height:1;transition:transform .2s ease}.is-open .tp-welcome-chevron{transform:rotate(180deg)}
        .tp-welcome-info-body{padding:4px 20px 20px;border-top:1px solid rgba(255,255,255,.18);display:grid;gap:17px;color:#fff}
        .tp-welcome-info-body h2{text-transform:uppercase;font-size:11px;letter-spacing:1px;margin:14px 0 7px;color:#fff}.tp-welcome-info-body p{font-size:13px;line-height:1.65;margin:0;color:rgba(255,255,255,.84)}
        .tp-welcome-info-body ul{margin:9px 0 0;padding-left:19px;color:rgba(255,255,255,.88);font-size:13px;line-height:1.75}.tp-welcome-info-body li::marker{color:#fff}
        .tp-welcome-create{justify-self:start;background:#fff;color:#073fc8;border-radius:8px;padding:11px 15px;font-weight:800;text-decoration:none;margin-top:2px}
        .tp-welcome-mark{position:absolute;z-index:0;opacity:.075;pointer-events:none;animation:tp-welcome-float 7s ease-in-out infinite}.tp-welcome-mark img{width:260px;height:180px;object-fit:contain;filter:brightness(0) invert(1)}
        .tp-welcome-mark-one{left:-35px;top:12%;transform:rotate(-14deg)}.tp-welcome-mark-two{right:-40px;top:28%;transform:rotate(13deg);animation-delay:1.5s}.tp-welcome-mark-three{left:12%;bottom:-25px;transform:rotate(8deg);animation-delay:3s}
        @keyframes tp-welcome-float{0%,100%{translate:0 0}50%{translate:0 -16px}}
        @media(max-width:600px){.tp-welcome-gate{padding:30px 16px}.tp-welcome-logo-wrap{border-radius:15px;padding:8px 13px;margin-bottom:18px}.tp-welcome-logo{width:155px}.tp-welcome-content h1{letter-spacing:-2px}.tp-welcome-lede{font-size:15px}.tp-welcome-actions{flex-direction:column;align-items:stretch}.tp-welcome-actions a{text-align:center}.tp-welcome-info-body{padding-left:16px;padding-right:16px}.tp-welcome-mark img{width:190px;height:140px}}
        @media(prefers-reduced-motion:reduce){.tp-welcome-mark{animation:none}.tp-welcome-actions a{transition:none}}
      `}</style>
    </section>
  );
}
