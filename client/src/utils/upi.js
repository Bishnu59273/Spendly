export function buildUpiLink({ vpa, payeeName, amount, note }) {
  const params = new URLSearchParams({
    pa: vpa,
    pn: payeeName || "",
    am: Number(amount).toFixed(2),
    cu: "INR",
  });
  if (note) params.set("tn", note);
  return `upi://pay?${params.toString()}`;
}
