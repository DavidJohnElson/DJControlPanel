export const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

export function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function monthKey(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

export function dateToInputValue(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function addMonths(dateString, months) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setMonth(date.getMonth() + Number(months));
  return date;
}

export function monthsRemaining(startDate, tenureMonths, today = new Date()) {
  if (!startDate || !tenureMonths) return null;
  const end = addMonths(startDate, tenureMonths);
  const diff = (end.getFullYear() - today.getFullYear()) * 12 + end.getMonth() - today.getMonth();
  return Math.max(0, diff);
}

export function isInMonth(dateString, selectedMonth) {
  return dateString?.startsWith(selectedMonth);
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function byDateDesc(a, b) {
  return String(b.date).localeCompare(String(a.date));
}
