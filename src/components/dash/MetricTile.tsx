import { ArrowDownRight, ArrowRight, ArrowUpRight, Info } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";
import { VARIABLES } from "@/lib/telemetry/catalog";
import type { LatestReading, Threshold, VariableKey } from "@/lib/telemetry/types";
import { distanceToRange, evaluate, type Freshness } from "@/lib/telemetry/status";
import { useSeries } from "@/lib/telemetry/queries";
import { usePrefs } from "@/lib/prefs";
import { convert, fmt, unitOf } from "@/lib/format";
import { ConditionBadge } from "./status";
import { cn } from "@/lib/utils";

export function MetricTile({
  deviceId, variable, reading, threshold, f, loading, label,
}: {
  deviceId: string; variable: VariableKey; reading?: LatestReading; threshold?: Threshold; f: Freshness; loading?: boolean; label?: string;
}) {
  const { prefs } = usePrefs();
  const def = VARIABLES[variable];
  const series = useSeries(deviceId, variable, "24h");
  const unit = unitOf(variable, prefs);
  const value = reading?.value ?? null;
  const unavailable = !loading && value == null;
  const cond = evaluate(value, threshold);

  const pts = (series.data ?? []).filter((p) => p.value != null).map((p) => ({ ts: p.ts, v: convert(variable, p.value!, prefs) }));
  const recent = pts.slice(-5);
  const delta = recent.length > 1 ? recent[recent.length - 1].v - recent[0].v : null;
  const tol = 10 ** -def.decimals * 2;
  const TrendIcon = delta == null ? null : Math.abs(delta) <= tol ? ArrowRight : delta > 0 ? ArrowUpRight : ArrowDownRight;
  const gid = `g-${deviceId}-${variable}`;

  return (
    <div className={cn("panel relative flex min-w-0 flex-col overflow-hidden p-4", f !== "live" && !unavailable && "opacity-90")}>
      <span className="absolute inset-y-0 left-0 w-1" style={{ background: def.color }} aria-hidden />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-muted-foreground">{label ?? def.label}</p>
          {def.instrumentalNote && <p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground/80"><Info className="h-3 w-3" />{def.instrumentalNote}</p>}
        </div>
        <ConditionBadge c={cond} />
      </div>

      <div className="mt-2 flex items-baseline gap-1.5">
        {loading ? (
          <span className="h-8 w-20 animate-pulse rounded bg-muted" />
        ) : unavailable ? (
          <span className="text-sm font-medium text-muted-foreground">Variable no disponible</span>
        ) : (
          <>
            <span className="num text-[28px] font-semibold leading-none">{fmt(variable, value, prefs)}</span>
            {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
            {TrendIcon && (
              <span className="ml-auto inline-flex items-center gap-0.5 text-xs text-muted-foreground" title="Tendencia última hora">
                <TrendIcon className="h-3.5 w-3.5" />
                <span className="num">{delta! > 0 ? "+" : ""}{delta!.toFixed(def.decimals)}</span>
              </span>
            )}
          </>
        )}
      </div>

      {threshold && value != null && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          Objetivo <span className="num">{threshold.min ?? "—"}–{threshold.max ?? "—"} {unit}</span>
          {cond !== "ok" && <> · desvío <span className="num font-medium text-foreground">{distanceToRange(value, threshold).toFixed(def.decimals)}</span></>}
          {threshold.source === "demo" && " · umbral demo"}
        </p>
      )}

      <div className="mt-3 h-10">
        {pts.length > 1 && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={pts} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={def.color} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={def.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <YAxis hide domain={["dataMin", "dataMax"]} />
              <Area type="monotone" dataKey="v" stroke={def.color} strokeWidth={1.5} fill={`url(#${gid})`} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
