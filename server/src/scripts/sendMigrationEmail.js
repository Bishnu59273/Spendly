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
  return `Hi ${displayName},

If you've been using Spendly for a couple of weeks, you've probably noticed you log some things over and over - a daily coffee, cigarettes, the same Metro ride to work.

Spendly now spots that pattern for you. Open the Add Expense form and you'll see a "Quick Fill" section at the top with your regulars already there - tap one and the note, amount, and category fill in instantly. No retyping.

It picks up on two kinds of patterns:
- Things you log almost daily get a featured card, with a heads-up on when you usually log it (e.g. "You log this most days around 4 PM")
- Things you log often but not daily (like a weekly grocery run) show up as quick-tap chips below it

If a suggestion isn't what you meant to log, just tap Clear and it goes back to normal.

Open Spendly:
https://spendly.it.com/dashboard

- Team Spendly
https://spendly.it.com

You're receiving this because you have a Spendly account.`;
}

function buildEmailHtml(name) {
  const displayName = name || "there";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>New in Spendly: stop retyping the same expense</title>
</head>
<body style="margin:0;padding:0;background:#e8f0ec;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="max-width:540px;margin:0 auto;padding:40px 16px 56px;">

    <!-- Card -->
    <div style="border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(29,107,81,0.14);">

      <!-- Header -->
      <div style="background:linear-gradient(135deg,#1d6b51 0%,#2d8f6f 60%,#3aaa85 100%);padding:32px 32px 28px;text-align:center;">
        <div style="display:inline-block;background:rgba(255,255,255,0.18);border-radius:14px;padding:8px 20px;margin-bottom:18px;">
          <span style="font-size:17px;font-weight:800;color:#fff;letter-spacing:-0.02em;">💸 Spendly</span>
        </div>
        <h1 style="margin:0;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.03em;line-height:1.3;">
          Quick Fill: stop retyping the same expense
        </h1>
      </div>

      <!-- White body -->
      <div style="background:#ffffff;padding:32px 32px 28px;">

        <!-- Greeting -->
        <p style="font-size:15.5px;color:#374151;margin:0 0 20px;line-height:1.7;">
          Hi <strong style="color:#111827;">${displayName}</strong>,
        </p>

        <p style="font-size:14.5px;color:#374151;margin:0 0 16px;line-height:1.7;">
          If you've been using Spendly for a couple of weeks, you've probably noticed you log some things over and over - a daily coffee, cigarettes, the same Metro ride to work.
        </p>

        <p style="font-size:14.5px;color:#374151;margin:0 0 16px;line-height:1.7;">
          Spendly now spots that pattern for you. Open the Add Expense form and you'll see a "Quick Fill" section at the top with your regulars already there - tap one and the note, amount, and category fill in instantly. No retyping.
        </p>

        <!-- Highlight box -->
        <div style="background:#f0f7f4;border-left:3px solid #1d6b51;border-radius:0 12px 12px 0;padding:18px 20px;margin:0 0 24px;">
          <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#1d6b51;text-transform:uppercase;letter-spacing:0.08em;">How it works</p>
          <p style="margin:0 0 8px;font-size:14px;color:#111827;line-height:1.6;">
            <strong>Daily habits</strong> (like your morning coffee) get a featured card, with a heads-up on when you usually log it.
          </p>
          <p style="margin:0;font-size:14px;color:#111827;line-height:1.6;">
            <strong>Frequent-but-not-daily</strong> items (like a weekly grocery run) show up as quick-tap chips below it.
          </p>
        </div>

        <p style="font-size:14.5px;color:#374151;margin:0 0 24px;line-height:1.7;">
          If a suggestion isn't what you meant to log, just tap Clear and it goes back to normal.
        </p>

        <p style="font-size:14.5px;color:#374151;margin:0 0 24px;line-height:1.7;">
          Open Spendly: <a href="https://spendly.it.com/dashboard" style="color:#1d6b51;font-weight:600;">spendly.it.com/dashboard</a>
        </p>

        <!-- Divider -->
        <hr style="border:none;border-top:1px solid #f3f4f6;margin:0 0 20px;" />

        <!-- Signature -->
        <p style="font-size:14px;color:#374151;margin:0 0 20px;line-height:1.7;">
          - Team Spendly
        </p>

        <!-- Footer -->
        <p style="font-size:12.5px;color:#9ca3af;margin:0;line-height:1.8;text-align:center;">
          You're receiving this because you have a Spendly account.<br>
          <span style="color:#d1d5db;">- The Spendly team</span>
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
  // const users = [{ id: "1", name: "test", email: "bishnusaha59273@gmail.com" }];
  console.log(`Starting migration email send to ${users.length} users...`);

  let sent = 0;
  let failed = 0;

  for (let i = 0; i < users.length; i++) {
    const { email, name } = users[i];
    try {
      await resend.emails.send({
        from: "Spendly <hello@spendly.it.com>",
        to: email,
        subject: "New in Spendly: stop retyping the same expense",
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
