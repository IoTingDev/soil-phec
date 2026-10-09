/**
 * Tipos normalizados que consume la capa de presentación.
 * La plataforma Dev Ingenion Cloud será la fuente real; los adaptadores
 * (adapter.ts) transforman su contrato a estos tipos.
 */

export type VariableKey =
  | "soil_moisture"
  | "temperature"
  | "ec"
  | "ph"
  | "n"
  | "p"
  | "k"
  | "salinity"
  | "water_temperature"
  | "tds";

export type DeviceKind = "soil" | "water";

export interface DeviceDef {
  id: string;
  name: string;
  kind: DeviceKind;
  depthCm?: number;
  model: string;
  measurement: string;
  variables: VariableKey[];
}

export interface VariableDef {
  key: VariableKey;
  label: string;
  short: string;
  unit: string;
  decimals: number;
  color: string; // CSS var reference
  instrumentalNote?: string;
}

export interface LatestReading {
  value: number | null; // null = variable no disponible en el payload
  ts: number | null;
}

export interface DeviceSnapshot {
  deviceId: string;
  /** Marca temporal del último mensaje recibido del dispositivo (ms). */
  lastSeen: number | null;
  readings: Partial<Record<VariableKey, LatestReading>>;
}

export interface SeriesPoint {
  ts: number;
  value: number | null;
}

export type RangeKey = "24h" | "7d" | "30d";

export interface Threshold {
  min?: number;
  max?: number;
  /** margen de advertencia antes de alarma, en la unidad de la variable */
  warnMargin?: number;
  source: "demo" | "platform";
}

export type EventType = "limite" | "conectividad" | "sin_datos" | "variable_no_disponible";
export type AttentionState = "pendiente" | "reconocido";

export interface TelemetryEvent {
  id: string;
  deviceId: string;
  variable?: VariableKey;
  ts: number;
  value?: number | null;
  type: EventType;
  severity: "warn" | "alarm" | "unknown";
  message: string;
}

export interface TelemetrySource {
  mode: "demo" | "live";
  getSnapshots(): Promise<DeviceSnapshot[]>;
  getSeries(deviceId: string, variable: VariableKey, range: RangeKey): Promise<SeriesPoint[]>;
  getThresholds(): Promise<Record<string, Threshold>>; // key `${deviceId}:${variable}`
}
