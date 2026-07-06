import { cn } from "@/core/lib/utils";
import { ChevronDown } from "lucide-react";
import { FieldError } from "./field-error";

export interface FloatingSelectOption {
  value: string;
  label: string;
}

export interface FloatingSelectProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  /** Either pass `options` (string list or {value,label}) or raw <option> children. */
  options?: readonly string[] | readonly FloatingSelectOption[];
  children?: React.ReactNode;
  error?: string;
  invalid?: boolean;
  icon?: React.ReactNode;
  disabled?: boolean;
  dense?: boolean;
  className?: string;
  containerClassName?: string;
}

/**
 * Generic native <select> with a floating label (always raised since a select
 * always has a value). Matches the PatientForm look.
 */
export function FloatingSelect({
  label, value, onChange, onBlur, options, children, error, invalid, icon, disabled, dense = true, className, containerClassName,
}: FloatingSelectProps) {
  const isError = !!error || !!invalid;
  return (
    <div className={containerClassName}>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 z-10">
            {icon}
          </span>
        )}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          className={cn(
            "w-full appearance-none rounded-lg border bg-white pr-7 text-sm text-gray-900 outline-none transition-colors cursor-pointer",
            dense ? "h-9" : "h-10",
            icon ? "pl-8" : "pl-3",
            "dark:bg-gray-900 dark:text-white",
            isError
              ? "border-red-400 focus:border-red-400"
              : "border-gray-200 focus:border-sky-400 dark:border-gray-700 dark:focus:border-sky-500",
            disabled && "opacity-60 cursor-not-allowed bg-gray-50 dark:bg-gray-800",
            className
          )}
        >
          {options
            ? options.map((o) =>
                typeof o === "string"
                  ? <option key={o} value={o}>{o}</option>
                  : <option key={o.value} value={o.value}>{o.label}</option>
              )
            : children}
        </select>
        <span className="pointer-events-none absolute left-3 top-0 -translate-y-1/2 z-10 select-none px-1 text-[0.65rem] font-medium bg-white dark:bg-gray-900 text-sky-500 dark:text-sky-400">
          {label}
        </span>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
      </div>
      <FieldError msg={error} />
    </div>
  );
}

export default FloatingSelect;
