// Resend-backed email delivery for OTP sign-in codes
// Mini College ERP System - BCA Project No. 41 - Shagun Kaushal
import { env } from '../../config/env.js';
import { AppError } from '../../utils/AppError.js';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

interface SendOtpEmailInput {
  to: string;
  code: string;
  displayName: string;
}

/**
 * Sends the OTP code email via the Resend API.
 * Falls back to a readable 503 when RESEND_API_KEY is not configured so the
 * client can show a clean error instead of leaking a stack trace.
 */
export async function sendOtpEmail(input: SendOtpEmailInput): Promise<void> {
  if (!env.RESEND_API_KEY) {
    throw new AppError(
      'Email service is not configured yet (missing RESEND_API_KEY). Use password sign-in.',
      503,
      'EMAIL_NOT_CONFIGURED'
    );
  }

  const subject = `Your Mini College ERP sign-in code: ${input.code}`;
  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f7f9;font-family:Segoe UI,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
               style="max-width:420px;background:#ffffff;border-radius:14px;box-shadow:0 4px 16px rgba(11,33,41,0.08);">
          <tr><td style="padding:24px 32px 0;">
            <div style="display:inline-block;background:#0a2e34;color:#ffffff;font-weight:bold;font-size:12px;letter-spacing:2px;padding:8px 10px;border-radius:10px;">ERP</div>
            <h1 style="margin:16px 0 8px;font-size:18px;color:#0b2129;">Sign-in code</h1>
            <p style="margin:0 0 16px;font-size:13px;color:#475f6b;line-height:1.6;">
              Hi ${escapeHtml(input.displayName)}, use this one-time code to sign in to Mini College ERP. It expires in 10 minutes.
            </p>
          </td></tr>
          <tr><td style="padding:0 32px 24px;">
            <div style="background:#f0f7f7;border:1px solid #d9ecee;border-radius:12px;padding:16px;text-align:center;">
              <span style="font-family:'Courier New',monospace;font-size:28px;letter-spacing:10px;color:#0a2e34;font-weight:bold;">${input.code}</span>
            </div>
            <p style="margin:16px 0 0;font-size:11px;color:#8aa3ad;line-height:1.6;">
              If you did not request this code, you can safely ignore this email. Never share this code with anyone.
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  const res = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${env.OTP_SENDER_NAME} <${env.OTP_SENDER_EMAIL}>`,
      to: [input.to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    throw new AppError(
      'Failed to send the OTP email. Please try again or use password sign-in.',
      502,
      'EMAIL_SEND_FAILED'
    );
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
