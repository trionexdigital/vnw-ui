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
          ? <Clock className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 z-10" />
          : <Calendar className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 z-10" />}
        <input
          type={type}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          min={min}
          max={max}
          disabled={disabled}
          className={cn(
            "w-full rounded-lg border bg-white pl-8 pr-2 text-sm text-gray-900 outline-none transition-colors dark:bg-gray-900 dark:text-white",
            dense ? "h-9" : "h-10",
            error
              ? "border-red-400 focus:border-red-400"
              : "border-gray-200 focus:border-sky-400 dark:border-gray-700 dark:focus:border-sky-500",
            disabled && "opacity-60 cursor-not-allowed bg-gray-50 dark:bg-gray-800"
          )}
        />
        <label
          className={cn(
            "pointer-events-none absolute z-10 left-3 top-0 -translate-y-1/2 select-none text-[0.65rem] font-medium px-1 bg-white dark:bg-gray-900",
            error ? "text-red-500" : value ? "text-sky-500 dark:text-sky-400" : "text-slate-400 dark:text-gray-500"
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
