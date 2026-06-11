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

function buildEmailHtml(name) {
  const displayName = name || "there";
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:520px;margin:40px auto;padding:0 16px;">
    <div style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">

      <!-- Wordmark -->
      <div style="padding:32px 32px 24px;text-align:center;border-bottom:1px solid #f3f4f6;">
        <span style="font-size:24px;font-weight:700;color:#7C6FF7;letter-spacing:-0.03em;">Spendly</span>
      </div>

      <!-- Body -->
      <div style="padding:28px 32px;">
        <p style="font-size:16px;color:#111827;margin:0 0 14px;font-weight:600;">Hi ${displayName}!</p>

        <p style="font-size:15px;color:#374151;margin:0 0 24px;line-height:1.65;">
          Great news — Spendly now has its own home at spendly.it.com.
          Your data is completely safe, nothing has changed except the address.
        </p>

        <!-- Domain highlight box -->
        <div style="background:#7C6FF7;border-radius:12px;padding:22px 24px;text-align:center;margin:0 0 24px;">
          <span style="font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">spendly.it.com</span>
        </div>

        <p style="font-size:15px;color:#374151;margin:0 0 28px;line-height:1.65;">
          If you had Spendly installed on your phone, please reinstall it from
          the new URL for the best experience. It only takes 30 seconds.
        </p>

        <!-- CTA button -->
        <a
          href="https://spendly.it.com"
          style="display:block;background:#7C6FF7;color:#ffffff;text-decoration:none;
                 text-align:center;padding:14px 24px;border-radius:10px;
                 font-size:15px;font-weight:700;margin:0 0 28px;"
        >
          Go to spendly.it.com →
        </a>

        <!-- Divider -->
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 20px;" />

        <!-- Footer -->
        <p style="font-size:13px;color:#9ca3af;margin:0 0 10px;line-height:1.6;">
          Your old bookmarks will automatically redirect to the new address. — The Spendly team
        </p>
        <p style="font-size:11px;color:#d1d5db;margin:0;">
          You're receiving this because you have a Spendly account.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true },
  });

  console.log(`Starting migration email send to ${users.length} users...`);

  let sent = 0;
  let failed = 0;

  for (let i = 0; i < users.length; i++) {
    const { email, name } = users[i];
    try {
      await resend.emails.send({
        from: "Spendly <noreply@spendly.it.com>",
        to: email,
        subject: "Spendly has a new home 🎉",
        html: buildEmailHtml(name),
      });
      sent++;
      console.log(`Sent to ${email} (${i + 1}/${users.length})`);
    } catch (err) {
      failed++;
      console.error(`Failed to send to ${email}: ${err.message}`);
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
