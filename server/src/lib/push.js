import webpush from "web-push";
import prisma from "./prisma.js";

export async function sendPushToAll(payload) {
  // Configured lazily (not at module load) so this only depends on env vars
  // being loaded by the time a caller actually sends a push, not by the time
  // this file happens to get imported.
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );

  const subscriptions = await prisma.pushSubscription.findMany();
  const body = JSON.stringify(payload);

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        body,
      ),
    ),
  );

  const staleIds = subscriptions
    .filter((_, i) => {
      const r = results[i];
      return r.status === "rejected" && [404, 410].includes(r.reason?.statusCode);
    })
    .map((sub) => sub.id);

  if (staleIds.length) {
    await prisma.pushSubscription.deleteMany({ where: { id: { in: staleIds } } });
  }

  const sent = results.filter((r) => r.status === "fulfilled").length;
  return { sent, failed: results.length - sent, removed: staleIds.length };
}

export { webpush };
