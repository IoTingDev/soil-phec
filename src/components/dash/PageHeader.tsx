import type { ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { useFleet } from "@/lib/telemetry/use-fleet";
import { StateBox } from "./status";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  const fleet = useFleet();
  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </div>
      {fleet.isError && (
        <div className="mt-4">
          <StateBox kind="error" title="Error de comunicación con la plataforma" className="min-h-0 flex-row border-status-alarm/40 bg-status-alarm/5 py-3">
            <button onClick={() => fleet.refetch()} className="inline-flex items-center gap-1 font-medium text-foreground underline-offset-2 hover:underline">
              <RefreshCw className="h-3 w-3" /> Reintentar
            </button>
          </StateBox>
        </div>
      )}
    </div>
  );
}
