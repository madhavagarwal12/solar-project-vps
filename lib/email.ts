import { Resend } from "resend";

// Constructed lazily (not at module scope) so this module can be imported
// during `next build`'s page-data collection without RESEND_API_KEY being
// set — the Resend constructor throws on a missing key, and build time
// should not require runtime secrets.
function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured");
  return new Resend(apiKey);
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const from = process.env.RESEND_FROM_EMAIL;
  if (!from) throw new Error("RESEND_FROM_EMAIL is not configured");

  return getResendClient().emails.send({
    from,
    to,
    subject,
    html,
    text,
  });
}
