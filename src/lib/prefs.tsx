import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { RangeKey } from "./telemetry/types";

export interface Prefs {
  range: RangeKey;
  tempUnit: "C" | "F";
  staleMinutes: number;
  offlineMinutes: number;
  showDots: boolean;
  simulateError: boolean;
}

const DEFAULT: Prefs = { range: "24h", tempUnit: "C", staleMinutes: 30, offlineMinutes: 180, showDots: false, simulateError: false };
const KEY = "ioting-agro-prefs";

const Ctx = createContext<{ prefs: Prefs; set: (p: Partial<Prefs>) => void }>({ prefs: DEFAULT, set: () => {} });

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setPrefs({ ...DEFAULT, ...JSON.parse(raw), simulateError: false });
    } catch {}
  }, []);
  const set = (p: Partial<Prefs>) =>
    setPrefs((prev) => {
      const next = { ...prev, ...p };
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  return <Ctx.Provider value={{ prefs, set }}>{children}</Ctx.Provider>;
}

export const usePrefs = () => useContext(Ctx);

/** Ticker para recalcular antigüedad sin desajustes de hidratación. */
export function useNow(intervalMs = 30e3) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
