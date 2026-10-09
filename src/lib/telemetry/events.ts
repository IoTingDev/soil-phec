import { DEVICES, VARIABLES } from "./catalog";
import { evaluate, freshness } from "./status";
import type { DeviceSnapshot, TelemetryEvent, Threshold } from "./types";

/**
 * Derivación de eventos en el cliente a partir de la última lectura.
 * No es un motor de alertas: las reglas reales las define la plataforma.
 */
export function deriveEvents(
  snapshots: DeviceSnapshot[],
  thresholds: Record<string, Threshold>,
  now: number,
  cfg: { staleMinutes: number; offlineMinutes: number },
): TelemetryEvent[] {
  const out: TelemetryEvent[] = [];
  for (const dev of DEVICES) {
    const s = snapshots.find((x) => x.deviceId === dev.id);
    const f = freshness(s?.lastSeen ?? null, now, cfg.staleMinutes, cfg.offlineMinutes);
    if (f === "nodata") out.push({ id: `${dev.id}-nodata`, deviceId: dev.id, ts: now, type: "sin_datos", severity: "unknown", message: "Sin datos recibidos" });
    if (f === "offline") out.push({ id: `${dev.id}-off`, deviceId: dev.id, ts: s!.lastSeen!, type: "conectividad", severity: "alarm", message: "Pérdida de conectividad" });
    if (f === "stale") out.push({ id: `${dev.id}-stale`, deviceId: dev.id, ts: s!.lastSeen!, type: "conectividad", severity: "warn", message: `Sin mensajes en más de ${cfg.staleMinutes} min` });
    if (!s) continue;
    for (const v of dev.variables) {
      const r = s.readings[v];
      if (!r || r.value == null) {
        out.push({ id: `${dev.id}-${v}-na`, deviceId: dev.id, variable: v, ts: s.lastSeen ?? now, value: null, type: "variable_no_disponible", severity: "unknown", message: `${VARIABLES[v].label} no presente en el payload` });
        continue;
      }
      const t = thresholds[`${dev.id}:${v}`];
      const c = evaluate(r.value, t);
      if (c === "warn" || c === "alarm")
        out.push({ id: `${dev.id}-${v}-lim`, deviceId: dev.id, variable: v, ts: r.ts ?? now, value: r.value, type: "limite", severity: c, message: "Fuera del rango objetivo configurado" });
    }
  }
  return out.sort((a, b) => b.ts - a.ts);
}
