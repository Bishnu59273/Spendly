import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  expenseSchema,
  createExpenseRecord,
  updateExpenseRecord,
  deleteExpenseRecord,
} from "./expenses.js";
import {
  categorySchema,
  createCategoryRecord,
  updateCategoryRecord,
  deleteCategoryRecord,
} from "./categories.js";
import {
  tagSchema,
  createTagRecord,
  updateTagRecord,
  deleteTagRecord,
} from "./tags.js";
import {
  incomeSourceSchema,
  createIncomeSourceRecord,
  deleteIncomeSourceRecord,
} from "./incomeSources.js";
import {
  goalSchema,
  createGoalRecord,
  updateGoalRecord,
  deleteGoalRecord,
} from "./goals.js";
import { monthlyBudgetSchema, setMonthlyBudgetRecord } from "./budgets.js";

const router = Router();
router.use(authMiddleware);

// Each entity plugs into the same batch dispatcher below - adding a new
// offline-syncable entity only means adding a registry entry here.
const HANDLERS = {
  expense: {
    schema: expenseSchema,
    create: createExpenseRecord,
    update: (userId, id, data, expectedUpdatedAt) =>
      updateExpenseRecord(userId, id, data, expectedUpdatedAt),
    delete: deleteExpenseRecord,
  },
  category: {
    schema: categorySchema,
    create: createCategoryRecord,
    update: updateCategoryRecord,
    delete: deleteCategoryRecord,
  },
  tag: {
    schema: tagSchema,
    create: createTagRecord,
    update: updateTagRecord,
    delete: deleteTagRecord,
  },
  incomeSource: {
    schema: incomeSourceSchema,
    create: createIncomeSourceRecord,
    delete: deleteIncomeSourceRecord,
  },
  goal: {
    schema: goalSchema,
    create: createGoalRecord,
    update: (userId, id, data, expectedUpdatedAt, rawPayload) =>
      updateGoalRecord(
        userId,
        id,
        data,
        expectedUpdatedAt,
        rawPayload?.deductFromBudget,
      ),
    delete: deleteGoalRecord,
  },
  monthlyBudget: {
    schema: monthlyBudgetSchema,
    upsert: setMonthlyBudgetRecord,
  },
};

async function runOp(userId, op) {
  const handler = HANDLERS[op.entity];
  if (!handler)
    return {
      clientOpId: op.clientOpId,
      status: "error",
      error: "Unknown entity",
    };

  if (op.op === "create") {
    if (!handler.create)
      return {
        clientOpId: op.clientOpId,
        status: "error",
        error: "Create not supported",
      };
    const data = handler.schema.parse({
      ...op.payload,
      clientMutationId: op.clientOpId,
    });
    const result = await handler.create(userId, data);
    if (result.error)
      return {
        clientOpId: op.clientOpId,
        status: "error",
        error: result.error,
      };
    return {
      clientOpId: op.clientOpId,
      status: "ok",
      tempId: op.tempId,
      record: result.record,
    };
  }

  if (op.op === "update") {
    if (!handler.update)
      return {
        clientOpId: op.clientOpId,
        status: "error",
        error: "Update not supported",
      };
    const data = handler.schema.partial().parse(op.payload || {});
    const result = await handler.update(
      userId,
      op.id,
      data,
      op.expectedUpdatedAt,
      op.payload || {},
    );
    if (result.notFound)
      return { clientOpId: op.clientOpId, status: "not_found" };
    if (result.conflict)
      return {
        clientOpId: op.clientOpId,
        status: "conflict",
        serverRecord: result.serverRecord,
      };
    if (result.error)
      return {
        clientOpId: op.clientOpId,
        status: "error",
        error: result.error,
      };
    return { clientOpId: op.clientOpId, status: "ok", record: result.record };
  }

  if (op.op === "delete") {
    if (!handler.delete)
      return {
        clientOpId: op.clientOpId,
        status: "error",
        error: "Delete not supported",
      };
    const result = await handler.delete(userId, op.id);
    if (result.notFound)
      return { clientOpId: op.clientOpId, status: "not_found" };
    if (result.error)
      return {
        clientOpId: op.clientOpId,
        status: "error",
        error: result.error,
      };
    return { clientOpId: op.clientOpId, status: "ok" };
  }

  if (op.op === "upsert") {
    if (!handler.upsert)
      return {
        clientOpId: op.clientOpId,
        status: "error",
        error: "Upsert not supported",
      };
    const data = handler.schema.parse(op.payload);
    const result = await handler.upsert(userId, data);
    return { clientOpId: op.clientOpId, status: "ok", record: result.record };
  }

  return { clientOpId: op.clientOpId, status: "error", error: "Unknown op" };
}

// Ops run sequentially, in order - a failure on one op must not roll back
// the ops before it, so this is intentionally not wrapped in one transaction.
router.post("/batch", async (req, res, next) => {
  try {
    const ops = Array.isArray(req.body.ops) ? req.body.ops : [];
    const results = [];

    for (const op of ops) {
      try {
        results.push(await runOp(req.userId, op));
      } catch (err) {
        results.push({
          clientOpId: op.clientOpId,
          status: "error",
          error: err.message || "Failed",
        });
      }
    }

    res.json({ results });
  } catch (err) {
    next(err);
  }
});

export default router;
