import { cn } from "@/core/lib/utils";

export interface InfoFieldProps {
  label: string;
  value?: React.ReactNode;
  icon?: React.ReactNode;
  /** fallback shown when value is empty */
  placeholder?: React.ReactNode;
  className?: string;
}

/** Read-only label/value pair (e.g. the PTA header: AUDIOLOGIST / TEST DATE …). */
export function InfoField({ label, value, icon, placeholder = "----", className }: InfoFieldProps) {
  const empty = value == null || value === "";
  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex items-center gap-1 text-[0.62rem] font-semibold uppercase tracking-wide text-muted-foreground">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        {label}
      </div>
      <div className={cn("mt-0.5 truncate text-sm font-medium", empty ? "text-muted-foreground/60" : "text-foreground")}>
        {empty ? placeholder : value}
      </div>
    </div>
  );
}

export default InfoField;
