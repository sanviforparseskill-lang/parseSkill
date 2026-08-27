export type Category = "Backend" | "Frontend" | "ML/AI" | "DevOps" | "Database" | "Language/Core";

export const categoryColor: Record<Category, string> = {
  Backend: "var(--color-cat-backend)",
  Frontend: "var(--color-cat-frontend)",
  "ML/AI": "var(--color-cat-ml)",
  DevOps: "var(--color-cat-devops)",
  Database: "var(--color-cat-database)",
  "Language/Core": "var(--color-cat-language)",
};

const FALLBACK_COLOR = "var(--color-cat-language)";

/** Backend categories are free-text (ESCO-derived); map to the closest known bucket. */
export function normalizeCategory(raw: string | null | undefined): Category {
  const c = (raw ?? "").toLowerCase();
  if (c.includes("front")) return "Frontend";
  if (c.includes("back") || c.includes("api") || c.includes("server")) return "Backend";
  if (c.includes("ml") || c.includes("ai") || c.includes("data science") || c.includes("machine")) return "ML/AI";
  if (c.includes("devops") || c.includes("infra") || c.includes("cloud") || c.includes("ops")) return "DevOps";
  if (c.includes("database") || c.includes("sql") || c.includes("db")) return "Database";
  if (c.includes("lang") || c.includes("core")) return "Language/Core";
  return "Language/Core";
}

export function colorForCategory(raw: string | null | undefined): string {
  return categoryColor[normalizeCategory(raw)] ?? FALLBACK_COLOR;
}
