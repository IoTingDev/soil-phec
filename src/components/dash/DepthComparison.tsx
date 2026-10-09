import { useState } from "react";
import { VARIABLES } from "@/lib/telemetry/catalog";
import type { VariableKey } from "@/lib/telemetry/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Panel } from "./status";
import { TimeSeriesChart } from "./TimeSeriesChart";

const OPTIONS: VariableKey[] = ["soil_moisture", "temperature", "ec", "ph", "n", "p", "k", "salinity"];

export function DepthComparison({ initial = "soil_moisture" as VariableKey }) {
  const [v, setV] = useState<VariableKey>(initial);
  return (
    <Panel
      title="Comparación entre profundidades"
      subtitle="Misma variable a 10 cm (línea continua) y 30 cm (línea discontinua)"
      actions={
        <Select value={v} onValueChange={(x) => setV(x as VariableKey)}>
          <SelectTrigger className="h-8 w-52 text-xs" aria-label="Variable a comparar"><SelectValue /></SelectTrigger>
          <SelectContent>
            {OPTIONS.map((o) => (
              <SelectItem key={o} value={o} className="text-xs">
                <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: VARIABLES[o].color }} />
                {VARIABLES[o].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    >
      <TimeSeriesChart
        key={v}
        series={[
          { deviceId: "soil-10", variable: v },
          { deviceId: "soil-30", variable: v, dashed: true, color: "var(--brand-2)" },
        ]}
      />
    </Panel>
  );
}
