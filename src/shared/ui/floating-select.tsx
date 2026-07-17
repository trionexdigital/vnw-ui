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
          <span className="pointer-events-none absolute left-2.5 top-1/2 z-10 -translate-y-1/2 text-muted-foreground">
            {icon}
          </span>
        )}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          className={cn(
            "w-full cursor-pointer appearance-none rounded-lg border bg-background pr-7 text-sm text-foreground outline-none transition-colors",
            dense ? "h-9" : "h-10",
            icon ? "pl-8" : "pl-3",
            isError
              ? "border-destructive focus:border-destructive"
              : "border-input focus:border-primary focus:ring-2 focus:ring-ring/20",
            disabled && "cursor-not-allowed bg-muted opacity-60",
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
        <span className="pointer-events-none absolute left-3 top-0 z-10 -translate-y-1/2 select-none bg-background px-1 text-[0.65rem] font-medium text-primary">
          {label}
        </span>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
      </div>
      <FieldError msg={error} />
    </div>
  );
}

export default FloatingSelect;
