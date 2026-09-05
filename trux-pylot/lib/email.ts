// Sends transactional emails directly through Resend's HTTP API — separate
// from Supabase Auth's SMTP wiring, which only ever sends OTP/magic-link
// emails and can't be triggered from our own backend logic. This uses the
// same Resend account, just a dedicated API key for app-triggered sends
// (verification outcomes, future notifications) rather than auth codes.
//
// Failures here are logged and swallowed by callers where the email is a
// side effect of a more important action (e.g. approving a professional) —
// a bounced notification email should never undo or block the underlying
// database change that already succeeded.

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

function getConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || 'Trux Pylot <verify@truxpylot.com>';
  if (!apiKey) throw new Error('Missing required environment variable: RESEND_API_KEY.');
  return { apiKey, from };
}

async function sendEmail(to: string, subject: string, html: string) {
  const { apiKey, from } = getConfig();
  const res = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Resend API error (${res.status}): ${body.slice(0, 300)}`);
  }
}

export async function sendVerificationApprovedEmail(to: string, fullName: string) {
  await sendEmail(
    to,
    "You're verified on Trux Pylot ✓",
    `<h2>Congratulations, ${fullName}!</h2>
     <p>Your professional profile has been reviewed and approved. You now have a verified badge, and customers can find and request you in the marketplace.</p>
     <p><a href="${process.env.NEXT_PUBLIC_APP_URL ?? ''}/dashboard/professional">Go to your dashboard →</a></p>`
  );
}

export async function sendVerificationRejectedEmail(to: string, fullName: string, notes?: string) {
  await sendEmail(
    to,
    'An update on your Trux Pylot verification',
    `<h2>Hi ${fullName},</h2>
     <p>We were not able to approve your verification submission this time.</p>
     ${notes ? `<p><b>Reason:</b> ${notes}</p>` : ''}
     <p>You can review and resubmit your documents from your dashboard.</p>
     <p><a href="${process.env.NEXT_PUBLIC_APP_URL ?? ''}/dashboard/professional/verification">Resubmit →</a></p>`
  );
}

export async function sendVerificationMoreInfoEmail(to: string, fullName: string, notes?: string) {
  await sendEmail(
    to,
    'We need more information — Trux Pylot verification',
    `<h2>Hi ${fullName},</h2>
     <p>We need a bit more information before we can approve your verification.</p>
     ${notes ? `<p><b>What we need:</b> ${notes}</p>` : ''}
     <p><a href="${process.env.NEXT_PUBLIC_APP_URL ?? ''}/dashboard/professional/verification">Submit more information →</a></p>`
  );
}
