import { CartesianGrid, Legend, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { VARIABLES, getDevice } from "@/lib/telemetry/catalog";
import { useSeries } from "@/lib/telemetry/queries";
import type { RangeKey, Threshold, VariableKey } from "@/lib/telemetry/types";
import { usePrefs } from "@/lib/prefs";
import { convert, fmtDateTime, unitOf } from "@/lib/format";
import { StateBox } from "./status";

export interface SeriesSpec {
  deviceId: string;
  variable: VariableKey;
  /** color alternativo (p.ej. segunda profundidad) */
  color?: string;
  dashed?: boolean;
}

const keyOf = (s: SeriesSpec) => `${s.deviceId}__${s.variable}`;

function seriesLabel(s: SeriesSpec) {
  const d = getDevice(s.deviceId);
  return `${d.name}${d.depthCm ? ` (${d.depthCm} cm)` : ""}`;
}

/**
 * Gráfico de series temporales. Todas las series comparten una misma unidad física;
 * magnitudes distintas se representan en gráficos separados.
 */
export function TimeSeriesChart({ series, range, height = 260, threshold, labelBy = "device" }: {
  series: SeriesSpec[]; range?: RangeKey; height?: number; threshold?: Threshold | undefined; labelBy?: "device" | "variable";
}) {
  const { prefs } = usePrefs();
  const r = range ?? prefs.range;
  const s0 = series[0]!;
  const s1 = series[1];
  // Número fijo de series por gráfico (máx. 2) → hooks estables.
  const a = useSeries(s0.deviceId, s0.variable, r);
  const b = useSeries(s1?.deviceId ?? s0.deviceId, s1?.variable ?? s0.variable, r);
  const results = series.length > 1 ? [a, b] : [a];

  const v0 = s0.variable;
  const unit = unitOf(v0, prefs);
  const loading = results.some((q) => q.isLoading);
  const error = results.find((q) => q.isError);

  if (loading) return <div style={{ height }} className="animate-pulse rounded-md bg-muted/60" />;
  if (error) return <div style={{ height }}><StateBox kind="error" title="Error de comunicación">No fue posible obtener la serie temporal.</StateBox></div>;

  const map = new Map<number, Record<string, number | null>>();
  results.forEach((q, i) => {
    const spec = series[i]!;
    const k = keyOf(spec);
    for (const p of q.data ?? []) {
      const row: Record<string, number | null> = map.get(p.ts) ?? { ts: p.ts };
      row[k] = p.value == null ? null : convert(spec.variable, p.value, prefs);
      map.set(p.ts, row);
    }
  });
  const data = [...map.values()].sort((x, y) => (x["ts"] as number) - (y["ts"] as number));
  if (!data.length || results.every((q) => !q.data?.length))
    return <div style={{ height }}><StateBox kind="empty" title="Sin datos en el rango seleccionado">El dispositivo no ha reportado lecturas para este periodo.</StateBox></div>;

  const tickFmt = (ts: number) => {
    const d = new Date(ts);
    return r === "24h"
      ? d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: false })
      : d.toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
  };

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          {threshold && (threshold.min != null || threshold.max != null) && (
            <ReferenceArea {...(threshold.min != null ? { y1: threshold.min } : {})} {...(threshold.max != null ? { y2: threshold.max } : {})} fill="var(--status-ok)" fillOpacity={0.06} stroke="var(--status-ok)" strokeOpacity={0.25} strokeDasharray="4 4" ifOverflow="extendDomain" />
          )}
          <XAxis dataKey="ts" type="number" scale="time" domain={["dataMin", "dataMax"]} tickFormatter={tickFmt} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} stroke="var(--border)" minTickGap={40} />
          <YAxis
            width={56}
            domain={["auto", "auto"]}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            stroke="var(--border)"
            tickFormatter={(v: number) => v.toLocaleString("es-CO", { maximumFractionDigits: VARIABLES[v0].decimals })}
            {...(unit ? { label: { value: unit, angle: -90, position: "insideLeft", offset: 12, style: { fontSize: 11, fill: "var(--muted-foreground)" } } } : {})}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="panel min-w-48 p-3 text-xs">
                  <p className="num mb-2 font-medium">{fmtDateTime(label as number)}</p>
                  {payload.map((p) => {
                    const s = series.find((x) => keyOf(x) === p.dataKey)!;
                    const def = VARIABLES[s.variable];
                    return (
                      <div key={String(p.dataKey)} className="flex items-center justify-between gap-4 py-0.5">
                        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: p.color }} />{seriesLabel(s)} · {def.short}</span>
                        <span className="num font-semibold">{p.value == null ? "—" : Number(p.value).toFixed(def.decimals)} {unitOf(s.variable, prefs)}</span>
                      </div>
                    );
                  })}
                </div>
              );
            }}
          />
          <Legend iconType="plainline" wrapperStyle={{ fontSize: 12 }} />
          {series.map((s) => (
            <Line
              key={keyOf(s)}
              dataKey={keyOf(s)}
              name={labelBy === "device" ? seriesLabel(s) : VARIABLES[s.variable].label}
              stroke={s.color ?? VARIABLES[s.variable].color}
              strokeWidth={2}
              strokeDasharray={s.dashed ? "5 4" : undefined}
              dot={prefs.showDots ? { r: 1.5 } : false}
              connectNulls={false}
              isAnimationActive={false}
              type="monotone"
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
