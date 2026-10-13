import { useId, useState } from "react";
import { ChartArea, ChartNoAxesCombined, RotateCcw } from "lucide-react";
import { Area, CartesianGrid, ComposedChart, Line, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { VARIABLES, getDevice } from "@/lib/telemetry/catalog";
import { useSeries } from "@/lib/telemetry/queries";
import type { RangeKey, Threshold, VariableKey } from "@/lib/telemetry/types";
import { usePrefs } from "@/lib/prefs";
import { convert, fmtDateTime, unitOf } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { StateBox } from "./status";

export interface SeriesSpec { deviceId: string; variable: VariableKey; color?: string; dashed?: boolean; }
const keyOf = (s: SeriesSpec) => `${s.deviceId}__${s.variable}`;
function seriesLabel(s: SeriesSpec) { const d = getDevice(s.deviceId); return `${d.name}${d.depthCm ? ` (${d.depthCm} cm)` : ""}`; }

export function TimeSeriesChart({ series, range, height = 280, threshold, labelBy = "device" }: {
  series: SeriesSpec[]; range?: RangeKey; height?: number; threshold?: Threshold; labelBy?: "device" | "variable";
}) {
  const { prefs } = usePrefs();
  const [mode, setMode] = useState<"area" | "line">("area");
  const [hidden, setHidden] = useState<string[]>([]);
  const id = useId();
  const r = range ?? prefs.range;
  const s0 = series[0];
  const s1 = series[1];
  const a = useSeries(s0?.deviceId ?? "soil-10", s0?.variable ?? "soil_moisture", r);
  const b = useSeries(s1?.deviceId ?? s0?.deviceId ?? "soil-10", s1?.variable ?? s0?.variable ?? "soil_moisture", r);
  if (!s0) return <StateBox kind="empty" title="Sin series seleccionadas" />;
  const results = series.length > 1 ? [a, b] : [a];
  const v0 = s0.variable;
  const unit = unitOf(v0, prefs);
  if (results.some(q => q.isLoading)) return <div style={{ height }} className="animate-pulse rounded-md bg-muted/60" />;
  if (results.some(q => q.isError)) return <div style={{ height }}><StateBox kind="error" title="Error de comunicación">No fue posible obtener la serie temporal.</StateBox></div>;
  const map = new Map<number, Record<string, number | null>>();
  results.forEach((q, i) => {
    const spec = series[i];
    if (!spec) return;
    for (const p of q.data ?? []) { const row = map.get(p.ts) ?? { ts: p.ts }; row[keyOf(spec)] = p.value == null ? null : convert(spec.variable, p.value, prefs); map.set(p.ts, row); }
  });
  const data = [...map.values()].sort((x, y) => Number(x.ts) - Number(y.ts));
  if (!data.length || !data.some(row => series.some(s => row[keyOf(s)] != null))) return <div style={{ height }}><StateBox kind="empty" title="Sin datos en el rango seleccionado">El dispositivo no ha reportado lecturas para este periodo.</StateBox></div>;
  const tickFmt = (ts: number) => r === "24h" ? new Date(ts).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: false }) : new Date(ts).toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
  const number = (n: number) => n.toLocaleString("es-CO", { maximumFractionDigits: VARIABLES[v0].decimals });
  const titleFor = (s: SeriesSpec) => labelBy === "device" ? seriesLabel(s) : VARIABLES[s.variable].label;
  return (
    <div className="min-w-0">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {series.map(s => <Button key={keyOf(s)} variant="ghost" size="sm" className="h-7 px-1 text-[11px]" aria-pressed={!hidden.includes(keyOf(s))} onClick={() => setHidden(h => h.includes(keyOf(s)) ? h.filter(k => k !== keyOf(s)) : [...h, keyOf(s)])}>
            <svg width="20" height="8" aria-hidden><line x1="0" x2="20" y1="4" y2="4" stroke={s.color ?? VARIABLES[s.variable].color} strokeWidth="3" strokeDasharray={s.dashed ? "4 3" : undefined} opacity={hidden.includes(keyOf(s)) ? 0.25 : 1} /></svg>
            <span className={hidden.includes(keyOf(s)) ? "text-muted-foreground line-through" : ""}>{titleFor(s)}</span>
          </Button>)}
          {threshold && <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"><span className="h-2 w-2 bg-status-ok/30" />Objetivo{threshold.source === "demo" ? " demo" : ""}</span>}
        </div>
        <div className="flex items-center gap-0.5 rounded-md border p-0.5">
          <Button variant={mode === "area" ? "secondary" : "ghost"} size="icon" className="h-7 w-7" title="Gráfica de áreas" aria-label="Gráfica de áreas" aria-pressed={mode === "area"} onClick={() => setMode("area")}><ChartArea /></Button>
          <Button variant={mode === "line" ? "secondary" : "ghost"} size="icon" className="h-7 w-7" title="Gráfica de líneas" aria-label="Gráfica de líneas" aria-pressed={mode === "line"} onClick={() => setMode("line")}><ChartNoAxesCombined /></Button>
          {hidden.length > 0 && <Button variant="ghost" size="icon" className="h-7 w-7" title="Mostrar todas las series" aria-label="Mostrar todas las series" onClick={() => setHidden([])}><RotateCcw /></Button>}
        </div>
      </div>
      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 12, right: 8, bottom: 4, left: 0 }}>
            <defs>{series.map((s,i) => <linearGradient key={keyOf(s)} id={`${id}-${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={s.color ?? VARIABLES[s.variable].color} stopOpacity={0.2} /><stop offset="100%" stopColor={s.color ?? VARIABLES[s.variable].color} stopOpacity={0.01} /></linearGradient>)}</defs>
            <CartesianGrid stroke="var(--border)" strokeDasharray="2 5" vertical={false} />
            {threshold && (threshold.min != null || threshold.max != null) && <ReferenceArea {...(threshold.min == null ? {} : { y1: convert(v0, threshold.min, prefs) })} {...(threshold.max == null ? {} : { y2: convert(v0, threshold.max, prefs) })} fill="var(--status-ok)" fillOpacity={0.08} stroke="var(--status-ok)" strokeOpacity={0.4} strokeDasharray="4 4" ifOverflow="extendDomain" />}
            <XAxis dataKey="ts" type="number" scale="time" domain={["dataMin", "dataMax"]} tickFormatter={tickFmt} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} minTickGap={45} dy={8} />
            <YAxis width={52} domain={["auto", "auto"]} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} tickFormatter={number} />
            <Tooltip cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "4 4" }} content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return <div className="panel max-w-[280px] p-3 text-xs"><p className="num mb-2 text-muted-foreground">{fmtDateTime(Number(label))}</p>{payload.map(p => {
                const s = series.find(x => keyOf(x) === p.dataKey); if (!s) return null;
                return <div key={String(p.dataKey)} className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-1"><span className="flex items-center gap-1.5"><svg width="7" height="7" aria-hidden><circle cx="3.5" cy="3.5" r="3.5" fill={s.color ?? VARIABLES[s.variable].color} /></svg>{titleFor(s)}</span><span className="num font-semibold">{p.value == null ? "—" : number(Number(p.value))} {unitOf(s.variable,prefs)}</span></div>;
              })}</div>;
            }} />
            {series.map((s,i) => {
              const shared = { dataKey: keyOf(s), name: titleFor(s), stroke: s.color ?? VARIABLES[s.variable].color, strokeWidth: 2.5, strokeDasharray: s.dashed ? "6 4" : undefined, dot: prefs.showDots ? { r: 2 } : false, activeDot: { r: 5, stroke: "var(--card)", strokeWidth: 2 }, connectNulls: false, isAnimationActive: false, hide: hidden.includes(keyOf(s)) };
              return mode === "area" ? <Area key={keyOf(s)} {...shared} type="monotone" fill={`url(#${id}-${i})`} /> : <Line key={keyOf(s)} {...shared} type="monotone" />;
            })}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 grid gap-3 border-t pt-3 sm:grid-cols-2">
        {series.map((s,i) => {
          const values = (results[i]?.data ?? []).flatMap(p => p.value == null ? [] : [convert(s.variable,p.value,prefs)]);
          if (!values.length) return null;
          const latest = values.at(-1); if (latest == null) return null;
          return <div key={keyOf(s)} className="min-w-0"><p className="mb-2 text-[10px] text-muted-foreground">{titleFor(s)} · {unitOf(s.variable,prefs) || "pH"}</p><dl className="grid grid-cols-4 gap-2">{[["Último",latest],["Mín.",Math.min(...values)],["Máx.",Math.max(...values)],["Prom.",values.reduce((sum,v) => sum+v,0)/values.length]].map(([label,v]) => <div key={String(label)}><dt className="text-[10px] text-muted-foreground">{label}</dt><dd className="num mt-1 text-xs font-semibold">{number(Number(v))}</dd></div>)}</dl></div>;
        })}
      </div>
    </div>
  );
}
