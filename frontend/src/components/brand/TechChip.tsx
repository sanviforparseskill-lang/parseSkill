import { cn } from "@/lib/utils";
import { colorForCategory } from "@/lib/category-colors";
import { ConfidenceBar } from "./ConfidenceBar";

export function TechChip({
  name, category, confidence, size = "sm", tone = "solid",
}: {
  name: string; category?: string | null; confidence?: number;
  size?: "sm" | "md"; tone?: "solid" | "outline";
}) {
  const color = colorForCategory(category);
  return (
    <span
      className={cn(
        "inline-flex flex-col gap-1 border rounded px-2 py-1 font-mono transition-colors",
        size === "md" ? "text-[12px]" : "text-[11px]",
        tone === "outline" ? "bg-transparent" : "bg-secondary/60",
        "hover:border-proof"
      )}
      style={{ borderColor: `color-mix(in oklab, ${color} 55%, transparent)` }}
    >
      <span className="flex items-center gap-1.5 leading-none">
        <span className="w-1.5 h-1.5 rounded-sm" style={{ background: color }} aria-hidden />
        <span className="text-ink">{name}</span>
      </span>
      {confidence !== undefined && (
        <ConfidenceBar value={confidence} showLabel={false} />
      )}
    </span>
  );
}

export function SkillChip(props: React.ComponentProps<typeof TechChip>) {
  return <TechChip {...props} />;
}
