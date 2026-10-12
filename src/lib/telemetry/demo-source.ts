/**
 * MODO DEMOSTRACIÓN — datos sintéticos y deterministas.
 * No representan mediciones reales. Se sustituyen por adapter + endpoints autorizados.
 */
import { RANGES } from "./catalog";
import type { DeviceSnapshot, RangeKey, SeriesPoint, TelemetrySource, Threshold, VariableKey } from "./types";

type Profile = { base: number; amp: number; noise: number; phase?: number; drift?: number };

const PROFILES: Record<string, Partial<Record<VariableKey, Profile | null>>> = {
  "soil-10": {
    soil_moisture: { base: 27, amp: 3.5, noise: 0.6, phase: 0.4, drift: -2 },
    temperature: { base: 22, amp: 4, noise: 0.3 },
    ec: { base: 640, amp: 60, noise: 12 },
    ph: { base: 6.4, amp: 0.08, noise: 0.02 },
    n: { base: 42, amp: 3, noise: 1 },
    p: { base: 18, amp: 1.5, noise: 0.6 },
    k: { base: 120, amp: 6, noise: 2 },
    salinity: { base: 330, amp: 25, noise: 6 },
  },
  "soil-30": {
    soil_moisture: { base: 32.5, amp: 1.2, noise: 0.25, phase: 1.4 },
    temperature: { base: 20.2, amp: 1.4, noise: 0.15, phase: 1.2 },
    ec: { base: 720, amp: 25, noise: 8 },
    ph: { base: 6.6, amp: 0.04, noise: 0.015 },
    n: { base: 30, amp: 2, noise: 0.8 },
    p: { base: 12, amp: 1, noise: 0.4 },
    k: { base: 104, amp: 4, noise: 1.5 },
    salinity: null, // variable no entregada en esta demostración
  },
  "water-01": {
    water_temperature: { base: 19, amp: 2.2, noise: 0.2 },
    ph: { base: 7.25, amp: 0.15, noise: 0.03 },
    ec: { base: 480, amp: 30, noise: 6 },
    tds: { base: 240, amp: 15, noise: 3 },
    salinity: { base: 250, amp: 16, noise: 3 },
  },
};

/** El dispositivo de agua deja de reportar hace 95 min (estado «datos antiguos»). */
const LAST_SEEN_OFFSET_MIN: Record<string, number> = { "soil-10": 2, "soil-30": 4, "water-01": 95 };

const STEP = 15 * 60e3;
const DAY = 24 * 3600e3;

function hash(n: number, s: string) {
  let h = 2166136261 ^ Math.floor(n / STEP);
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295 - 0.5;
}

function valueAt(deviceId: string, v: VariableKey, ts: number): number | null {
  const p = PROFILES[deviceId]?.[v];
  if (!p) return null;
  const daily = Math.sin((2 * Math.PI * (ts % DAY)) / DAY - Math.PI / 2 + (p.phase ?? 0));
  const slow = Math.sin((2 * Math.PI * ts) / (9 * DAY));
  const drift = (p.drift ?? 0) * slow;
  return p.base + p.amp * daily + drift + p.noise * 2 * hash(ts, deviceId + v);
}

const anchor = () => Math.floor(Date.now() / STEP) * STEP;
const lastSeen = (id: string, now = Date.now()) => now - (LAST_SEEN_OFFSET_MIN[id] ?? 0) * 60e3;

const DEMO_THRESHOLDS: Record<string, Threshold> = {
  "soil-10:soil_moisture": { min: 25, max: 35, warnMargin: 3, source: "demo" },
  "soil-30:soil_moisture": { min: 25, max: 35, warnMargin: 3, source: "demo" },
  "water-01:ph": { min: 6.5, max: 8, warnMargin: 0.3, source: "demo" },
};

const delay = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 350));

export const demoSource: TelemetrySource = {
  mode: "demo",
  async getSnapshots() {
    const now = Date.now();
    return delay(
      Object.keys(PROFILES).map<DeviceSnapshot>((id) => {
        const seen = lastSeen(id, now);
        const readings: DeviceSnapshot["readings"] = {};
        for (const v of Object.keys(PROFILES[id] ?? {}) as VariableKey[]) {
          const val = valueAt(id, v, seen);
          readings[v] = { value: val, ts: val == null ? null : seen };
        }
        return { deviceId: id, lastSeen: seen, readings };
      }),
    );
  },
  async getSeries(deviceId, variable, range: RangeKey) {
    const { ms, stepMs } = RANGES[range];
    const end = anchor();
    const seen = lastSeen(deviceId);
    const pts: SeriesPoint[] = [];
    for (let ts = end - ms; ts <= end; ts += stepMs) {
      pts.push({ ts, value: ts > seen ? null : valueAt(deviceId, variable, ts) });
    }
    if (pts.every((p) => p.value == null)) return delay([]);
    return delay(pts);
  },
  async getThresholds() {
    return delay(DEMO_THRESHOLDS);
  },
};
