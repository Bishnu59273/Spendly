// Post-build prerender: serves dist/, renders each public route in headless
// Chromium, and writes the fully-rendered HTML back as static files so
// crawlers get real content without executing JS. Also re-syncs the
// service-worker precache revision for the mutated index.html.
import { preview } from "vite";
import { chromium } from "playwright-core";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");

const ROUTES = [
  { path: "/", out: "index.html", mustContain: "payday" },
  { path: "/login", out: "login/index.html", mustContain: "Sign in to your Spendly account" },
  { path: "/register", out: "register/index.html", mustContain: "Create your account" },
];

async function launchBrowser() {
  if (process.env.VERCEL || process.env.CI) {
    // Vercel's build image has no Chrome; use the statically-linked build.
    // @sparticuz/chromium only unpacks its bundled shared libs (libnss3 etc.)
    // and sets LD_LIBRARY_PATH when it detects an AWS Lambda Node 20/22
    // runtime — Vercel build containers set neither var, so fake it BEFORE
    // the import (the env check runs at module load).
    process.env.AWS_LAMBDA_JS_RUNTIME ||= "nodejs20.x";
    const sparticuz = (await import("@sparticuz/chromium")).default;
    return chromium.launch({
      executablePath: await sparticuz.executablePath(),
      // Drop sparticuz's --headless='shell' (a puppeteer-ism); playwright
      // passes its own --headless flag.
      args: sparticuz.args.filter((a) => !a.startsWith("--headless")),
    });
  }
  try {
    return await chromium.launch({ channel: "chrome" });
  } catch {
    return await chromium.launch({ channel: "msedge" });
  }
}

const server = await preview({ root, preview: { port: 4173, strictPort: false, open: false } });
const base = server.resolvedUrls.local[0].replace(/\/$/, "");
console.log(`prerender: serving dist at ${base}`);

const browser = await launchBrowser();
const context = await browser.newContext({
  serviceWorkers: "block",
  viewport: { width: 1280, height: 800 },
});

// Abort API calls (queries settle instantly; useMe fails -> no auth redirect)
// and analytics (no pageviews from build machines).
await context.route("**/api/**", (r) => r.abort());
await context.route(/googletagmanager\.com|google-analytics\.com/, (r) => r.abort());

for (const { path, out, mustContain } of ROUTES) {
  const page = await context.newPage();
  await page.goto(base + path, { waitUntil: "networkidle" });
  await page.waitForSelector(`html[data-seo="${path}"]`, { state: "attached", timeout: 15_000 });
  await page.waitForFunction(() => document.getElementById("root")?.children.length > 0);

  let html = await page.content();
  if (!/^<!doctype html>/i.test(html)) html = "<!doctype html>\n" + html;
  if (!html.toLowerCase().includes(mustContain.toLowerCase())) {
    throw new Error(`prerender sanity check failed for ${path}: "${mustContain}" not in output`);
  }

  const file = join(dist, out);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, html, "utf8");
  console.log(`prerender: ${path} -> ${out} (${(html.length / 1024).toFixed(1)} kB)`);
  await page.close();
}

await browser.close();

// index.html changed after workbox computed its precache revision at build
// time; patch the inlined manifest entry so SW clients pick up new content.
const swFile = join(dist, "sw.js");
const sw = await readFile(swFile, "utf8");
const newRev = createHash("md5").update(await readFile(join(dist, "index.html"))).digest("hex");
const patched = sw.replace(
  /(\{[^{}]{0,160}?["']?url["']?\s*:\s*["']\/?index\.html["'][^{}]{0,160}?["']?revision["']?\s*:\s*["'])[0-9a-f]{32}(["'])|(\{[^{}]{0,160}?["']?revision["']?\s*:\s*["'])[0-9a-f]{32}(["'][^{}]{0,160}?["']?url["']?\s*:\s*["']\/?index\.html["'])/,
  (m, a, b, c, d) => (a !== undefined ? a + newRev + b : c + newRev + d),
);
if (patched === sw) {
  throw new Error("prerender: could not patch index.html revision in dist/sw.js — manifest format changed?");
}
await writeFile(swFile, patched, "utf8");
console.log(`prerender: patched sw.js index.html revision -> ${newRev}`);

await new Promise((res, rej) => server.httpServer.close((e) => (e ? rej(e) : res())));
console.log("prerender: done");
