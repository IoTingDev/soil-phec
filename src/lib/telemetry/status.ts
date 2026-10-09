import type { Threshold } from "./types";

export type Freshness = "live" | "stale" | "offline" | "nodata";

/** Antigüedad calculada respecto a la marca temporal del último mensaje recibido. */
export function freshness(
  lastSeen: number | null,
  now: number,
  staleMinutes: number,
  offlineMinutes: number,
): Freshness {
  if (lastSeen == null) return "nodata";
  const ageMin = (now - lastSeen) / 60e3;
  if (ageMin >= offlineMinutes) return "offline";
  if (ageMin >= staleMinutes) return "stale";
  return "live";
}

export type Condition = "ok" | "warn" | "alarm" | "none";

/** Sin umbral configurado no se clasifica la lectura ("none"). */
export function evaluate(value: number | null | undefined, t?: Threshold): Condition {
  if (value == null || !t || (t.min == null && t.max == null)) return "none";
  const m = t.warnMargin ?? 0;
  if ((t.min != null && value < t.min - m) || (t.max != null && value > t.max + m)) return "alarm";
  if ((t.min != null && value < t.min) || (t.max != null && value > t.max)) return "warn";
  return "ok";
}

/** Distancia (con signo) al rango objetivo; 0 si está dentro. */
export function distanceToRange(value: number, t: Threshold): number {
  if (t.min != null && value < t.min) return value - t.min;
  if (t.max != null && value > t.max) return value - t.max;
  return 0;
}
