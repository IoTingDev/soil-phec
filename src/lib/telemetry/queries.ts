import { queryOptions, useQuery } from "@tanstack/react-query";
import { demoSource } from "./demo-source";
import type { RangeKey, TelemetrySource, VariableKey } from "./types";
import { usePrefs } from "../prefs";

/** Punto único de selección de fuente. Sustituir por la fuente real cuando exista el contrato. */
export const source: TelemetrySource = demoSource;

const COMM_ERROR = new Error("Error de comunicación con la plataforma");

function guard<T>(simulateError: boolean, fn: () => Promise<T>) {
  return simulateError ? Promise.reject(COMM_ERROR) : fn();
}

export function useSnapshots() {
  const { prefs } = usePrefs();
  return useQuery(
    queryOptions({
      queryKey: ["snapshots", prefs.simulateError],
      queryFn: () => guard(prefs.simulateError, () => source.getSnapshots()),
      refetchInterval: 60e3,
      retry: false,
    }),
  );
}

export function useSeries(deviceId: string, variable: VariableKey, range: RangeKey) {
  const { prefs } = usePrefs();
  return useQuery({
    queryKey: ["series", deviceId, variable, range, prefs.simulateError],
    queryFn: () => guard(prefs.simulateError, () => source.getSeries(deviceId, variable, range)),
    refetchInterval: 5 * 60e3,
    retry: false,
  });
}

export function useThresholds() {
  return useQuery({ queryKey: ["thresholds"], queryFn: () => source.getThresholds(), staleTime: Infinity });
}
