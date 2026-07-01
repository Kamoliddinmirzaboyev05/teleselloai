import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  new: "bg-sky-50 text-sky-700",
  thinking: "bg-amber-50 text-amber-700",
  won: "bg-emerald-50 text-emerald-700",
  lost: "bg-rose-50 text-rose-700",
};

export function Badge({ value, className }: { value: string; className?: string }) {
  return <span className={cn("rounded px-2 py-1 text-xs font-medium", styles[value] ?? styles.new, className)}>{value}</span>;
}
