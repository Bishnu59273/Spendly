import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { sendPushToAll } from "../lib/push.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "../../.env") });

// --- Edit these before running ---
const TITLE = "New in Spendly";
const BODY = "Write the announcement text here.";
const ICON = "🔔";
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
    body: BODY,
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
