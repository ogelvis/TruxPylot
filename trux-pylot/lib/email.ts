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


function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function sendCsdServiceRequestEmail(data: {
  requestId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  customerId: string;
  customerLocation?: string | null;
  professionalName: string;
  professionalBusinessName?: string | null;
  professionalId: string;
  professionalEmail?: string | null;
  professionalPhone?: string | null;
  profession?: string | null;
  professionalLocation?: string | null;
  verificationStatus: string;
  rating: number;
  completedJobs: number;
  serviceName: string;
  serviceCategoryId: string;
  serviceId?: string;
  startingPrice?: number | null;
  serviceDescription?: string | null;
  description: string;
  requestLocation: string;
  preferredDate?: Date | null;
  preferredTime?: string | null;
  additionalRequirements?: string | null;
  profileUrl: string;
}) {
  const date = data.preferredDate ? new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' }).format(data.preferredDate) : 'Not specified';
  const money = data.startingPrice != null ? `₦${(data.startingPrice / 100).toLocaleString('en-NG')}` : 'Not specified';

  await sendEmail(
    'info@truxpylot.com',
    `New TruxPylot Service Request — ${data.serviceName} — ${data.professionalName}`,
    `<h2>New TruxPylot Service Request</h2>
     <p>A customer has submitted a service request through the TruxPylot marketplace.</p>
     <h3>Customer Information</h3>
     <p><b>Name:</b> ${escapeHtml(data.customerName)}<br>
     <b>Email:</b> ${escapeHtml(data.customerEmail)}<br>
     <b>Phone:</b> ${escapeHtml(data.customerPhone || 'Not provided')}<br>
     <b>Customer ID:</b> ${escapeHtml(data.customerId)}<br>
     <b>Location:</b> ${escapeHtml(data.customerLocation || 'Not provided')}</p>
     <h3>Professional Information</h3>
     <p><b>Name:</b> ${escapeHtml(data.professionalName)}<br>
     <b>Business:</b> ${escapeHtml(data.professionalBusinessName || 'Not provided')}<br>
     <b>Professional ID:</b> ${escapeHtml(data.professionalId)}<br>
     <b>Profession:</b> ${escapeHtml(data.profession || 'Professional')}<br>
     <b>Email:</b> ${escapeHtml(data.professionalEmail || 'Not provided')}<br>
     <b>Phone:</b> ${escapeHtml(data.professionalPhone || 'Not provided')}<br>
     <b>Location:</b> ${escapeHtml(data.professionalLocation || 'Not provided')}<br>
     <b>Verification:</b> ${escapeHtml(data.verificationStatus)}<br>
     <b>Rating:</b> ${escapeHtml(data.rating.toFixed(1))}<br>
     <b>Completed Jobs:</b> ${escapeHtml(data.completedJobs)}</p>
     <h3>Service Information</h3>
     <p><b>Service:</b> ${escapeHtml(data.serviceName)}<br>
     <b>Category ID:</b> ${escapeHtml(data.serviceCategoryId)}<br>
     <b>Service ID:</b> ${escapeHtml(data.serviceId || 'Not provided')}<br>
     <b>Starting Price:</b> ${escapeHtml(money)}<br>
     <b>Description:</b> ${escapeHtml(data.serviceDescription || 'Not provided')}</p>
     <h3>Request Information</h3>
     <p><b>Request ID:</b> ${escapeHtml(data.requestId)}<br>
     <b>Submitted:</b> ${escapeHtml(new Date().toLocaleString('en-NG'))}<br>
     <b>Service Location:</b> ${escapeHtml(data.requestLocation)}<br>
     <b>Preferred Date:</b> ${escapeHtml(date)}<br>
     <b>Preferred Time:</b> ${escapeHtml(data.preferredTime || 'Not specified')}</p>
     <p><b>Job Description</b><br>${escapeHtml(data.description).replace(/\n/g, '<br>')}</p>
     ${data.additionalRequirements ? `<p><b>Additional Requirements</b><br>${escapeHtml(data.additionalRequirements).replace(/\n/g, '<br>')}</p>` : ''}
     <h3>Profile</h3>
     <p><a href="${escapeHtml(data.profileUrl)}">${escapeHtml(data.profileUrl)}</a></p>
     <p><b>TruxPylot CSD:</b> info@truxpylot.com</p>`
  );
}

export async function sendCsdContactEmail(data: {
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  customerId?: string | null;
  professionalName: string;
  professionalBusinessName?: string | null;
  professionalId: string;
  profession?: string | null;
  professionalLocation?: string | null;
  serviceNames: string[];
  message: string;
  profileUrl: string;
}) {
  await sendEmail(
    'info@truxpylot.com',
    `TruxPylot Customer Support Enquiry — ${data.professionalName}`,
    `<h2>TruxPylot Customer Support Enquiry</h2>
     <p>A customer has contacted TruxPylot Customer Service from a professional profile.</p>
     <h3>Customer</h3>
     <p><b>Name:</b> ${escapeHtml(data.customerName)}<br>
     <b>Email:</b> ${escapeHtml(data.customerEmail)}<br>
     <b>Phone:</b> ${escapeHtml(data.customerPhone || 'Not provided')}<br>
     <b>Customer ID:</b> ${escapeHtml(data.customerId || 'Guest')}</p>
     <h3>Professional</h3>
     <p><b>Name:</b> ${escapeHtml(data.professionalName)}<br>
     <b>Business:</b> ${escapeHtml(data.professionalBusinessName || 'Not provided')}<br>
     <b>Professional ID:</b> ${escapeHtml(data.professionalId)}<br>
     <b>Profession:</b> ${escapeHtml(data.profession || 'Professional')}<br>
     <b>Location:</b> ${escapeHtml(data.professionalLocation || 'Not provided')}<br>
     <b>Services:</b> ${escapeHtml(data.serviceNames.join(', ') || 'No services listed')}</p>
     <h3>Customer Message</h3>
     <p>${escapeHtml(data.message).replace(/\n/g, '<br>')}</p>
     <p><b>Professional Profile:</b> <a href="${escapeHtml(data.profileUrl)}">${escapeHtml(data.profileUrl)}</a></p>
     <p><b>TruxPylot CSD:</b> info@truxpylot.com</p>`
  );
}
