import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const DEFAULT_CATEGORIES = [
  { name: "Food", color: "#F97316", icon: "🍔" },
  { name: "Transport", color: "#3B82F6", icon: "🚗" },
  { name: "Housing", color: "#8B5CF6", icon: "🏠" },
  { name: "Health", color: "#EF4444", icon: "💊" },
  { name: "Entertainment", color: "#EC4899", icon: "🎮" },
  { name: "Shopping", color: "#F59E0B", icon: "🛍️" },
  { name: "Education", color: "#10B981", icon: "📚" },
  { name: "Utilities", color: "#6B7280", icon: "⚡" },
];

export async function seedDefaultCategories(userId) {
  const categories = DEFAULT_CATEGORIES.map((c) => ({
    ...c,
    userId,
    isDefault: true,
  }));
  await prisma.category.createMany({ data: categories });
}

async function main() {
  console.log("Seed file ready. Categories seeded per user on registration.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
