import { createFileRoute } from "@tanstack/react-router";
import { DEVICES, VARIABLES } from "@/lib/telemetry/catalog";
import { useFleet } from "@/lib/telemetry/use-fleet";
import { fmtAge, fmtDateTime } from "@/lib/format";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/dash/PageHeader";
import { FreshnessBadge, Panel } from "@/components/dash/status";

export const Route = createFileRoute("/dispositivos")({
  head: () => ({
    meta: [
      { title: "Dispositivos · IoTing Dev Agro" },
      { name: "description", content: "Estado de los nodos ESP32 y sensores Honde Tech." },
      { property: "og:title", content: "Dispositivos · IoTing Dev Agro" },
      { property: "og:description", content: "Conectividad y variables disponibles por dispositivo." },
    ],
  }),
  component: Dispositivos,
});

function Dispositivos() {
  const f = useFleet();
  return (
    <>
      <PageHeader title="Dispositivos" description="Nodos ESP32 con sensores multiparamétricos Honde Tech." />
      <Panel>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow className="text-xs"><TableHead>Dispositivo</TableHead><TableHead>Sensor</TableHead><TableHead>Profundidad</TableHead><TableHead>Estado</TableHead><TableHead>Último mensaje</TableHead><TableHead>Variables con lectura</TableHead></TableRow></TableHeader>
            <TableBody>
              {DEVICES.map((d) => {
                const s = f.get(d.id);
                return (
                  <TableRow key={d.id} className="align-top text-sm">
                    <TableCell className="num font-semibold">{d.name}</TableCell>
                    <TableCell className="text-muted-foreground">{d.model}</TableCell>
                    <TableCell className="num">{d.depthCm ? `${d.depthCm} cm` : "—"}</TableCell>
                    <TableCell><FreshnessBadge f={f.freshOf(d.id)} /></TableCell>
                    <TableCell className="num whitespace-nowrap">{s?.lastSeen ? <>{fmtDateTime(s.lastSeen)}<br /><span className="text-xs text-muted-foreground">{fmtAge(s.lastSeen, f.now)}</span></> : "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {d.variables.map((v) => {
                          const ok = s?.readings[v]?.value != null;
                          return <span key={v} className={ok ? "rounded border px-1.5 py-0.5 text-[11px]" : "rounded border border-dashed px-1.5 py-0.5 text-[11px] text-muted-foreground line-through"} title={ok ? "Disponible" : "No disponible"}>{VARIABLES[v].short}</span>;
                        })}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Panel>
      <p className="mt-4 text-xs text-muted-foreground">
        Firmware, RSSI y diagnóstico del ESP32 se mostrarán cuando la plataforma los entregue en su contrato de datos. Un dispositivo se marca como desconectado solo por la antigüedad de su último mensaje, no por variables ausentes.
      </p>
    </>
  );
}
