import {
  precacheAndRoute,
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
} from "workbox-precaching";
import { registerRoute, NavigationRoute } from "workbox-routing";
import {
  NetworkFirst,
  StaleWhileRevalidate,
  CacheFirst,
  NetworkOnly,
} from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { BackgroundSyncPlugin } from "workbox-background-sync";
import { clientsClaim } from "workbox-core";

self.skipWaiting();
clientsClaim();

const manifest = self.__WB_MANIFEST || [];
precacheAndRoute(manifest);
cleanupOutdatedCaches();

// In dev, injectManifest has no build to draw a manifest from, so
// createHandlerBoundToURL would throw on a URL that isn't precached.
// The generated manifest lists it as "index.html" (no leading slash).
if (
  manifest.some((entry) =>
    ["/index.html", "index.html"].includes(entry.url || entry),
  )
) {
  registerRoute(
    new NavigationRoute(createHandlerBoundToURL("/index.html"), {
      denylist: [/^\/api\//, /^\/sitemap\.xml$/, /^\/robots\.txt$/],
    }),
  );
}

registerRoute(
  ({ url }) => url.pathname.startsWith("/api/"),
  new NetworkFirst({
    cacheName: "api-cache",
    networkTimeoutSeconds: 5,
    plugins: [
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 86400 }),
      new CacheableResponsePlugin({ statuses: [200] }),
    ],
  }),
);

// --- Background Sync resilience net for offline mutations ---
//
// The app already owns a full IndexedDB-backed sync queue (see
// client/src/lib/syncEngine.js) that drives the UI's pending-changes
// indicator and reconciles temp ids with real server ids - that queue is
// what actually guarantees delivery once the app is reopened online. This
// layer is a *bonus*: if a mutating request fails while offline, Workbox
// queues the raw request in its own store and the browser's Background Sync
// API can replay it even if the tab is closed, without the app being
// reopened at all. Every create request carries a client-generated
// `clientMutationId` (see api/expenses.js etc.), so if both this layer and
// the app-level queue end up delivering the same op, the server's idempotent
// create lookup makes the second one a no-op instead of a duplicate.
//
// Background Sync (the `sync` event) is Chromium-only - Safari/iOS silently
// gets no benefit from this block, which is why the app-level queue above is
// the layer that must work everywhere on its own.
//
// The batch endpoint (/api/sync/batch) is deliberately NOT included here -
// it's driven solely by the app-level queue; queuing it here too would just
// create a second, redundant retry path for the same batched ops.
const MUTATING_ENTITY_PATHS = [
  /^\/api\/expenses(\/|$)/,
  /^\/api\/categories(\/|$)/,
  /^\/api\/tags(\/|$)/,
  /^\/api\/income-sources(\/|$)/,
  /^\/api\/goals(\/|$)/,
  /^\/api\/budgets\/monthly$/,
];

const bgSyncPlugin = new BackgroundSyncPlugin("spendly-mutations", {
  maxRetentionTime: 24 * 60, // minutes
});

const matchesMutatingEntityPath = ({ url }) =>
  MUTATING_ENTITY_PATHS.some((re) => re.test(url.pathname));

for (const method of ["POST", "PATCH", "DELETE", "PUT"]) {
  registerRoute(
    matchesMutatingEntityPath,
    new NetworkOnly({ plugins: [bgSyncPlugin] }),
    method,
  );
}

registerRoute(
  ({ url }) => url.origin === "https://fonts.googleapis.com",
  new StaleWhileRevalidate({ cacheName: "google-fonts-stylesheets" }),
);

registerRoute(
  ({ url }) => url.origin === "https://fonts.gstatic.com",
  new CacheFirst({
    cacheName: "google-fonts-webfonts",
    plugins: [
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 31536000 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
);

// --- Push notifications ---

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Spendly", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "Spendly";
  const options = {
    body: data.body || "",
    icon: "/pwa-192x192.png",
    badge: "/pwa-64x64.png",
    data: { url: data.url || "/updates" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/updates";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(url) && "focus" in client)
            return client.focus();
        }
        if (self.clients.openWindow) return self.clients.openWindow(url);
      }),
  );
});
