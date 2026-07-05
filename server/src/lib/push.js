import webpush from "web-push";
import prisma from "./prisma.js";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);

export async function sendPushToAll(payload) {
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
