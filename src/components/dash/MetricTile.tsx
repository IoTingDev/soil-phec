import { ArrowDownRight, ArrowRight, ArrowUpRight, Info } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";
import { VARIABLES } from "@/lib/telemetry/catalog";
import type { LatestReading, Threshold, VariableKey } from "@/lib/telemetry/types";
import { evaluate, type Freshness } from "@/lib/telemetry/status";
import { useSeries } from "@/lib/telemetry/queries";
import { usePrefs } from "@/lib/prefs";
import { convert, fmt, unitOf } from "@/lib/format";
import { ConditionBadge } from "./status";
import { MetricGauge } from "./MetricGauge";
import { cn } from "@/lib/utils";
import { useId } from "react";

export function MetricTile({ deviceId, variable, reading, threshold, f, loading, label }: {
  deviceId: string; variable: VariableKey; reading?: LatestReading | undefined; threshold?: Threshold | undefined; f: Freshness; loading?: boolean; label?: string;
}) {
  const { prefs } = usePrefs();
  const def = VARIABLES[variable];
  const series = useSeries(deviceId, variable, "24h");
  const unit = unitOf(variable, prefs);
  const value = reading?.value ?? null;
  const unavailable = !loading && value == null;
  const cond = evaluate(value, threshold);
  const pts = (series.data ?? []).flatMap((p) => p.value == null ? [] : [{ ts: p.ts, v: convert(variable, p.value, prefs) }]);
  const recent = pts.slice(-5);
  const first = recent[0];
  const last = recent.at(-1);
  const delta = first && last && recent.length > 1 ? last.v - first.v : null;
  const TrendIcon = delta == null ? null : Math.abs(delta) <= 10 ** -def.decimals * 2 ? ArrowRight : delta > 0 ? ArrowUpRight : ArrowDownRight;
  const gid = useId();
  const displayed = value == null ? null : convert(variable, value, prefs);
  const target = threshold ? {
    min: threshold.min == null ? undefined : convert(variable, threshold.min, prefs),
    max: threshold.max == null ? undefined : convert(variable, threshold.max, prefs),
  } : undefined;
  const values = [...pts.map((p) => p.v), ...(displayed == null ? [] : [displayed]), ...(target?.min == null ? [] : [target.min]), ...(target?.max == null ? [] : [target.max])];
  const low = values.length ? Math.min(...values) : 0;
  const high = values.length ? Math.max(...values) : 1;
  const padding = Math.max((high - low) * 0.2, 10 ** -def.decimals * 5);
  const min = low - padding;
  const max = high + padding;
  const number = (n: number) => n.toLocaleString("es-CO", { maximumFractionDigits: def.decimals });

  return (
    <div className={cn("panel relative flex min-w-0 flex-col overflow-hidden p-3 sm:p-4", f !== "live" && !unavailable && "opacity-90")}>
      <span className="absolute inset-x-0 top-0 h-0.5" style={{ background: def.color }} aria-hidden />
      <div className="flex min-h-10 flex-wrap items-start justify-between gap-1">
        <p className="min-w-0 flex-1 text-xs font-medium text-muted-foreground">{label ?? def.label}</p>
        <ConditionBadge c={cond} />
      </div>
      {def.instrumentalNote && <p className="mb-1 flex items-start gap-1 text-[10px] text-muted-foreground"><Info className="h-3 w-3 shrink-0" />{def.instrumentalNote}</p>}
      <div className="relative mt-1 min-h-[112px]">
        {loading ? <div className="mx-auto h-24 w-full animate-pulse rounded bg-muted" /> : displayed == null ? <div className="flex h-28 items-center justify-center text-center text-xs text-muted-foreground">Variable no disponible</div> : <>
          <MetricGauge value={displayed} min={min} max={max} color={def.color} target={target} />
          <div className="absolute inset-x-0 top-[52px] text-center">
            <span className="num block text-[24px] font-semibold leading-tight">{fmt(variable, value, prefs)}</span>
            <span className="block min-h-4 text-[11px] text-muted-foreground">{unit || "pH"}</span>
          </div>
        </>}
      </div>
      {displayed != null && <div className="mb-2 flex justify-between gap-1 text-[9px] text-muted-foreground" title="Escala visual derivada de las lecturas disponibles y del objetivo configurado"><span className="num">{number(min)}</span><span>Escala observada</span><span className="num">{number(max)}</span></div>}
      <div className="flex min-h-7 flex-wrap items-center justify-between gap-1 border-t pt-2 text-[10px] text-muted-foreground">
        <span>{f === "live" ? "Última lectura" : f === "nodata" ? "Sin datos" : "Lectura anterior"}</span>
        {TrendIcon && delta != null && <span className="num inline-flex items-center gap-0.5" title="Variación de las últimas cinco lecturas disponibles"><TrendIcon className="h-3.5 w-3.5" />{delta > 0 ? "+" : ""}{number(delta)} {unit}</span>}
      </div>
      <div className="mt-2 h-9" aria-hidden>
        {pts.length > 1 && <ResponsiveContainer width="100%" height="100%"><AreaChart data={pts} margin={{ top: 3, right: 0, bottom: 0, left: 0 }}>
          <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={def.color} stopOpacity={0.25} /><stop offset="100%" stopColor={def.color} stopOpacity={0.02} /></linearGradient></defs>
          <YAxis hide domain={["dataMin", "dataMax"]} /><Area type="monotone" dataKey="v" stroke={def.color} strokeWidth={2} fill={`url(#${gid})`} isAnimationActive={false} />
        </AreaChart></ResponsiveContainer>}
      </div>
      <div className="mt-1 flex flex-wrap justify-between gap-1 text-[10px] text-muted-foreground"><span>24 h</span><span className="num">{pts.length ? `${number(Math.min(...pts.map(p => p.v)))}–${number(Math.max(...pts.map(p => p.v)))}` : "—"} {unit}</span></div>
      {target && (target.min != null || target.max != null) ? <p className="mt-2 border-t pt-2 text-[10px] text-muted-foreground">Objetivo <span className="num">{target.min == null ? "—" : number(target.min)}–{target.max == null ? "—" : number(target.max)} {unit}</span>{threshold?.source === "demo" && " · demo"}</p> : <p className="mt-2 border-t pt-2 text-[10px] text-muted-foreground">Sin umbral configurado</p>}
    </div>
  );
}
