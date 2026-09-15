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
function getAppUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const fallback = process.env.NODE_ENV === 'production'
    ? 'https://truxpylot.com'
    : 'http://localhost:3000';

  if (!configured) return fallback;

  try {
    const url = new URL(configured);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error('Unsupported URL protocol');
    }
    return configured.replace(/\/$/, '');
  } catch {
    console.error('[email] Invalid NEXT_PUBLIC_APP_URL; using the safe application fallback.');
    return fallback;
  }
}

const APP_URL = getAppUrl();

function getConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || 'Trux Pylot <verify@truxpylot.com>';
  if (!apiKey) throw new Error('Missing required environment variable: RESEND_API_KEY.');
  return { apiKey, from };
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function brandedEmail(title: string, bodyHtml: string, options?: { eyebrow?: string; ctaText?: string; ctaLink?: string }) {
  const eyebrow = options?.eyebrow || 'TRUXPYLOT';
  const workerImage = `${APP_URL}/email-worker.png`;
  const cta = options?.ctaLink && options?.ctaText
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:26px auto 0;"><tr><td style="border-radius:10px;background:#2563eb;"><a href="${escapeHtml(options.ctaLink)}" style="display:inline-block;padding:13px 22px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;">${escapeHtml(options.ctaText)} &rarr;</a></td></tr></table>`
    : '';

  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#eef2f7;font-family:Arial,Helvetica,sans-serif;color:#172033;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#eef2f7;">
<tr><td align="center" style="padding:32px 14px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:22px;overflow:hidden;box-shadow:0 12px 40px rgba(15,23,42,.10);">
<tr><td style="background:#111827;padding:28px 30px 0;">
  <div style="font-size:25px;font-weight:800;letter-spacing:-.8px;color:#ffffff;">TRUX<span style="color:#3b82f6;">PYLOT</span></div>
  <div style="margin-top:22px;display:inline-block;padding:7px 12px;border:1px solid #334155;border-radius:50px;color:#93c5fd;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">${escapeHtml(eyebrow)}</div>
  <h1 style="margin:15px 0 24px;font-size:29px;line-height:1.2;letter-spacing:-1px;color:#ffffff;">${escapeHtml(title)}</h1>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="height:1px;background:#334155;font-size:1px;line-height:1px;">&nbsp;</td></tr></table>
</td></tr>
<tr><td style="padding:0 30px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="right" style="height:145px;vertical-align:bottom;">
    <img src="${workerImage}" width="150" alt="TruxPylot professional" style="display:block;width:150px;max-width:150px;height:auto;margin-left:auto;border:0;outline:none;text-decoration:none;" />
  </td></tr></table>
</td></tr>
<tr><td style="padding:4px 30px 34px;text-align:left;">
  ${bodyHtml}
  ${cta}
</td></tr>
<tr><td style="border-top:1px solid #edf0f4;padding:22px 30px;background:#fafbfc;text-align:center;">
  <p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:#667085;">TruxPylot maintains strict platform policies to keep our marketplace trusted and safe.</p>
  <p style="margin:0;font-size:11px;line-height:1.6;color:#98a2b3;">Do not submit false information, misuse the platform, attempt fraud, harass other users, or engage in activity that violates our policies. Such activity may lead to account suspension, blocking, or permanent removal from TruxPylot.</p>
</td></tr>
</table>
<div style="padding:18px 10px 4px;text-align:center;">
  <div style="font-size:14px;font-weight:800;color:#475467;letter-spacing:-.3px;">TRUX<span style="color:#2563eb;">PYLOT</span></div>
  <p style="margin:6px 0 0;font-size:11px;color:#98a2b3;">Connect. Hire. Get things done.</p>
</div>
</td></tr></table>
</body></html>`;
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

export async function sendNotificationEmail(data: {
  to: string;
  subject: string;
  title: string;
  body: string;
  link?: string;
}) {
  const link = data.link ? `${APP_URL}${data.link}` : undefined;
  await sendEmail(
    data.to,
    data.subject,
    brandedEmail(
      data.title,
      `<p style="margin:0;font-size:15px;line-height:1.75;color:#667085;">${escapeHtml(data.body)}</p>`,
      link ? { eyebrow: 'ACCOUNT UPDATE', ctaText: 'Open TruxPylot', ctaLink: link } : { eyebrow: 'ACCOUNT UPDATE' }
    )
  );
}

export async function sendCsdContactEmail(data: {
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  customerId: string | null;
  professionalName: string;
  professionalBusinessName: string | null;
  professionalId: string;
  profession: string | null;
  professionalLocation: string | null;
  serviceNames: string[];
  message: string;
  profileUrl: string;
}) {
  const recipient = process.env.CSD_EMAIL || process.env.SUPPORT_EMAIL || 'info@truxpylot.com';
  await sendEmail(
    recipient,
    `New customer enquiry for ${data.professionalName}`,
    `<h2>New professional profile enquiry</h2>
     <p><b>Professional:</b> ${data.professionalName}</p>
     <p><b>Services:</b> ${data.serviceNames.join(', ') || 'Not specified'}</p>
     <p><b>Customer:</b> ${data.customerName} (${data.customerEmail})</p>
     <p><b>Phone:</b> ${data.customerPhone || 'Not provided'}</p>
     <p><b>Message:</b> ${data.message}</p>
     <p><a href="${data.profileUrl}">View professional profile</a></p>`
  );
}

export async function sendVerificationApprovedEmail(to: string, fullName: string) {
  await sendEmail(
    to,
    "You're verified on Trux Pylot ✓",
    brandedEmail(
      `You're verified, ${escapeHtml(fullName)}.`,
      `<p style="margin:0 0 14px;font-size:15px;line-height:1.75;color:#667085;">Your professional profile has been reviewed and approved. Your verified status helps customers identify trusted professionals and gives you access to marketplace opportunities.</p><p style="margin:0;font-size:14px;line-height:1.7;color:#475467;"><strong>Keep your account in good standing:</strong> provide accurate information, follow platform rules, treat customers professionally, and avoid activity that could result in suspension or removal.</p>`,
      { eyebrow: 'VERIFICATION APPROVED', ctaText: 'Open dashboard', ctaLink: `${APP_URL}/dashboard/professional` }
    )
  );
}

