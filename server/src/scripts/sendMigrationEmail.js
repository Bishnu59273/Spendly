import { PrismaClient } from "@prisma/client";
import { Resend } from "resend";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "../../.env") });

// --- Environment checks ---
if (!process.env.RESEND_API_KEY) {
  console.error("❌  RESEND_API_KEY is not set in environment. Aborting.");
  process.exit(1);
}
if (process.env.RESEND_API_KEY.startsWith("your_")) {
  console.error("❌  RESEND_API_KEY looks like a placeholder value. Aborting.");
  process.exit(1);
}

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildEmailText(name) {
  const displayName = name || "there";
  return `Hi ${displayName}!

Great news — Spendly now has its own home at spendly.it.com.
Your data is completely safe, nothing has changed except the address.

Your new address: https://spendly.it.com

HOW TO REINSTALL THE APP
1. Remove the old Spendly icon from your home screen
2. Open https://spendly.it.com in your browser
3. Log in to your account
4. Tap the Install banner (or browser menu → Install app)

Open Spendly: https://spendly.it.com

Old bookmarks will automatically redirect to the new address.

— The Spendly team
You're receiving this because you have a Spendly account.`;
}

function buildEmailHtml(name) {
  const displayName = name || "there";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Spendly has a new home</title>
</head>
<body style="margin:0;padding:0;background:#f0edff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="max-width:540px;margin:0 auto;padding:40px 16px 56px;">

    <!-- Card -->
    <div style="border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(124,111,247,0.12);">

      <!-- Gradient header -->
      <div style="background:linear-gradient(135deg,#5a4fcf 0%,#7c6ff7 50%,#a78bfa 100%);padding:36px 32px 32px;text-align:center;">
        <div style="display:inline-block;background:rgba(255,255,255,0.18);border-radius:14px;padding:8px 20px;margin-bottom:20px;">
          <span style="font-size:17px;font-weight:800;color:#fff;letter-spacing:-0.02em;">💸 Spendly</span>
        </div>
        <div style="font-size:48px;line-height:1;margin-bottom:14px;">🏠</div>
        <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.03em;line-height:1.2;">
          We have a new home!
        </h1>
        <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.78);line-height:1.5;">
          Your data is safe — only the address changed.
        </p>
      </div>

      <!-- White body -->
      <div style="background:#ffffff;padding:32px 32px 28px;">

        <!-- Greeting -->
        <p style="font-size:15.5px;color:#374151;margin:0 0 22px;line-height:1.7;">
          Hi <strong style="color:#111827;">${displayName}</strong> 👋,<br>
          great news — Spendly now lives at its very own domain.
          Everything you love is exactly the same, just at a shiny new address.
        </p>

        <!-- Domain box -->
        <div style="background:#f5f3ff;border:2px solid #c4b5fd;border-radius:14px;padding:20px 24px;text-align:center;margin:0 0 26px;">
          <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#7c6ff7;margin-bottom:8px;">
            ✦ Your new address
          </div>
          <div style="font-size:28px;font-weight:800;color:#3730a3;letter-spacing:-0.03em;">
            spendly.it.com
          </div>
        </div>

        <!-- Steps -->
        <div style="background:#f9fafb;border-radius:12px;padding:18px 20px;margin:0 0 28px;">
          <p style="margin:0 0 16px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.1em;">
            📱 Reinstall the app on your phone
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr>
              <td width="30" valign="top" style="padding-bottom:14px;">
                <span style="display:inline-block;width:22px;height:22px;background:#ede9fe;border-radius:50%;text-align:center;font-size:11px;font-weight:700;color:#7c6ff7;line-height:22px;">1</span>
              </td>
              <td style="padding-bottom:14px;padding-left:8px;">
                <span style="font-size:14px;font-weight:600;color:#111827;">Uninstall the old app</span><br>
                <span style="font-size:13px;color:#6b7280;line-height:1.5;">Remove the current Spendly app from your home screen</span>
              </td>
            </tr>
            <tr>
              <td width="30" valign="top" style="padding-bottom:14px;">
                <span style="display:inline-block;width:22px;height:22px;background:#ede9fe;border-radius:50%;text-align:center;font-size:11px;font-weight:700;color:#7c6ff7;line-height:22px;">2</span>
              </td>
              <td style="padding-bottom:14px;padding-left:8px;">
                <span style="font-size:14px;font-weight:600;color:#111827;">Open the link &amp; log in</span><br>
                <span style="font-size:13px;color:#6b7280;line-height:1.5;">Tap <strong>Open Spendly</strong> below and sign in to your account</span>
              </td>
            </tr>
            <tr>
              <td width="30" valign="top" style="padding-bottom:14px;">
                <span style="display:inline-block;width:22px;height:22px;background:#ede9fe;border-radius:50%;text-align:center;font-size:11px;font-weight:700;color:#7c6ff7;line-height:22px;">3</span>
              </td>
              <td style="padding-bottom:14px;padding-left:8px;">
                <span style="font-size:14px;font-weight:600;color:#111827;">Tap the install banner</span><br>
                <span style="font-size:13px;color:#6b7280;line-height:1.5;">An <strong>Install</strong> banner will appear at the bottom of the screen — tap it to add Spendly to your home screen</span>
              </td>
            </tr>
            <tr>
              <td width="30" valign="top">
                <span style="display:inline-block;width:22px;height:22px;background:#fef3c7;border-radius:50%;text-align:center;font-size:12px;font-weight:700;color:#d97706;line-height:22px;">!</span>
              </td>
              <td style="padding-left:8px;">
                <span style="font-size:13px;font-weight:600;color:#92400e;">Banner not showing?</span><br>
                <span style="font-size:13px;color:#6b7280;line-height:1.6;">Tap the <strong>menu icon</strong> (⋮ or ···) → <strong>Settings</strong> → scroll down → tap <strong>Install app</strong></span>
              </td>
            </tr>
          </table>
        </div>

        <!-- CTA button -->
        <a
          href="https://spendly.it.com"
          style="display:block;background:linear-gradient(135deg,#5a4fcf,#7c6ff7);color:#ffffff;
                 text-decoration:none;text-align:center;padding:16px 24px;border-radius:12px;
                 font-size:16px;font-weight:700;letter-spacing:-0.01em;margin-bottom:10px;"
        >
          Open Spendly &rarr;
        </a>
        <p style="text-align:center;font-size:13px;color:#9ca3af;margin:0 0 28px;">
          Old bookmarks redirect automatically
        </p>

        <!-- Divider -->
        <hr style="border:none;border-top:1px solid #f3f4f6;margin:0 0 20px;" />

        <!-- Footer -->
        <p style="font-size:12.5px;color:#9ca3af;margin:0;line-height:1.8;text-align:center;">
          You're receiving this because you have a Spendly account.<br>
          <span style="color:#d1d5db;">— The Spendly team</span>
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

async function main() {
  // const users = await prisma.user.findMany({
  //   select: { id: true, name: true, email: true },
  // });
  const users = [
    { id: "1", name: "test", email: "test-mvie2o0z3@srv1.mail-tester.com" },
  ];
  console.log(`Starting migration email send to ${users.length} users...`);

  let sent = 0;
  let failed = 0;

  for (let i = 0; i < users.length; i++) {
    const { email, name } = users[i];
    try {
      await resend.emails.send({
        from: "Spendly <hello@spendly.it.com>",
        to: email,
        subject: "Spendly has a new home 🎉",
        html: buildEmailHtml(name),
        text: buildEmailText(name),
        headers: {
          "List-Unsubscribe": "<https://spendly.it.com>",
        },
      });
      sent++;
      console.log(`Sent to ${email} (${i + 1}/${users.length})`);
    } catch (err) {
      failed++;
      console.error(
        `Failed to send to ${email}: ${err.message}${err.statusCode ? ` (HTTP ${err.statusCode})` : ""}`,
      );
    }

    if (i < users.length - 1) {
      await sleep(200);
    }
  }

  console.log(`\nDone. Sent: ${sent}, Failed: ${failed}`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  prisma.$disconnect();
  process.exit(1);
});
