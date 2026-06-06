function daysInMonthUTC(year, month) {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

function effectiveDayUTC(salaryDay, year, month) {
  return Math.min(salaryDay, daysInMonthUTC(year, month));
}

export function getCycleRange(salaryDay, referenceDate = new Date()) {
  const ref = new Date(referenceDate);

  let startYear  = ref.getUTCFullYear();
  let startMonth = ref.getUTCMonth();
  const refDay   = ref.getUTCDate();

  if (refDay < effectiveDayUTC(salaryDay, startYear, startMonth)) {
    startMonth -= 1;
    if (startMonth < 0) { startMonth = 11; startYear -= 1; }
  }

  const startDay    = effectiveDayUTC(salaryDay, startYear, startMonth);
  const cycleStart  = new Date(Date.UTC(startYear, startMonth, startDay, 0, 0, 0, 0));

  let nextYear  = startYear;
  let nextMonth = startMonth + 1;
  if (nextMonth > 11) { nextMonth = 0; nextYear += 1; }

  const nextCycleStart = new Date(Date.UTC(nextYear, nextMonth, effectiveDayUTC(salaryDay, nextYear, nextMonth), 0, 0, 0, 0));
  const cycleEnd        = new Date(nextCycleStart.getTime() - 1);

  return { cycleStart, cycleEnd };
}

export function formatCycleLabel(cycleStart, cycleEnd) {
  const opts = { month: "short", day: "numeric", timeZone: "UTC" };
  return `${cycleStart.toLocaleDateString("en-US", opts)} – ${cycleEnd.toLocaleDateString("en-US", opts)}`;
}

export function prevCycleRef(cycleStart) {
  return new Date(cycleStart.getTime() - 24 * 60 * 60 * 1000);
}

export function nextCycleRef(cycleStart, salaryDay) {
  const year  = cycleStart.getUTCFullYear();
  const month = cycleStart.getUTCMonth() + 1;
  const nextMonth = month > 11 ? 0     : month;
  const nextYear  = month > 11 ? year + 1 : year;
  return new Date(Date.UTC(nextYear, nextMonth, effectiveDayUTC(salaryDay, nextYear, nextMonth)));
}
