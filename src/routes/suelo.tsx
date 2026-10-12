import { createFileRoute } from "@tanstack/react-router";
import { Info } from "lucide-react";
import { getDevice } from "@/lib/telemetry/catalog";
import type { VariableKey } from "@/lib/telemetry/types";
import { useFleet } from "@/lib/telemetry/use-fleet";
import { MetricTile } from "@/components/dash/MetricTile";
import { DepthComparison } from "@/components/dash/DepthComparison";
import { TimeSeriesChart } from "@/components/dash/TimeSeriesChart";
import { PageHeader } from "@/components/dash/PageHeader";
import { FreshnessBadge, Panel, SectionTitle } from "@/components/dash/status";

export const Route = createFileRoute("/suelo")({
  head: () => ({
    meta: [
      { title: "Monitoreo de suelo · IoTing Dev Agro" },
      { name: "description", content: "Humedad, temperatura, EC, pH, NPK y salinidad a 10 cm y 30 cm." },
      { property: "og:title", content: "Monitoreo de suelo · IoTing Dev Agro" },
      { property: "og:description", content: "Sensores multiparamétricos de suelo a dos profundidades." },
    ],
  }),
  component: Suelo,
});

const MAIN: VariableKey[] = ["soil_moisture", "temperature", "ec", "ph", "salinity"];
const NPK: VariableKey[] = ["n", "p", "k"];

function Device({ id }: { id: string }) {
  const f = useFleet();
  const d = getDevice(id);
  const s = f.get(id);
  const tile = (v: VariableKey) => (
    <MetricTile key={v} deviceId={id} variable={v} reading={s?.readings[v]} threshold={f.thresholds[`${id}:${v}`]} f={f.freshOf(id)} loading={f.isLoading} />
  );
  return (
    <div>
      <SectionTitle hint={<FreshnessBadge f={f.freshOf(id)} />}>{d.name} · {d.depthCm} cm</SectionTitle>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">{MAIN.map(tile)}</div>
      <div className="mt-3 grid grid-cols-3 gap-3">{NPK.map(tile)}</div>
    </div>
  );
}

const pair = (v: VariableKey) => [
  { deviceId: "soil-10", variable: v },
  { deviceId: "soil-30", variable: v, dashed: true, color: "var(--brand-2)" },
];

function Suelo() {
  return (
    <>
      <PageHeader title="Monitoreo de suelo" description="Dos sensores Honde Tech independientes a 10 cm y 30 cm de profundidad." />
      <div className="mb-2 flex items-start gap-2 rounded-md border bg-card p-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-tech" />
        NPK se presenta como dato instrumental sujeto a validación de laboratorio. No representa disponibilidad agronómica ni constituye una recomendación de fertilización.
      </div>
      <div className="grid gap-x-6 xl:grid-cols-2">
        <Device id="soil-10" />
        <Device id="soil-30" />
      </div>

      <SectionTitle>Series temporales</SectionTitle>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Humedad del suelo" subtitle="Contenido volumétrico de agua"><TimeSeriesChart series={pair("soil_moisture")} threshold={{ min: 25, max: 35, source: "demo" }} /></Panel>
        <Panel title="Temperatura del suelo"><TimeSeriesChart series={pair("temperature")} /></Panel>
        <Panel title="pH"><TimeSeriesChart series={pair("ph")} /></Panel>
        <Panel title="Conductividad eléctrica"><TimeSeriesChart series={pair("ec")} /></Panel>
      </div>
      <div className="mt-4"><DepthComparison initial="ec" /></div>
    </>
  );
}
