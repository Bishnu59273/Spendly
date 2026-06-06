function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function effectiveDay(salaryDay, year, month) {
  return Math.min(salaryDay, daysInMonth(year, month));
}

export function getCycleRange(salaryDay, referenceDate = new Date()) {
  const ref = new Date(referenceDate);
  ref.setHours(0, 0, 0, 0);

  let startYear = ref.getFullYear();
  let startMonth = ref.getMonth();

  const thisMonthStartDay = effectiveDay(salaryDay, startYear, startMonth);

  if (ref.getDate() < thisMonthStartDay) {
    startMonth -= 1;
    if (startMonth < 0) { startMonth = 11; startYear -= 1; }
  }

  const startDay = effectiveDay(salaryDay, startYear, startMonth);
  const cycleStart = new Date(startYear, startMonth, startDay, 0, 0, 0, 0);

  let nextYear = startYear;
  let nextMonth = startMonth + 1;
  if (nextMonth > 11) { nextMonth = 0; nextYear += 1; }
  const nextStartDay = effectiveDay(salaryDay, nextYear, nextMonth);
  const nextCycleStart = new Date(nextYear, nextMonth, nextStartDay, 0, 0, 0, 0);

  const cycleEnd = new Date(nextCycleStart.getTime() - 1);

  return { cycleStart, cycleEnd };
}

export function formatCycleLabel(cycleStart, cycleEnd) {
  const opts = { month: "short", day: "numeric" };
  return `${cycleStart.toLocaleDateString("en-US", opts)} – ${cycleEnd.toLocaleDateString("en-US", opts)}`;
}

export function prevCycleRef(cycleStart) {
  const ref = new Date(cycleStart);
  ref.setDate(ref.getDate() - 1);
  return ref;
}

export function nextCycleRef(cycleStart, salaryDay) {
  const year = cycleStart.getFullYear();
  const month = cycleStart.getMonth() + 1;
  const nextMonth = month > 10 ? 0 : month;
  const nextYear = month > 10 ? year + 1 : year;
  return new Date(nextYear, nextMonth, Math.min(salaryDay, new Date(nextYear, nextMonth + 1, 0).getDate()));
}
