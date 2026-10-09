import { AlertTriangle, CloudOff, FlaskConical, Inbox, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Condition, Freshness } from "@/lib/telemetry/status";

const FRESH: Record<Freshness, { label: string; dot: string; text: string }> = {
  live: { label: "En línea", dot: "bg-status-ok", text: "text-status-ok" },
  stale: { label: "Datos antiguos", dot: "bg-status-warn", text: "text-status-warn" },
  offline: { label: "Desconectado", dot: "bg-status-alarm", text: "text-status-alarm" },
  nodata: { label: "Sin datos", dot: "bg-status-unknown", text: "text-muted-foreground" },
};

export function FreshnessBadge({ f, className }: { f: Freshness; className?: string }) {
  const s = FRESH[f];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", s.text, className)}>
      <span className={cn("relative h-2 w-2 rounded-full", s.dot)}>
        {f === "live" && <span className={cn("absolute inset-0 animate-ping rounded-full opacity-60", s.dot)} />}
      </span>
      {s.label}
    </span>
  );
}

const COND: Record<Exclude<Condition, "none">, { label: string; cls: string }> = {
  ok: { label: "Normal", cls: "bg-status-ok/10 text-status-ok" },
  warn: { label: "Advertencia", cls: "bg-status-warn/12 text-status-warn" },
  alarm: { label: "Alarma", cls: "bg-status-alarm/10 text-status-alarm" },
};

export function ConditionBadge({ c }: { c: Condition }) {
  if (c === "none") return null;
  return <span className={cn("rounded px-1.5 py-0.5 text-[11px] font-semibold", COND[c].cls)}>{COND[c].label}</span>;
}

export function DemoBadge({ compact }: { compact?: boolean }) {
  return (
    <span
      title="Datos sintéticos y deterministas. No son mediciones reales."
      className="inline-flex items-center gap-1.5 rounded-full border border-status-warn/40 bg-status-warn/10 px-2.5 py-1 text-xs font-semibold text-status-warn"
    >
      <FlaskConical className="h-3.5 w-3.5" />
      {compact ? "Demo" : "Modo demostración"}
    </span>
  );
}

export function StateBox({ kind, title, children, className }: { kind: "empty" | "error" | "loading" | "offline"; title: string; children?: ReactNode; className?: string }) {
  const Icon = { empty: Inbox, error: AlertTriangle, loading: Loader2, offline: CloudOff }[kind];
  return (
    <div className={cn("flex h-full min-h-32 flex-col items-center justify-center gap-2 rounded-md border border-dashed bg-muted/40 p-6 text-center", className)}>
      <Icon className={cn("h-5 w-5", kind === "error" ? "text-status-alarm" : "text-muted-foreground", kind === "loading" && "animate-spin")} />
      <p className="text-sm font-medium">{title}</p>
      {children && <p className="max-w-sm text-xs text-muted-foreground">{children}</p>}
    </div>
  );
}

export function Panel({ title, subtitle, actions, children, className }: { title?: ReactNode; subtitle?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("panel min-w-0 p-4 sm:p-5", className)}>
      {(title || actions) && (
        <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-semibold tracking-tight">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}

export function SectionTitle({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="mb-3 mt-8 flex items-baseline justify-between gap-3 first:mt-0">
      <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{children}</h2>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}
