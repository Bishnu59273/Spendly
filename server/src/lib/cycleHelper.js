function daysInMonthUTC(year, month) {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

function effectiveDayUTC(salaryDay, year, month) {
  return Math.min(salaryDay, daysInMonthUTC(year, month));
}

export function getCycleRange(salaryDay, referenceDate = new Date()) {
  const ref = new Date(referenceDate);

  const refYear  = ref.getUTCFullYear();
  const refMonth = ref.getUTCMonth();
  const refDay   = ref.getUTCDate();

  let startYear  = refYear;
  let startMonth = refMonth;

  const thisMonthStartDay = effectiveDayUTC(salaryDay, startYear, startMonth);

  if (refDay < thisMonthStartDay) {
    startMonth -= 1;
    if (startMonth < 0) { startMonth = 11; startYear -= 1; }
  }

  const startDay   = effectiveDayUTC(salaryDay, startYear, startMonth);
  const cycleStart = new Date(Date.UTC(startYear, startMonth, startDay, 0, 0, 0, 0));

  let nextYear  = startYear;
  let nextMonth = startMonth + 1;
  if (nextMonth > 11) { nextMonth = 0; nextYear += 1; }

  const nextStartDay  = effectiveDayUTC(salaryDay, nextYear, nextMonth);
  const nextCycleStart = new Date(Date.UTC(nextYear, nextMonth, nextStartDay, 0, 0, 0, 0));

  const cycleEnd = new Date(nextCycleStart.getTime() - 1);

  return { cycleStart, cycleEnd };
}

export function parseCycleStart(cycleStartParam, salaryDay) {
  if (cycleStartParam) {
    return getCycleRange(salaryDay, new Date(cycleStartParam));
  }
  return getCycleRange(salaryDay);
}
