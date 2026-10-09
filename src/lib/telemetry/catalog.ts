import type { DeviceDef, RangeKey, VariableDef, VariableKey } from "./types";

/**
 * Unidades de referencia según hojas técnicas de sensores Honde Tech.
 * Deben confirmarse contra el payload real antes de la puesta en producción.
 */
export const VARIABLES: Record<VariableKey, VariableDef> = {
  soil_moisture: { key: "soil_moisture", label: "Humedad del suelo", short: "VWC", unit: "%", decimals: 1, color: "var(--v-moisture)" },
  temperature: { key: "temperature", label: "Temperatura del suelo", short: "T", unit: "°C", decimals: 1, color: "var(--v-temp)" },
  water_temperature: { key: "water_temperature", label: "Temperatura del agua", short: "T", unit: "°C", decimals: 1, color: "var(--v-temp)" },
  ec: { key: "ec", label: "Conductividad eléctrica", short: "EC", unit: "µS/cm", decimals: 0, color: "var(--v-ec)" },
  ph: { key: "ph", label: "pH", short: "pH", unit: "", decimals: 2, color: "var(--v-ph)" },
  tds: { key: "tds", label: "Sólidos disueltos totales", short: "TDS", unit: "mg/L", decimals: 0, color: "var(--v-tds)" },
  salinity: { key: "salinity", label: "Salinidad", short: "Sal", unit: "mg/L", decimals: 0, color: "var(--v-salinity)" },
  n: { key: "n", label: "Nitrógeno", short: "N", unit: "mg/kg", decimals: 0, color: "var(--v-n)", instrumentalNote: "Dato instrumental sujeto a validación" },
  p: { key: "p", label: "Fósforo", short: "P", unit: "mg/kg", decimals: 0, color: "var(--v-p)", instrumentalNote: "Dato instrumental sujeto a validación" },
  k: { key: "k", label: "Potasio", short: "K", unit: "mg/kg", decimals: 0, color: "var(--v-k)", instrumentalNote: "Dato instrumental sujeto a validación" },
};

const SOIL_VARS: VariableKey[] = ["soil_moisture", "temperature", "ec", "ph", "n", "p", "k", "salinity"];

export const DEVICES: DeviceDef[] = [
  { id: "soil-10", name: "Soil-10", kind: "soil", depthCm: 10, model: "Honde Tech · multiparamétrico de suelo", measurement: "Suelo", variables: SOIL_VARS },
  { id: "soil-30", name: "Soil-30", kind: "soil", depthCm: 30, model: "Honde Tech · multiparamétrico de suelo", measurement: "Suelo", variables: SOIL_VARS },
  { id: "water-01", name: "Water-01", kind: "water", model: "Honde Tech · multiparamétrico de agua", measurement: "Calidad de agua", variables: ["water_temperature", "ph", "ec", "tds", "salinity"] },
];

export const getDevice = (id: string) => DEVICES.find((d) => d.id === id)!;

export const RANGES: Record<RangeKey, { label: string; ms: number; stepMs: number }> = {
  "24h": { label: "24 h", ms: 24 * 3600e3, stepMs: 15 * 60e3 },
  "7d": { label: "7 días", ms: 7 * 24 * 3600e3, stepMs: 3600e3 },
  "30d": { label: "30 días", ms: 30 * 24 * 3600e3, stepMs: 4 * 3600e3 },
};
