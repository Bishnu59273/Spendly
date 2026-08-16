import prisma from "./prisma.js";

const WINDOW_DAYS_DEFAULT = 90;
const MIN_NOTE_LENGTH = 3;
// The rate/observed-days checks below already guard against coincidence (a
// rate >= FREQUENT_MIN_RATE needs those occurrences reasonably close
// together), so 2 is enough of a floor - requiring 3 was excluding real
// patterns for accounts that are only a couple weeks old.
const MIN_OCCURRENCES = 2;

// Rate is measured against days-since-first-logged for THIS cluster, not the
// fixed window - a habit that's 15 days old and logged on 14 of them is
// clearly daily, but 14/90 would dilute that below any sane threshold.
const DAILY_MIN_OBSERVED_DAYS = 7;
const DAILY_MIN_RATE = 0.55;
const DAILY_MAX_RECENCY_DAYS = 3;

const FREQUENT_MIN_OBSERVED_DAYS = 4;
const FREQUENT_MIN_RATE = 0.08;
const FREQUENT_MAX_RECENCY_DAYS = 21;

const DAILY_TIER_LIMIT = 5;
const FREQUENT_TIER_LIMIT = 8;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

function daysBetween(a, b) {
  return Math.round((a.getTime() - b.getTime()) / MS_PER_DAY);
}

// Detects repeat/habitual spending (e.g. daily coffee, frequent takeout) from
// note+category clusters so the expense form can offer a quick-fill instead
// of the user retyping the same expense every time. Deliberately excludes
// isRecurring expenses - those are already auto-inserted by the cron in
// index.js and shouldn't be double-suggested here.
export async function computeHabitSuggestions(userId, { windowDays = WINDOW_DAYS_DEFAULT } = {}) {
  const since = new Date(Date.now() - windowDays * MS_PER_DAY);

  const expenses = await prisma.expense.findMany({
    where: {
      userId,
      type: "EXPENSE",
      isRecurring: false,
      date: { gte: since },
      note: { not: null },
    },
    include: { category: true, tags: { include: { tag: true } } },
    orderBy: { date: "desc" },
  });

  const clusters = new Map();

  for (const exp of expenses) {
    const normalizedNote = exp.note.trim().toLowerCase().replace(/\s+/g, " ");
    if (normalizedNote.length < MIN_NOTE_LENGTH) continue;

    const key = `${exp.categoryId ?? "none"}::${normalizedNote}`;
    let cluster = clusters.get(key);
    if (!cluster) {
      // Rows arrive ordered by date desc, so the first row seen for a key
      // is always the most recent occurrence.
      cluster = {
        note: exp.note.trim(),
        category: exp.category,
        tagIds: exp.tags.map((t) => t.tag.id),
        lastDate: exp.date,
        distinctDays: new Set(),
        count: 0,
        amountCounts: new Map(),
        minutesOfDaySum: 0,
      };
      clusters.set(key, cluster);
    }
    cluster.count += 1;
    cluster.distinctDays.add(dateKey(exp.date));
    cluster.amountCounts.set(exp.amount, (cluster.amountCounts.get(exp.amount) ?? 0) + 1);
    // Rows arrive newest-first, so this keeps getting overwritten and ends up
    // holding the oldest occurrence within the window once the loop finishes.
    cluster.firstDate = exp.date;
    // UTC, not local: this runs server-side, so local getHours()/getMinutes()
    // would reflect the server's timezone rather than the user's. The client
    // converts this back to the viewer's own local time for display.
    cluster.minutesOfDaySum += exp.date.getUTCHours() * 60 + exp.date.getUTCMinutes();
  }

  const now = new Date();
  const dailyHabits = [];
  const frequentHabits = [];

  for (const cluster of clusters.values()) {
    if (cluster.count < MIN_OCCURRENCES) continue;

    const distinctDays = cluster.distinctDays.size;
    const observedDays = Math.max(1, daysBetween(now, cluster.firstDate));
    const rate = distinctDays / observedDays;
    const recencyDays = daysBetween(now, cluster.lastDate);

    let modalAmount = null;
    let modalCount = -1;
    for (const [amount, amountCount] of cluster.amountCounts) {
      if (amountCount > modalCount) {
        modalAmount = amount;
        modalCount = amountCount;
      }
    }

    const suggestion = {
      note: cluster.note,
      category: cluster.category
        ? {
            id: cluster.category.id,
            name: cluster.category.name,
            color: cluster.category.color,
            icon: cluster.category.icon,
          }
        : null,
      tagIds: cluster.tagIds,
      amount: modalAmount,
      occurrences: cluster.count,
      distinctDays,
      lastLoggedAt: cluster.lastDate,
      typicalMinuteOfDayUtc: Math.round(cluster.minutesOfDaySum / cluster.count) % (24 * 60),
      score: distinctDays * (1 / (1 + recencyDays / 7)),
    };

    if (
      observedDays >= DAILY_MIN_OBSERVED_DAYS &&
      rate >= DAILY_MIN_RATE &&
      recencyDays <= DAILY_MAX_RECENCY_DAYS
    ) {
      dailyHabits.push(suggestion);
    } else if (
      observedDays >= FREQUENT_MIN_OBSERVED_DAYS &&
      rate >= FREQUENT_MIN_RATE &&
      recencyDays <= FREQUENT_MAX_RECENCY_DAYS
    ) {
      frequentHabits.push(suggestion);
    }
  }

  dailyHabits.sort((a, b) => b.score - a.score);
  frequentHabits.sort((a, b) => b.score - a.score);

  return {
    dailyHabits: dailyHabits.slice(0, DAILY_TIER_LIMIT),
    frequentHabits: frequentHabits.slice(0, FREQUENT_TIER_LIMIT),
  };
}
