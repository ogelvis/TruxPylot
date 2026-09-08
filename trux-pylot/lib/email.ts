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

  export async function sendNotificationEmail(data: {
    to: string;
    subject: string;
    title: string;
    body: string;
    link?: string;
  }) {
    await sendEmail(
      data.to,
      data.subject,
      `<h2>${data.title}</h2><p>${data.body}</p>${data.link ? `<p><a href="${process.env.NEXT_PUBLIC_APP_URL ?? ''}${data.link}">Open Trux Pylot →</a></p>` : ''}`
    );
  }

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
     <p><a href="${process.env.NEXT_PUBLIC_APP_URL ?? ''}/dashboard/customer/service-requests/${requestId}">View your request →</a></p>`
  );
}

export async function sendServiceRequestCompletedEmail(to: string, customerName: string, requestId: string) {
  await sendEmail(
    to,
    'Your service request is complete — Trux Pylot',
    `<h2>Hi ${customerName},</h2>
     <p>Your request has been marked complete. We'd love to hear how it went.</p>
     <p><a href="${process.env.NEXT_PUBLIC_APP_URL ?? ''}/dashboard/customer/service-requests/${requestId}">Leave a review →</a></p>`
  );
}

export async function sendServiceRequestDeclinedEmail(to: string, customerName: string, notes?: string) {
  await sendEmail(
    to,
    'An update on your service request — Trux Pylot',
    `<h2>Hi ${customerName},</h2>
     <p>We were not able to proceed with this request.</p>
     ${notes ? `<p><b>Reason:</b> ${notes}</p>` : ''}
     <p><a href="${process.env.NEXT_PUBLIC_APP_URL ?? ''}/marketplace">Browse other professionals →</a></p>`
  );
}
