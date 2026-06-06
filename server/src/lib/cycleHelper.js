function daysInMonth(year, month) {
  // month is 0-indexed; new Date(year, month+1, 0) gives last day of the month
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

  // The effective start day this calendar month (capped to actual days in month)
  const thisMonthStartDay = effectiveDay(salaryDay, startYear, startMonth);

  if (ref.getDate() < thisMonthStartDay) {
    // Cycle started last month
    startMonth -= 1;
    if (startMonth < 0) { startMonth = 11; startYear -= 1; }
  }

  const startDay = effectiveDay(salaryDay, startYear, startMonth);
  const cycleStart = new Date(startYear, startMonth, startDay, 0, 0, 0, 0);

  // Next cycle starts the following month on the effective day
  let nextYear = startYear;
  let nextMonth = startMonth + 1;
  if (nextMonth > 11) { nextMonth = 0; nextYear += 1; }
  const nextStartDay = effectiveDay(salaryDay, nextYear, nextMonth);
  const nextCycleStart = new Date(nextYear, nextMonth, nextStartDay, 0, 0, 0, 0);

  // Current cycle ends 1ms before next cycle starts
  const cycleEnd = new Date(nextCycleStart.getTime() - 1);

  return { cycleStart, cycleEnd };
}

export function parseCycleStart(cycleStartParam, salaryDay) {
  if (cycleStartParam) {
    return getCycleRange(salaryDay, new Date(cycleStartParam));
  }
  return getCycleRange(salaryDay);
}