export async function sendVerificationRejectedEmail(to: string, fullName: string, notes?: string) {
  await sendEmail(
    to,
    'An update on your Trux Pylot verification',
    brandedEmail(
      `An update on your verification`,
      `<p style="margin:0 0 14px;font-size:15px;line-height:1.75;color:#667085;">Hi ${escapeHtml(fullName)}, we were not able to approve your verification submission this time.</p>${notes ? `<div style="padding:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;"><div style="font-size:11px;font-weight:800;letter-spacing:1px;color:#94a3b8;text-transform:uppercase;margin-bottom:7px;">Review note</div><div style="font-size:14px;line-height:1.65;color:#475467;">${escapeHtml(notes)}</div></div>` : ''}<p style="margin:18px 0 0;font-size:14px;line-height:1.7;color:#667085;">You can review the requirements and resubmit from your dashboard.</p>`,
      { eyebrow: 'VERIFICATION UPDATE', ctaText: 'Review verification', ctaLink: `${APP_URL}/dashboard/professional/verification` }
    )
  );
}

export async function sendVerificationMoreInfoEmail(to: string, fullName: string, notes?: string) {
  await sendEmail(
    to,
    'We need more information — Trux Pylot verification',
    brandedEmail(
      'We need a little more information',
      `<p style="margin:0 0 14px;font-size:15px;line-height:1.75;color:#667085;">Hi ${escapeHtml(fullName)}, we need a bit more information before we can approve your verification.</p>${notes ? `<div style="padding:16px;background:#eff6ff;border:1px solid #dbeafe;border-radius:12px;"><div style="font-size:11px;font-weight:800;letter-spacing:1px;color:#2563eb;text-transform:uppercase;margin-bottom:7px;">What we need</div><div style="font-size:14px;line-height:1.65;color:#475467;">${escapeHtml(notes)}</div></div>` : ''}`,
      { eyebrow: 'ACTION REQUIRED', ctaText: 'Update verification', ctaLink: `${APP_URL}/dashboard/professional/verification` }
    )
  );
}

// --- Service request milestone emails --------------------------------------
// Deliberately limited to the handful of transitions a customer actually
// needs an email about (connected, completed, declined). The intermediate
// CSD-review stages already show up as in-app notifications (lib/notify.ts)
// — emailing every single status bump would be spammy.

export async function sendServiceRequestConnectedEmail(to: string, customerName: string, professionalName: string, requestId: string) {
  await sendEmail(
    to,
    "You're connected! — Trux Pylot",
    `<h2>Good news, ${customerName}!</h2>
     <p>Truxpylot Customer Service has confirmed availability and connected you with <b>${professionalName}</b> for your request.</p>
     <p><a href="${APP_URL}/dashboard/customer/service-requests/${requestId}">View your request →</a></p>`
  );
}

export async function sendServiceRequestCompletedEmail(to: string, customerName: string, requestId: string) {
  await sendEmail(
    to,
    'Your service request is complete — Trux Pylot',
    `<h2>Hi ${customerName},</h2>
     <p>Your request has been marked complete. We'd love to hear how it went.</p>
     <p><a href="${APP_URL}/dashboard/customer/service-requests/${requestId}">Leave a review →</a></p>`
  );
}

export async function sendServiceRequestDeclinedEmail(to: string, customerName: string, notes?: string) {
  await sendEmail(
    to,
    'An update on your service request — Trux Pylot',
    `<h2>Hi ${customerName},</h2>
     <p>We were not able to proceed with this request.</p>
     ${notes ? `<p><b>Reason:</b> ${notes}</p>` : ''}
     <p><a href="${APP_URL}/marketplace">Browse other professionals →</a></p>`
  );
}

export async function sendFinancialTransactionEmail(data: {
  to: string;
  fullName: string;
  title: string;
  body: string;
  amountKobo?: number;
  reference?: string | null;
  status?: string;
}) {
  const amount = data.amountKobo != null ? `₦${(data.amountKobo / 100).toLocaleString('en-NG')}` : null;
  await sendEmail(
    data.to,
    `${data.title} — TruxPylot`,
    `<h2>${data.title}</h2>
     <p>Hi ${data.fullName},</p>
     <p>${data.body}</p>
     ${amount ? `<p><b>Amount:</b> ${amount}</p>` : ''}
     ${data.status ? `<p><b>Status:</b> ${data.status}</p>` : ''}
     ${data.reference ? `<p><b>Reference:</b> ${data.reference}</p>` : ''}
     <p>This email is your TruxPylot transaction record. Keep it for your records.</p>
     <p><a href="${APP_URL}/dashboard/notifications">View notifications →</a></p>`
  );
}
