/**
 * Adaptador de integración con Dev Ingenion Cloud.
 *
 * El contrato definitivo debe proporcionarlo la plataforma. No se asumen URLs,
 * topics MQTT, campos ni autenticación. Este archivo define la forma esperada
 * de una lectura ya normalizada por la plataforma y su transformación.
 */
import type { DeviceSnapshot, VariableKey } from "./types";

/** Lectura normalizada esperada (pendiente de validar con el contrato real). */
export interface PlatformReadingDTO {
  deviceId: string;
  variable: string;
  value: number | null;
  /** ISO-8601 o epoch ms de recepción */
  timestamp: string | number;
}

/** Mapeo de nombres de variable de la plataforma → claves internas. Completar con el contrato. */
export const VARIABLE_MAP: Record<string, VariableKey> = {};

export function toSnapshots(rows: PlatformReadingDTO[]): DeviceSnapshot[] {
  const byDevice = new Map<string, DeviceSnapshot>();
  for (const r of rows) {
    const key = VARIABLE_MAP[r.variable];
    if (!key) continue; // variable desconocida: no se inventa equivalencia
    const ts = typeof r.timestamp === "number" ? r.timestamp : Date.parse(r.timestamp);
    const snap = byDevice.get(r.deviceId) ?? { deviceId: r.deviceId, lastSeen: null, readings: {} };
    const prev = snap.readings[key];
    if (!prev?.ts || ts > prev.ts) snap.readings[key] = { value: r.value, ts };
    snap.lastSeen = Math.max(snap.lastSeen ?? 0, ts);
    byDevice.set(r.deviceId, snap);
  }
  return [...byDevice.values()];
}
