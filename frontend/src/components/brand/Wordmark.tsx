import { cn } from "@/lib/utils";

export function Wordmark({ className, blink = false }: { className?: string; blink?: boolean }) {
  return (
    <span
      className={cn("font-display font-bold tracking-tight text-ink", className)}
      style={{ fontFamily: "var(--font-display)" }}
      aria-label="parseSkill();"
    >
      parseSkill()
      <span className={cn("text-signal", blink && "cursor-blink")}>;</span>
    </span>
  );
}
