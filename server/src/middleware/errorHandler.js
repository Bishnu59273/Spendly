import { ZodError } from "zod";

export function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: "Validation error", details: err.errors });
  }
  console.error(err);
  res.status(500).json({ error: err.message || "Internal server error" });
}
