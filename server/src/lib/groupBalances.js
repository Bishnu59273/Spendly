import prisma from "./prisma.js";

const EPSILON = 0.01;

export function computeNetBalances(groupExpenses, confirmedSettlements, memberIds) {
  const balances = {};
  for (const id of memberIds) balances[id] = 0;

  for (const expense of groupExpenses) {
    if (balances[expense.paidById] === undefined) balances[expense.paidById] = 0;
    balances[expense.paidById] += expense.amount;
    for (const split of expense.splits) {
      if (balances[split.userId] === undefined) balances[split.userId] = 0;
      balances[split.userId] -= split.shareAmount;
    }
  }

  for (const settlement of confirmedSettlements) {
    if (balances[settlement.fromUserId] === undefined) balances[settlement.fromUserId] = 0;
    if (balances[settlement.toUserId] === undefined) balances[settlement.toUserId] = 0;
    balances[settlement.fromUserId] += settlement.amount;
    balances[settlement.toUserId] -= settlement.amount;
  }

  for (const id of Object.keys(balances)) {
    balances[id] = Math.round(balances[id] * 100) / 100;
  }

  return balances;
}

export function simplifyDebts(netBalances) {
  const entries = Object.entries(netBalances)
    .map(([userId, amount]) => ({ userId, amount }))
    .filter((e) => Math.abs(e.amount) > EPSILON);

  const creditors = entries.filter((e) => e.amount > 0).sort((a, b) => b.amount - a.amount);
  const debtors = entries.filter((e) => e.amount < 0).sort((a, b) => a.amount - b.amount);

  const suggestions = [];
  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci];
    const debtor = debtors[di];
    const amount = Math.round(Math.min(creditor.amount, -debtor.amount) * 100) / 100;

    if (amount > EPSILON) {
      suggestions.push({ fromUserId: debtor.userId, toUserId: creditor.userId, amount });
      creditor.amount -= amount;
      debtor.amount += amount;
    }

    if (Math.abs(creditor.amount) <= EPSILON) ci++;
    if (Math.abs(debtor.amount) <= EPSILON) di++;
  }

  return suggestions;
}

export async function fetchGroupBalances(groupId) {
  const [members, expenses, settlements] = await Promise.all([
    prisma.groupMember.findMany({ where: { groupId }, select: { userId: true } }),
    prisma.groupExpense.findMany({ where: { groupId }, include: { splits: true } }),
    prisma.settlement.findMany({ where: { groupId, status: "CONFIRMED" } }),
  ]);

  const memberIds = members.map((m) => m.userId);
  const balances = computeNetBalances(expenses, settlements, memberIds);
  const suggestions = simplifyDebts(balances);
  return { balances, suggestions };
}
