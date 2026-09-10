'use client';

import Link from 'next/link';
import { useState } from 'react';

export function WelcomeGate() {
  const [open, setOpen] = useState(false);

  return (
    <main className="tp-welcome" aria-labelledby="tp-welcome-title">
      <div className="tp-welcome-mark tp-welcome-mark-one" aria-hidden="true">
        <img src="/icon-192.png" alt="" />
      </div>
      <div className="tp-welcome-mark tp-welcome-mark-two" aria-hidden="true">
        <img src="/icon-192.png" alt="" />
      </div>
      <div className="tp-welcome-mark tp-welcome-mark-three" aria-hidden="true">
        <img src="/icon-192.png" alt="" />
      </div>

      <section className="tp-welcome-content">
        <div className="tp-welcome-logo-shell">
          <img
            className="tp-welcome-logo"
            src="/trux-pylot-logo.png"
            alt="Trux Pylot"
            width={260}
            height={173}
          />
        </div>

        <p className="tp-welcome-kicker"><span /> THE TRUSTED PROFESSIONAL NETWORK</p>
        <h1 id="tp-welcome-title">One App. A gigantic ecosystem.</h1>
        <p className="tp-welcome-lede">Find the right professional. Connect with confidence. Get the job done.</p>

        <div className="tp-welcome-actions">
          <Link href="/register" className="tp-welcome-primary">Sign Up <span>→</span></Link>
          <Link href="/login" className="tp-welcome-secondary">Log In <span>→</span></Link>
        </div>

        <div className={`tp-welcome-info ${open ? 'is-open' : ''}`}>
          <button
            type="button"
            className="tp-welcome-info-trigger"
            onClick={() => setOpen(value => !value)}
            aria-expanded={open}
            aria-controls="tp-welcome-info-panel"
          >
            <span>What is TruxPylot?</span>
            <span className="tp-welcome-chevron" aria-hidden="true">⌄</span>
          </button>

          {open && (
            <div id="tp-welcome-info-panel" className="tp-welcome-info-panel">
              <div>
                <p className="tp-welcome-label">THE PROBLEM</p>
                <h2>Finding reliable help should not be a guessing game.</h2>
                <p>People often depend on random searches, social media posts, recommendations and repeated phone calls without knowing who they can actually trust.</p>
              </div>

              <div>
                <p className="tp-welcome-label">THE TRUXPYLOT SOLUTION</p>
                <h2>One trusted place to find the right professional.</h2>
                <ul>
                  <li>Find professionals for the service you need.</li>
                  <li>Compare real profiles, reviews and trust signals.</li>
                  <li>Discover professionals based on your needs.</li>
                  <li>Connect with the right person for the job.</li>
                  <li>Post a job when you need professionals to come to you.</li>
                </ul>
              </div>

              <div className="tp-welcome-pro-note">
                <p className="tp-welcome-label">FOR PROFESSIONALS</p>
                <p>Get discovered, build your reputation, showcase your work and connect with people who need your services.</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
