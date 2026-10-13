import { createFileRoute } from "@tanstack/react-router";
import { DEVICES, getDevice } from "@/lib/telemetry/catalog";
import type { VariableKey } from "@/lib/telemetry/types";
import { useFleet } from "@/lib/telemetry/use-fleet";
import { DeviceCard } from "@/components/dash/DeviceCard";
import { MetricTile } from "@/components/dash/MetricTile";
import { DepthComparison } from "@/components/dash/DepthComparison";
import { TimeSeriesChart } from "@/components/dash/TimeSeriesChart";
import { EventsTable } from "@/components/dash/EventsTable";
import { PageHeader } from "@/components/dash/PageHeader";
import { Panel, SectionTitle } from "@/components/dash/status";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Resumen · IoTing Dev Agro" },
      { name: "description", content: "Estado general de sensores de suelo y agua: conectividad, indicadores y alertas." },
      { property: "og:title", content: "Resumen · IoTing Dev Agro" },
      { property: "og:description", content: "Monitoreo multiparamétrico de suelo y agua en tiempo real." },
    ],
  }),
  component: Resumen,
});

const KEY_SOIL: VariableKey[] = ["soil_moisture", "temperature", "ec", "ph"];
const KEY_WATER: VariableKey[] = ["water_temperature", "ph", "ec", "tds", "salinity"];

function Tiles({ deviceId, vars }: { deviceId: string; vars: VariableKey[] }) {
  const f = useFleet();
  const s = f.get(deviceId);
  return (
    <>
      {vars.map((v) => (
        <MetricTile key={v} deviceId={deviceId} variable={v} reading={s?.readings[v]} threshold={f.thresholds[`${deviceId}:${v}`]} f={f.freshOf(deviceId)} loading={f.isLoading} />
      ))}
    </>
  );
}

function Resumen() {
  const f = useFleet();
  return (
    <>
      <PageHeader title="Resumen de la instalación" description="Estado de dispositivos, indicadores clave y eventos recientes." />

      <SectionTitle>Dispositivos y conectividad</SectionTitle>
      <div className="grid gap-4 md:grid-cols-3">
        {DEVICES.map((d) => (
          <DeviceCard key={d.id} device={d} snap={f.get(d.id)} f={f.freshOf(d.id)} now={f.now} loading={f.isLoading} />
        ))}
      </div>

      <div className="grid gap-x-6 xl:grid-cols-2">
        {["soil-10", "soil-30"].map((id) => (
          <div key={id}>
            <SectionTitle hint={getDevice(id).name}>Suelo · {getDevice(id).depthCm} cm</SectionTitle>
            <div className="grid grid-cols-2 gap-3"><Tiles deviceId={id} vars={KEY_SOIL} /></div>
          </div>
        ))}
      </div>

      <SectionTitle hint="Water-01">Calidad de agua</SectionTitle>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5"><Tiles deviceId="water-01" vars={KEY_WATER} /></div>

      <SectionTitle>Comparación y tendencias</SectionTitle>
      <div className="grid gap-4 xl:grid-cols-2">
        <DepthComparison />
        <Panel title="Temperatura del suelo" subtitle="10 cm y 30 cm">
          <TimeSeriesChart series={[{ deviceId: "soil-10", variable: "temperature" }, { deviceId: "soil-30", variable: "temperature", dashed: true, color: "var(--brand-2)" }]} />
        </Panel>
      </div>

      <SectionTitle hint={`${f.events.length} eventos`}>Alertas y eventos</SectionTitle>
      <Panel><EventsTable events={f.events} limit={6} /></Panel>
    </>
  );
}
