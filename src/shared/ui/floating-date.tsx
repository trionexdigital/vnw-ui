import { cn } from "@/core/lib/utils";
import { Calendar, Clock } from "lucide-react";
import { FieldError } from "./field-error";

export interface FloatingDateProps {
  label: string;
  /** ISO string: "YYYY-MM-DD" for date, "YYYY-MM" for month, "HH:mm" for time. */
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  type?: "date" | "month" | "time";
  error?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
  dense?: boolean;
  containerClassName?: string;
}

/**
 * Generic floating-label date/month input. The label always floats because the
 * browser renders its own placeholder chrome inside date inputs.
 */
export function FloatingDate({
  label, value, onChange, onBlur, type = "date", error, min, max, disabled, dense = true, containerClassName,
}: FloatingDateProps) {
  return (
    <div className={containerClassName}>
      <div className="relative">
        {type === "time"
          ? <Clock className="pointer-events-none absolute left-2.5 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          : <Calendar className="pointer-events-none absolute left-2.5 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />}
        <input
          type={type}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          min={min}
          max={max}
          disabled={disabled}
          className={cn(
            "w-full rounded-lg border bg-background pl-8 pr-2 text-sm text-foreground outline-none transition-colors",
            dense ? "h-9" : "h-10",
            error
              ? "border-destructive focus:border-destructive"
              : "border-input focus:border-primary focus:ring-2 focus:ring-ring/20",
            disabled && "cursor-not-allowed bg-muted opacity-60"
          )}
        />
        <label
          className={cn(
            "pointer-events-none absolute left-3 top-0 z-10 -translate-y-1/2 select-none bg-background px-1 text-[0.65rem] font-medium",
            error ? "text-destructive" : value ? "text-primary" : "text-muted-foreground"
          )}
        >
          {label}
        </label>
      </div>
      <FieldError msg={error} />
    </div>
  );
}

export default FloatingDate;
