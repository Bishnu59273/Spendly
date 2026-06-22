export const CURRENCY_SYMBOLS = {
  INR: "₹", USD: "$", EUR: "€", GBP: "£", JPY: "¥", AUD: "A$",
  CAD: "C$", CHF: "Fr", CNY: "¥", SGD: "S$", AED: "د.إ", BDT: "৳",
};

export const CURRENCIES = Object.keys(CURRENCY_SYMBOLS);

export function getCurrencySymbol(currency) {
  return CURRENCY_SYMBOLS[currency] ?? currency ?? "₹";
}

export function formatCurrency(amount, currency = "INR") {
  const locale = currency === "INR" ? "en-IN" : "en-US";
  const symbol = CURRENCY_SYMBOLS[currency];
  if (symbol) {
    const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(amount);
    return `${symbol}${number}`;
  }
  return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

export function groupByDate(expenses) {
  const groups = {};
  for (const e of expenses) {
    const key = new Date(e.date).toISOString().split("T")[0];
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  }
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
}
