import { useMemo } from "react";
import { usePrefs, useNow } from "../prefs";
import { deriveEvents } from "./events";
import { useSnapshots, useThresholds } from "./queries";
import { freshness } from "./status";

export function useFleet() {
  const { prefs } = usePrefs();
  const now = useNow();
  const snaps = useSnapshots();
  const th = useThresholds();
  const thresholds = th.data ?? {};

  const get = (id: string) => snaps.data?.find((s) => s.deviceId === id);
  const freshOf = (id: string) =>
    now == null ? "nodata" : freshness(get(id)?.lastSeen ?? null, now, prefs.staleMinutes, prefs.offlineMinutes);

  const events = useMemo(
    () => (snaps.data && now ? deriveEvents(snaps.data, thresholds, now, prefs) : []),
    [snaps.data, thresholds, now, prefs],
  );

  const lastUpdate = snaps.data ? Math.max(0, ...snaps.data.map((s) => s.lastSeen ?? 0)) || null : null;

  return {
    now,
    isLoading: snaps.isLoading || now == null,
    isError: snaps.isError,
    error: snaps.error,
    refetch: snaps.refetch,
    snapshots: snaps.data ?? [],
    thresholds,
    get,
    freshOf,
    events,
    lastUpdate,
    fetchedAt: snaps.dataUpdatedAt || null,
  };
}
