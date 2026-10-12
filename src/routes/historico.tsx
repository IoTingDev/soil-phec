import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DEVICES, VARIABLES, getDevice } from "@/lib/telemetry/catalog";
import type { RangeKey, VariableKey } from "@/lib/telemetry/types";
import { useSeries } from "@/lib/telemetry/queries";
import { usePrefs } from "@/lib/prefs";
import { fmt, fmtDateTime, unitOf } from "@/lib/format";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TimeSeriesChart } from "@/components/dash/TimeSeriesChart";
import { RangeSelector } from "@/components/dash/RangeSelector";
import { PageHeader } from "@/components/dash/PageHeader";
import { Panel, StateBox } from "@/components/dash/status";

export const Route = createFileRoute("/historico")({
  head: () => ({
    meta: [
      { title: "Histórico y tendencias · IoTing Dev Agro" },
      { name: "description", content: "Evolución temporal configurable de cada variable y dispositivo." },
      { property: "og:title", content: "Histórico y tendencias · IoTing Dev Agro" },
      { property: "og:description", content: "Series históricas de sensores de suelo y agua." },
    ],
  }),
  component: Historico,
});

function Historico() {
  const { prefs } = usePrefs();
  const [dev, setDev] = useState("soil-10");
  const [v, setV] = useState<VariableKey>("soil_moisture");
  const [range, setRange] = useState<RangeKey>(prefs.range);
  const d = getDevice(dev);
  const variable = d.variables.includes(v) ? v : d.variables[0]!;
  const q = useSeries(dev, variable, range);
  const rows = (q.data ?? []).filter((p) => p.value != null).slice(-50).reverse();

  return (
    <>
      <PageHeader title="Histórico y tendencias" description="Seleccione dispositivo, variable y rango temporal." />
      <Panel
        title={`${VARIABLES[variable].label} · ${d.name}${d.depthCm ? ` (${d.depthCm} cm)` : ""}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Select value={dev} onValueChange={setDev}>
              <SelectTrigger className="h-8 w-36 text-xs" aria-label="Dispositivo"><SelectValue /></SelectTrigger>
              <SelectContent>{DEVICES.map((x) => <SelectItem key={x.id} value={x.id} className="text-xs">{x.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={variable} onValueChange={(x) => setV(x as VariableKey)}>
              <SelectTrigger className="h-8 w-52 text-xs" aria-label="Variable"><SelectValue /></SelectTrigger>
              <SelectContent>{d.variables.map((x) => <SelectItem key={x} value={x} className="text-xs">{VARIABLES[x].label}</SelectItem>)}</SelectContent>
            </Select>
            <RangeSelector value={range} onChange={setRange} />
          </div>
        }
      >
        <TimeSeriesChart key={`${dev}-${variable}`} series={[{ deviceId: dev, variable }]} range={range} height={340} labelBy="variable" />
      </Panel>

      <Panel title="Registros" subtitle="Últimas 50 lecturas del rango" className="mt-4">
        {q.isLoading ? <StateBox kind="loading" title="Cargando datos" /> : !rows.length ? <StateBox kind="empty" title="Sin datos" /> : (
          <div className="max-h-96 overflow-auto">
            <Table>
              <TableHeader><TableRow className="text-xs"><TableHead>Fecha y hora</TableHead><TableHead>Dispositivo</TableHead><TableHead>Variable</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
              <TableBody>
                {rows.map((p) => (
                  <TableRow key={p.ts} className="text-sm">
                    <TableCell className="num text-muted-foreground">{fmtDateTime(p.ts)}</TableCell>
                    <TableCell className="num">{d.name}</TableCell>
                    <TableCell>{VARIABLES[variable].label}</TableCell>
                    <TableCell className="num text-right font-medium">{fmt(variable, p.value, prefs)} {unitOf(variable, prefs)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Panel>
    </>
  );
}
