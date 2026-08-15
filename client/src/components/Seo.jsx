import { useEffect } from "react";

const ORIGIN = "https://spendly.it.com";

function upsert(selector, create, attr, value) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  if (el.getAttribute(attr) !== value) el.setAttribute(attr, value);
}

const meta = (key, keyAttr) => () => {
  const el = document.createElement("meta");
  el.setAttribute(keyAttr, key);
  return el;
};

const link = (rel) => () => {
  const el = document.createElement("link");
  el.setAttribute("rel", rel);
  return el;
};

/**
 * Mutates the static head tags from index.html with per-route values, then
 * marks <html data-seo="<path>"> - the prerender script waits on that signal
 * before snapshotting. Renders nothing.
 */
export default function Seo({ title, description, path }) {
  useEffect(() => {
    const url = ORIGIN + (path === "/" ? "/" : path);

    document.title = title;
    upsert(
      'meta[name="description"]',
      meta("description", "name"),
      "content",
      description,
    );
    upsert('link[rel="canonical"]', link("canonical"), "href", url);

    upsert(
      'meta[property="og:title"]',
      meta("og:title", "property"),
      "content",
      title,
    );
    upsert(
      'meta[property="og:description"]',
      meta("og:description", "property"),
      "content",
      description,
    );
    upsert(
      'meta[property="og:url"]',
      meta("og:url", "property"),
      "content",
      url,
    );

    upsert(
      'meta[name="twitter:title"]',
      meta("twitter:title", "name"),
      "content",
      title,
    );
    upsert(
      'meta[name="twitter:description"]',
      meta("twitter:description", "name"),
      "content",
      description,
    );
    upsert(
      'meta[name="twitter:url"]',
      meta("twitter:url", "name"),
      "content",
      url,
    );

    document.documentElement.setAttribute("data-seo", path);
  }, [title, description, path]);

  return null;
}
