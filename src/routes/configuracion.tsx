import { createFileRoute } from "@tanstack/react-router";
import { usePrefs } from "@/lib/prefs";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RangeSelector } from "@/components/dash/RangeSelector";
import { PageHeader } from "@/components/dash/PageHeader";
import { Panel } from "@/components/dash/status";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export const Route = createFileRoute("/configuracion")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Configuración · IoTing Dev Agro" },
      { name: "description", content: "Preferencias de visualización, unidades y parámetros de interfaz." },
      { property: "og:title", content: "Configuración · IoTing Dev Agro" },
      { property: "og:description", content: "Ajustes de visualización del dashboard." },
    ],
  }),
  component: Config,
});

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b py-4 last:border-0">
      <div className="min-w-0"><Label className="text-sm">{label}</Label>{hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}</div>
      {children}
    </div>
  );
}

function Config() {
  const { prefs, set } = usePrefs();
  return (
    <>
      <PageHeader title="Configuración" description="Preferencias guardadas en este navegador. Los umbrales y reglas de alerta se configuran en la plataforma." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Visualización">
          <Row label="Rango temporal por defecto"><RangeSelector /></Row>
          <Row label="Unidad de temperatura">
            <div className="inline-flex rounded-md border bg-muted/50 p-0.5">
              {(["C", "F"] as const).map((u) => (
                <button key={u} onClick={() => set({ tempUnit: u })} className={cn("rounded px-3 py-1 text-xs font-medium", prefs.tempUnit === u ? "bg-card shadow-sm" : "text-muted-foreground")}>°{u}</button>
              ))}
            </div>
          </Row>
          <Row label="Mostrar puntos de muestreo" hint="Marca cada lectura en las gráficas"><Switch checked={prefs.showDots} onCheckedChange={(v) => set({ showDots: v })} /></Row>
        </Panel>
        <Panel title="Antigüedad de datos">
          <Row label="Datos antiguos después de (min)" hint="Respecto al último mensaje recibido">
            <Input type="number" min={1} className="num h-8 w-24" value={prefs.staleMinutes} onChange={(e) => set({ staleMinutes: Math.max(1, +e.target.value || 1) })} />
          </Row>
          <Row label="Desconectado después de (min)">
            <Input type="number" min={2} className="num h-8 w-24" value={prefs.offlineMinutes} onChange={(e) => set({ offlineMinutes: Math.max(prefs.staleMinutes + 1, +e.target.value || 0) })} />
          </Row>
          <Row label="Simular error de comunicación" hint="Solo para revisar el estado visual (modo demostración)"><Switch checked={prefs.simulateError} onCheckedChange={(v) => set({ simulateError: v })} /></Row>
        </Panel>
      </div>
    </>
  );
}
