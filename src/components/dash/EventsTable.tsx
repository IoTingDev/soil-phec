import { useState } from "react";
import { Check } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { VARIABLES, getDevice } from "@/lib/telemetry/catalog";
import type { AttentionState, EventType, TelemetryEvent } from "@/lib/telemetry/types";
import { usePrefs } from "@/lib/prefs";
import { fmt, fmtDateTime, unitOf } from "@/lib/format";
import { cn } from "@/lib/utils";
import { StateBox } from "./status";

const TYPE: Record<EventType, string> = {
  limite: "Límite",
  conectividad: "Conectividad",
  sin_datos: "Sin datos",
  variable_no_disponible: "Variable no disponible",
};
const SEV = { warn: "bg-status-warn", alarm: "bg-status-alarm", unknown: "bg-status-unknown" } as const;

export function EventsTable({ events, limit }: { events: TelemetryEvent[]; limit?: number }) {
  const { prefs } = usePrefs();
  // Estado de atención local de la sesión; la persistencia corresponde a la plataforma.
  const [ack, setAck] = useState<Record<string, AttentionState>>({});
  const rows = limit ? events.slice(0, limit) : events;
  if (!rows.length) return <StateBox kind="empty" title="Sin eventos">No se han detectado eventos con los umbrales configurados.</StateBox>;

  return (
    <div className="-mx-4 overflow-x-auto sm:mx-0">
      <Table>
        <TableHeader>
          <TableRow className="text-xs">
            <TableHead>Dispositivo</TableHead>
            <TableHead>Variable</TableHead>
            <TableHead>Fecha y hora</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Atención</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((e) => {
            const st = ack[e.id] ?? "pendiente";
            return (
              <TableRow key={e.id} className="text-sm">
                <TableCell className="num whitespace-nowrap font-medium">{getDevice(e.deviceId).name}</TableCell>
                <TableCell className="whitespace-nowrap">{e.variable ? VARIABLES[e.variable].label : "—"}</TableCell>
                <TableCell className="num whitespace-nowrap text-muted-foreground">{fmtDateTime(e.ts)}</TableCell>
                <TableCell className="num whitespace-nowrap text-right">
                  {e.variable && e.value != null ? `${fmt(e.variable, e.value, prefs)} ${unitOf(e.variable, prefs)}` : "—"}
                </TableCell>
                <TableCell>
                  <span className="flex items-center gap-2 whitespace-nowrap">
                    <span className={cn("h-2 w-2 shrink-0 rounded-full", SEV[e.severity])} />
                    <span>{TYPE[e.type]}</span>
                    <span className="hidden text-xs text-muted-foreground xl:inline">· {e.message}</span>
                  </span>
                </TableCell>
                <TableCell>
                  {st === "reconocido" ? (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Check className="h-3.5 w-3.5" />Reconocido</span>
                  ) : (
                    <button onClick={() => setAck((a) => ({ ...a, [e.id]: "reconocido" }))} className="rounded border px-2 py-0.5 text-xs font-medium text-tech hover:bg-accent">
                      Reconocer
                    </button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
