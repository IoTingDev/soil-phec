import { useId } from "react";

/** Scale is an observed display range, never a sensor limit or an agronomic threshold. */
export function MetricGauge({ value, min, max, color, target }: {
  value: number; min: number; max: number; color: string;
  target?: { min?: number; max?: number };
}) {
  const id = useId();
  const ratio = (v: number) => Math.max(0, Math.min(1, (v - min) / (max - min || 1)));
  const progress = ratio(value);
  const angle = Math.PI * (1 - progress);
  const x = 100 + 76 * Math.cos(angle);
  const y = 91 - 76 * Math.sin(angle);
  const start = ratio(target?.min ?? min);
  const end = ratio(target?.max ?? max);
  return (
    <svg viewBox="0 0 200 105" className="mx-auto block h-[100px] w-full max-w-[210px]" role="img" aria-labelledby={id}>
      <title id={id}>Indicador: {value.toLocaleString("es-CO")}; escala observada {min.toLocaleString("es-CO")} a {max.toLocaleString("es-CO")}</title>
      <path d="M 24 91 A 76 76 0 0 1 176 91" pathLength="100" fill="none" stroke="var(--muted)" strokeWidth="13" strokeLinecap="round" />
      {target && end > start && <path d="M 24 91 A 76 76 0 0 1 176 91" pathLength="100" fill="none" stroke="var(--status-ok)" strokeWidth="21" strokeOpacity="0.18" strokeDasharray={`${(end - start) * 100} 100`} strokeDashoffset={-start * 100} />}
      <path d="M 24 91 A 76 76 0 0 1 176 91" pathLength="100" fill="none" stroke={color} strokeWidth="13" strokeLinecap="round" strokeDasharray={`${progress * 100} 100`} />
      <circle cx={x} cy={y} r="6" fill="var(--card)" stroke={color} strokeWidth="3" />
      <path d="M 100 83 L 100 76" stroke="var(--border)" strokeWidth="2" transform={`rotate(${progress * 180 - 90} 100 83)`} />
    </svg>
  );
}