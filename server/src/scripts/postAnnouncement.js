import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { sendPushToAll } from "../lib/push.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "../../.env") });

// --- Edit these before running ---
const TITLE = "Quick Fill for repeat expenses";
const BODY = `Logging the same coffee, cigarette pack, or Metro ride every day means retyping the same note, amount, and category each time.

Spendly now spots those patterns for you. Open the Add Expense form and you'll see a new Quick Fill section at the top. Things you log almost every day get a featured card with a heads-up on when you usually log it — tap Use and it's filled in. Things you log often but not daily, like a weekly grocery run, show up as smaller tap-to-fill chips right below it.

Everything still goes through the normal Add Expense form, so you can review the amount, category, and time before saving — it's a shortcut, not an auto-log. Tapped the wrong one? Hit Clear next to the label and it resets back to a blank form.

Look for it next time you tap Add Expense — once Spendly has a couple of weeks of your history, your regulars start showing up on their own.`;
const PUSH_BODY =
  "Log something often? Spendly now offers a one-tap fill instead of retyping it every time.";
const ICON = "⚡";
// ----------------------------------

if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  console.error("❌  VAPID keys are not set in environment. Aborting.");
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  const announcement = await prisma.announcement.create({
    data: { title: TITLE, body: BODY, icon: ICON },
  });
  console.log(`Created announcement ${announcement.id}: "${announcement.title}"`);

  const { sent, failed, removed } = await sendPushToAll({
    title: `${ICON} ${TITLE}`,
    body: PUSH_BODY,
    url: "/updates",
  });
  console.log(`Push sent: ${sent}, failed: ${failed}, stale subscriptions removed: ${removed}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  prisma.$disconnect();
  process.exit(1);
});
