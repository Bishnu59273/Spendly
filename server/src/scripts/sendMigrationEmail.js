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

We just shipped some new features to Spendly — here's what's waiting for you.

BUILT-IN CALCULATOR
No more switching to your phone calculator while adding an expense. When you open the Add Expense or Add Income form, tap the Calculator button below the amount field. Type your expression (like 300 ÷ 3 or 1000 + 18%), see the result instantly, then tap "Use ₹…" to fill it in automatically.

It handles splits, discounts, tax calculations, and adding up multiple items — all without leaving the app.

CLEANER DASHBOARD ON MOBILE
The four summary cards on your dashboard (Total Spent, Remaining Budget, Days Left, Top Category) now look much better on smaller screens. The budget edit button has also moved next to the amount so it's easier to find.

HOW TO GET THE UPDATE
Just refresh the app — no reinstall needed.

On a phone: In your Spendly app pull down to refresh.
On a computer: press Ctrl + Shift + R (Windows) or Cmd + Shift + R (Mac).

Open Spendly: https://spendly.it.com

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
  <title>New features in Spendly</title>
</head>
<body style="margin:0;padding:0;background:#e8f0ec;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="max-width:540px;margin:0 auto;padding:40px 16px 56px;">

    <!-- Card -->
    <div style="border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(29,107,81,0.14);">

      <!-- Gradient header -->
      <div style="background:linear-gradient(135deg,#1d6b51 0%,#2d8f6f 60%,#3aaa85 100%);padding:36px 32px 32px;text-align:center;">
        <div style="display:inline-block;background:rgba(255,255,255,0.18);border-radius:14px;padding:8px 20px;margin-bottom:20px;">
          <span style="font-size:17px;font-weight:800;color:#fff;letter-spacing:-0.02em;">💸 Spendly</span>
        </div>
        <div style="font-size:48px;line-height:1;margin-bottom:14px;">🧮</div>
        <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.03em;line-height:1.2;">
          New features just landed!
        </h1>
        <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.82);line-height:1.5;">
          A built-in calculator and a cleaner dashboard on mobile.
        </p>
      </div>

      <!-- White body -->
      <div style="background:#ffffff;padding:32px 32px 28px;">

        <!-- Greeting -->
        <p style="font-size:15.5px;color:#374151;margin:0 0 26px;line-height:1.7;">
          Hi <strong style="color:#111827;">${displayName}</strong> 👋,<br>
          we just shipped two updates to make Spendly feel even smoother. Here's what's new.
        </p>

        <!-- Feature 1: Calculator -->
        <div style="background:#f0f7f4;border-left:3px solid #1d6b51;border-radius:0 12px 12px 0;padding:18px 20px;margin:0 0 16px;">
          <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#1d6b51;text-transform:uppercase;letter-spacing:0.08em;">🧮 Built-in Calculator</p>
          <p style="margin:0 0 12px;font-size:14.5px;font-weight:600;color:#111827;">No more switching to your phone calculator</p>
          <p style="margin:0 0 14px;font-size:14px;color:#4b5563;line-height:1.6;">
            When you add an expense or income, tap the <strong>Calculator</strong> button below the amount field. Type your expression, see the answer instantly, then tap <strong>Use ₹…</strong> to fill it in.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr>
              <td style="padding-bottom:8px;">
                <span style="display:inline-block;background:#fff;border:1px solid #d1fae5;border-radius:8px;padding:5px 11px;font-family:monospace;font-size:13px;font-weight:600;color:#1d6b51;">300 ÷ 3</span>
                <span style="font-size:13px;color:#6b7280;margin-left:8px;">→ split a bill between 3 people</span>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:8px;">
                <span style="display:inline-block;background:#fff;border:1px solid #d1fae5;border-radius:8px;padding:5px 11px;font-family:monospace;font-size:13px;font-weight:600;color:#1d6b51;">1000 + 18 %</span>
                <span style="font-size:13px;color:#6b7280;margin-left:8px;">→ add 18% GST to a price</span>
              </td>
            </tr>
            <tr>
              <td>
                <span style="display:inline-block;background:#fff;border:1px solid #d1fae5;border-radius:8px;padding:5px 11px;font-family:monospace;font-size:13px;font-weight:600;color:#1d6b51;">500 − 10 %</span>
                <span style="font-size:13px;color:#6b7280;margin-left:8px;">→ apply a 10% discount</span>
              </td>
            </tr>
          </table>
        </div>

        <!-- Feature 2: Dashboard -->
        <div style="background:#f0f7f4;border-left:3px solid #1d6b51;border-radius:0 12px 12px 0;padding:18px 20px;margin:0 0 28px;">
          <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#1d6b51;text-transform:uppercase;letter-spacing:0.08em;">📊 Cleaner Dashboard on Mobile</p>
          <p style="margin:0;font-size:14px;color:#4b5563;line-height:1.6;">
            The summary cards (Total Spent, Remaining Budget, Days Left, Top Category) now fit perfectly on smaller screens. The budget edit button has moved next to the amount — easier to tap.
          </p>
        </div>

        <!-- Refresh steps -->
        <div style="background:#f9fafb;border-radius:12px;padding:18px 20px;margin:0 0 28px;">
          <p style="margin:0 0 16px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.1em;">
            ✅ How to get the update
          </p>
          <p style="margin:0 0 14px;font-size:14px;color:#374151;line-height:1.6;">
            These changes are already live — just refresh the app. No reinstall needed.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr>
              <td width="30" valign="top" style="padding-bottom:12px;">
                <span style="display:inline-block;width:22px;height:22px;background:#d1fae5;border-radius:50%;text-align:center;font-size:11px;font-weight:700;color:#1d6b51;line-height:22px;">1</span>
              </td>
              <td style="padding-bottom:12px;padding-left:8px;">
                <span style="font-size:14px;font-weight:600;color:#111827;">On your phone</span><br>
                <span style="font-size:13px;color:#6b7280;line-height:1.5;">Open your Spendly app and pull down to refresh.</span>
              </td>
            </tr>
            <tr>
              <td width="30" valign="top">
                <span style="display:inline-block;width:22px;height:22px;background:#d1fae5;border-radius:50%;text-align:center;font-size:11px;font-weight:700;color:#1d6b51;line-height:22px;">2</span>
              </td>
              <td style="padding-left:8px;">
                <span style="font-size:14px;font-weight:600;color:#111827;">On a computer</span><br>
                <span style="font-size:13px;color:#6b7280;line-height:1.5;">Press <strong>Ctrl + Shift + R</strong> on Windows or <strong>Cmd + Shift + R</strong> on Mac</span>
              </td>
            </tr>
          </table>
        </div>

        <!-- CTA button -->
        <a
          href="https://spendly.it.com"
          style="display:block;background:linear-gradient(135deg,#1d6b51,#2d8f6f);color:#ffffff;
                 text-decoration:none;text-align:center;padding:16px 24px;border-radius:12px;
                 font-size:16px;font-weight:700;letter-spacing:-0.01em;margin-bottom:24px;"
        >
          Open Spendly &rarr;
        </a>

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
        subject:
          "New in Spendly — Built-in Calculator & Smarter Dashboard 🎉🧮",
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
