const GA_ID = "G-VTJHBC7SGV";

function gtag(...args) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag(...args);
  }
}

export function trackPageView(path) {
  gtag("event", "page_view", {
    page_path: path,
    send_to: GA_ID,
  });
}

export function trackEvent(name, params = {}) {
  gtag("event", name, { send_to: GA_ID, ...params });
}
