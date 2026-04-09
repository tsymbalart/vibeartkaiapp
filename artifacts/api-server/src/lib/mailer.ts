import { Resend } from "resend";
import { logger } from "./logger";

const API_KEY = process.env.RESEND_API_KEY;
const APP_URL = process.env.APP_URL || "http://localhost:5000";
const FROM =
  process.env.RESEND_FROM || "Artkai Pulse <onboarding@resend.dev>";

let resend: Resend | null = null;

function getClient(): Resend | null {
  if (!API_KEY) return null;
  if (!resend) resend = new Resend(API_KEY);
  return resend;
}

/**
 * Check whether the mailer is configured. Returns false when
 * RESEND_API_KEY is not set (dev / CI environments).
 */
export function isMailerConfigured(): boolean {
  return API_KEY != null && API_KEY.length > 0;
}

// ─── Email templates ────────────────────────────────────────────────

function reminderHtml(name: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f6f8;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;padding:40px 32px;">
        <tr><td>
          <div style="width:40px;height:40px;border-radius:10px;background:#07142D;color:#fff;font-size:18px;font-weight:600;text-align:center;line-height:40px;margin-bottom:24px;">A</div>
          <h1 style="margin:0 0 12px;font-size:22px;font-weight:600;color:#07142D;">Hey ${name}!</h1>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4a5568;">
            Your team's weekly pulse check-in is open. It takes less than
            3 minutes and helps your lead understand how the team is doing.
          </p>
          <a href="${APP_URL}/check-in"
             style="display:inline-block;padding:12px 28px;background:#07142D;color:#ffffff;text-decoration:none;border-radius:12px;font-size:14px;font-weight:600;">
            Start Pulse Check &rarr;
          </a>
          <p style="margin:32px 0 0;font-size:12px;color:#a0aec0;">
            &mdash; Artkai Pulse
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

function inviteHtml(
  inviterName: string,
  role: string,
  claimUrl: string,
): string {
  const roleLabel =
    role === "director" ? "Director" : role === "lead" ? "Team Lead" : "Teammate";
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f6f8;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;padding:40px 32px;">
        <tr><td>
          <div style="width:40px;height:40px;border-radius:10px;background:#07142D;color:#fff;font-size:18px;font-weight:600;text-align:center;line-height:40px;margin-bottom:24px;">A</div>
          <h1 style="margin:0 0 12px;font-size:22px;font-weight:600;color:#07142D;">You're invited!</h1>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4a5568;">
            <strong>${inviterName}</strong> invited you to join as a
            <strong>${roleLabel}</strong> on Artkai Pulse &mdash; the team's
            health check-in and feedback tool.
          </p>
          <a href="${claimUrl}"
             style="display:inline-block;padding:12px 28px;background:#07142D;color:#ffffff;text-decoration:none;border-radius:12px;font-size:14px;font-weight:600;">
            Accept Invitation &rarr;
          </a>
          <p style="margin:24px 0 0;font-size:13px;color:#718096;">
            This link expires in 7 days.
          </p>
          <p style="margin:16px 0 0;font-size:12px;color:#a0aec0;">
            &mdash; Artkai Pulse
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

// ─── Public API ─────────────────────────────────────────────────────

export async function sendReminderEmail(
  to: string,
  name: string,
): Promise<boolean> {
  const client = getClient();
  if (!client) {
    logger.debug({ to }, "mailer: skipping reminder (RESEND_API_KEY not set)");
    return false;
  }
  try {
    await client.emails.send({
      from: FROM,
      to,
      subject: "Your weekly pulse check-in is waiting",
      html: reminderHtml(name),
    });
    return true;
  } catch (err) {
    logger.error({ err, to }, "mailer: failed to send reminder");
    return false;
  }
}

export async function sendInviteEmail(
  to: string,
  inviterName: string,
  role: string,
  token: string,
): Promise<boolean> {
  const client = getClient();
  if (!client) {
    logger.debug({ to }, "mailer: skipping invite (RESEND_API_KEY not set)");
    return false;
  }
  const claimUrl = `${APP_URL}/api/claim-invite?token=${encodeURIComponent(token)}`;
  try {
    await client.emails.send({
      from: FROM,
      to,
      subject: "You're invited to join Artkai Pulse",
      html: inviteHtml(inviterName, role, claimUrl),
    });
    return true;
  } catch (err) {
    logger.error({ err, to }, "mailer: failed to send invite");
    return false;
  }
}
