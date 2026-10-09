import { VARIABLES } from "./telemetry/catalog";
import type { VariableKey } from "./telemetry/types";
import type { Prefs } from "./prefs";

const isTemp = (v: VariableKey) => v === "temperature" || v === "water_temperature";

export function convert(v: VariableKey, value: number, prefs: Pick<Prefs, "tempUnit">) {
  return isTemp(v) && prefs.tempUnit === "F" ? value * 1.8 + 32 : value;
}

export function unitOf(v: VariableKey, prefs: Pick<Prefs, "tempUnit">) {
  return isTemp(v) ? (prefs.tempUnit === "F" ? "°F" : "°C") : VARIABLES[v].unit;
}

export function fmt(v: VariableKey, value: number | null | undefined, prefs: Pick<Prefs, "tempUnit">) {
  if (value == null || Number.isNaN(value)) return "—";
  return convert(v, value, prefs).toLocaleString("es-CO", {
    minimumFractionDigits: VARIABLES[v].decimals,
    maximumFractionDigits: VARIABLES[v].decimals,
  });
}

export const fmtTime = (ts: number) =>
  new Date(ts).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: false });

export const fmtDateTime = (ts: number) =>
  new Date(ts).toLocaleString("es-CO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false });

export function fmtAge(ts: number | null, now: number | null) {
  if (ts == null || now == null) return "—";
  const m = Math.max(0, Math.round((now - ts) / 60e3));
  if (m < 1) return "hace <1 min";
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 48) return `hace ${h} h ${m % 60} min`;
  return `hace ${Math.floor(h / 24)} d`;
}
