import { createFileRoute } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import type { VariableKey } from "@/lib/telemetry/types";
import { useFleet } from "@/lib/telemetry/use-fleet";
import { fmtAge } from "@/lib/format";
import { MetricTile } from "@/components/dash/MetricTile";
import { TimeSeriesChart } from "@/components/dash/TimeSeriesChart";
import { PageHeader } from "@/components/dash/PageHeader";
import { Panel, SectionTitle } from "@/components/dash/status";

export const Route = createFileRoute("/agua")({
  head: () => ({
    meta: [
      { title: "Calidad de agua · IoTing Dev Agro" },
      { name: "description", content: "Temperatura, pH, EC, TDS y salinidad del sensor Water-01." },
      { property: "og:title", content: "Calidad de agua · IoTing Dev Agro" },
      { property: "og:description", content: "Sensor multiparamétrico de calidad de agua." },
    ],
  }),
  component: Agua,
});

const VARS: VariableKey[] = ["water_temperature", "ph", "ec", "tds", "salinity"];
const W = "water-01";

function Agua() {
  const f = useFleet();
  const fr = f.freshOf(W);
  const s = f.get(W);
  return (
    <>
      <PageHeader title="Calidad de agua" description="Sensor multiparamétrico Water-01." />
      {(fr === "stale" || fr === "offline") && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-status-warn/40 bg-status-warn/10 p-3 text-sm">
          <Clock className="h-4 w-4 shrink-0 text-status-warn" />
          Datos antiguos: el último mensaje se recibió <span className="num font-medium">{fmtAge(s?.lastSeen ?? null, f.now)}</span>. Los valores mostrados corresponden a esa lectura.
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {VARS.map((v) => (
          <MetricTile key={v} deviceId={W} variable={v} reading={s?.readings[v]} threshold={f.thresholds[`${W}:${v}`]} f={fr} loading={f.isLoading} />
        ))}
      </div>
      <SectionTitle>Series temporales</SectionTitle>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Temperatura del agua"><TimeSeriesChart series={[{ deviceId: W, variable: "water_temperature" }]} labelBy="variable" /></Panel>
        <Panel title="pH"><TimeSeriesChart series={[{ deviceId: W, variable: "ph" }]} labelBy="variable" threshold={f.thresholds[`${W}:ph`]} /></Panel>
        <Panel title="Conductividad eléctrica"><TimeSeriesChart series={[{ deviceId: W, variable: "ec" }]} labelBy="variable" /></Panel>
        <Panel title="TDS y salinidad" subtitle="Ambas en mg/L — eje compartido"><TimeSeriesChart series={[{ deviceId: W, variable: "tds" }, { deviceId: W, variable: "salinity" }]} labelBy="variable" /></Panel>
      </div>
    </>
  );
}
