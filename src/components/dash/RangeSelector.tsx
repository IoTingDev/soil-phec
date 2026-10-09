import { RANGES } from "@/lib/telemetry/catalog";
import type { RangeKey } from "@/lib/telemetry/types";
import { usePrefs } from "@/lib/prefs";
import { cn } from "@/lib/utils";

export function RangeSelector({ value, onChange }: { value?: RangeKey; onChange?: (r: RangeKey) => void }) {
  const { prefs, set } = usePrefs();
  const current = value ?? prefs.range;
  return (
    <div role="radiogroup" aria-label="Rango temporal" className="inline-flex rounded-md border bg-muted/50 p-0.5">
      {(Object.keys(RANGES) as RangeKey[]).map((r) => (
        <button
          key={r}
          role="radio"
          aria-checked={current === r}
          onClick={() => (onChange ? onChange(r) : set({ range: r }))}
          className={cn(
            "rounded px-2.5 py-1 text-xs font-medium transition-colors",
            current === r ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {RANGES[r].label}
        </button>
      ))}
    </div>
  );
}
