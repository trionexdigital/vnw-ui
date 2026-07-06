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
      <div className="flex items-center gap-1 text-[0.62rem] font-semibold tracking-wide text-slate-400 uppercase">
        {icon && <span className="text-slate-400">{icon}</span>}
        {label}
      </div>
      <div className={cn("mt-0.5 text-sm font-medium truncate", empty ? "text-slate-300 dark:text-slate-600" : "text-slate-700 dark:text-slate-200")}>
        {empty ? placeholder : value}
      </div>
    </div>
  );
}

export default InfoField;
