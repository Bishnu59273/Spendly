import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail({ to, name, resetUrl }) {
  const displayName = name || "there";

  const text = `Hi ${displayName},

We received a request to reset your Spendly password.

Reset your password: ${resetUrl}

This link expires in 1 hour. If you didn't request this, you can safely ignore this email - your password won't change.

- The Spendly team`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Reset your Spendly password</title>
</head>
<body style="margin:0;padding:0;background:#f0edff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="max-width:540px;margin:0 auto;padding:40px 16px 56px;">
    <div style="border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(124,111,247,0.12);">

      <div style="background:linear-gradient(135deg,#5a4fcf 0%,#7c6ff7 50%,#a78bfa 100%);padding:36px 32px 32px;text-align:center;">
        <div style="display:inline-block;background:rgba(255,255,255,0.18);border-radius:14px;padding:8px 20px;margin-bottom:20px;">
          <span style="font-size:17px;font-weight:800;color:#fff;letter-spacing:-0.02em;">💸 Spendly</span>
        </div>
        <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.03em;line-height:1.2;">
          Reset your password
        </h1>
        <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.78);line-height:1.5;">
          This link expires in 1 hour
        </p>
      </div>

      <div style="background:#ffffff;padding:32px 32px 28px;">
        <p style="font-size:15.5px;color:#374151;margin:0 0 26px;line-height:1.7;">
          Hi <strong style="color:#111827;">${displayName}</strong> 👋,<br>
          we received a request to reset the password for your Spendly account.
          Tap the button below to choose a new one.
        </p>

        <a
          href="${resetUrl}"
          style="display:block;background:linear-gradient(135deg,#5a4fcf,#7c6ff7);color:#ffffff;
                 text-decoration:none;text-align:center;padding:16px 24px;border-radius:12px;
                 font-size:16px;font-weight:700;letter-spacing:-0.01em;margin-bottom:18px;"
        >
          Reset password &rarr;
        </a>

        <p style="font-size:13px;color:#6b7280;margin:0 0 28px;line-height:1.6;text-align:center;">
          Button not working? Copy and paste this link into your browser:<br>
          <a href="${resetUrl}" style="color:#7c6ff7;word-break:break-all;">${resetUrl}</a>
        </p>

        <hr style="border:none;border-top:1px solid #f3f4f6;margin:0 0 20px;" />

        <p style="font-size:12.5px;color:#9ca3af;margin:0;line-height:1.8;text-align:center;">
          If you didn't request this, you can safely ignore this email - your password won't change.<br>
          <span style="color:#d1d5db;">- The Spendly team</span>
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;

  await resend.emails.send({
    from: "Spendly <hello@spendly.it.com>",
    to,
    subject: "Reset your Spendly password",
    html,
    text,
  });
}
