import { Link, useRouterState } from "@tanstack/react-router";
import { Activity, Cpu, Droplets, History, LayoutDashboard, Menu, Settings, Sprout, Wifi, WifiOff } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useFleet } from "@/lib/telemetry/use-fleet";
import { DEVICES } from "@/lib/telemetry/catalog";
import { source } from "@/lib/telemetry/queries";
import { fmtAge } from "@/lib/format";
import { DemoBadge } from "./status";
import { RangeSelector } from "./RangeSelector";

const NAV = [
  { to: "/", label: "Resumen", icon: LayoutDashboard },
  { to: "/suelo", label: "Monitoreo de suelo", icon: Sprout },
  { to: "/agua", label: "Calidad de agua", icon: Droplets },
  { to: "/historico", label: "Histórico y tendencias", icon: History },
  { to: "/dispositivos", label: "Dispositivos", icon: Cpu },
  { to: "/configuracion", label: "Configuración", icon: Settings },
] as const;

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-5 py-5">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
        <Activity className="h-5 w-5" strokeWidth={2.5} />
      </div>
      <div className="min-w-0 leading-tight">
        <p className="text-sm font-semibold text-sidebar-accent-foreground">IoTing Dev <span className="text-sidebar-primary">Agro</span></p>
        <p className="text-[11px] text-sidebar-foreground/60">Dev Ingenion SAS</p>
      </div>
    </div>
  );
}

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex flex-col gap-0.5 px-3" aria-label="Principal">
      {NAV.map(({ to, label, icon: Icon }) => {
        const active = to === "/" ? path === "/" : path.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              active ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground" : "text-sidebar-foreground/75 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon className={cn("h-4 w-4 shrink-0", active && "text-sidebar-primary")} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <Brand />
      <Nav onNavigate={onNavigate} />
      <div className="mt-auto border-t border-sidebar-border p-4 text-[11px] leading-relaxed text-sidebar-foreground/60">
        Fuente: {source.mode === "demo" ? "datos sintéticos (demostración)" : "Dev Ingenion Cloud"}
        <br />Sensores Honde Tech · ESP32
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const fleet = useFleet();
  const online = DEVICES.filter((d) => fleet.freshOf(d.id) === "live").length;
  const allOk = !fleet.isError && online === DEVICES.length;

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        <SidebarBody />
      </aside>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 border-0 p-0">
          <SheetTitle className="sr-only">Navegación</SheetTitle>
          <SidebarBody onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <header className="sticky top-0 z-20 border-b bg-card/90 backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
          <button className="rounded-md p-2 hover:bg-muted lg:hidden" onClick={() => setOpen(true)} aria-label="Abrir menú">
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">Finca La Esperanza · Lote 3</p>
            <p className="truncate text-xs text-muted-foreground">
              Última actualización:{" "}
              <span className="num">{fleet.isLoading ? "cargando…" : fmtAge(fleet.lastUpdate, fleet.now)}</span>
            </p>
          </div>
          <div className="hidden items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs md:flex">
            {fleet.isError ? <WifiOff className="h-3.5 w-3.5 text-status-alarm" /> : <Wifi className={cn("h-3.5 w-3.5", allOk ? "text-status-ok" : "text-status-warn")} />}
            <span className="font-medium">{fleet.isError ? "Error de comunicación" : `${online}/${DEVICES.length} en línea`}</span>
          </div>
          <div className="hidden sm:block"><RangeSelector /></div>
          {source.mode === "demo" && <DemoBadge compact />}
          <div className="hidden items-center gap-2 border-l pl-3 sm:flex">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-brand text-xs font-semibold text-primary-foreground">IC</div>
            <div className="hidden leading-tight xl:block">
              <p className="text-xs font-medium">Ing. de campo</p>
              <p className="text-[11px] text-muted-foreground">Operación</p>
            </div>
          </div>
        </div>
        <div className="border-t px-4 py-2 sm:hidden"><RangeSelector /></div>
      </header>

      <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:py-8">{children}</main>
    </div>
  );
}
