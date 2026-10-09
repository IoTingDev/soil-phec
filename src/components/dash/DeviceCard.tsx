import { Droplets, Layers } from "lucide-react";
import type { DeviceDef } from "@/lib/telemetry/types";
import type { Freshness } from "@/lib/telemetry/status";
import type { DeviceSnapshot } from "@/lib/telemetry/types";
import { fmtAge, fmtTime } from "@/lib/format";
import { FreshnessBadge } from "./status";
import { cn } from "@/lib/utils";

export function DeviceCard({ device, snap, f, now, loading }: { device: DeviceDef; snap?: DeviceSnapshot; f: Freshness; now: number | null; loading?: boolean }) {
  const available = device.variables.filter((v) => snap?.readings[v]?.value != null).length;
  const Icon = device.kind === "water" ? Droplets : Layers;
  return (
    <article className={cn("panel relative overflow-hidden p-4", f === "stale" && "border-status-warn/40", f === "offline" && "border-status-alarm/40")}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-tech-soft text-tech">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="num truncate text-sm font-semibold">{device.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {device.measurement}
              {device.depthCm != null && <> · <span className="num">{device.depthCm} cm</span></>}
            </p>
          </div>
        </div>
        {loading ? <span className="h-4 w-16 animate-pulse rounded bg-muted" /> : <FreshnessBadge f={f} />}
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-2 border-t pt-3 text-xs">
        <div>
          <dt className="text-muted-foreground">Última lectura</dt>
          <dd className="num mt-0.5 font-medium">{snap?.lastSeen ? fmtTime(snap.lastSeen) : "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Antigüedad</dt>
          <dd className="num mt-0.5 font-medium">{fmtAge(snap?.lastSeen ?? null, now)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Variables</dt>
          <dd className="num mt-0.5 font-medium">{loading ? "—" : `${available}/${device.variables.length}`}</dd>
        </div>
      </dl>
    </article>
  );
}
