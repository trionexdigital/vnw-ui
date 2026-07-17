import { cn } from "@/core/lib/utils";
import { FieldError } from "./field-error";

export interface FloatingTextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  invalid?: boolean;
  containerClassName?: string;
}

/** Generic floating-label textarea (PatientForm look). */
export function FloatingTextarea({
  label, value, onChange, onBlur, rows = 3, error, invalid, className, containerClassName, ...props
}: FloatingTextareaProps) {
  const isError = !!error || !!invalid;
  return (
    <div className={containerClassName}>
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          rows={rows}
          placeholder=" "
          className={cn(
            "peer w-full resize-none rounded-lg border bg-background px-3 pb-2 pt-4 text-sm text-foreground outline-none transition-colors",
            isError
              ? "border-destructive focus:border-destructive"
              : "border-input focus:border-primary focus:ring-2 focus:ring-ring/20",
            className
          )}
          {...props}
        />
        <label
          className={cn(
            "pointer-events-none absolute z-10 left-3 transition-all duration-150 select-none",
            "top-0 -translate-y-1/2 bg-background px-1 text-[0.65rem] font-medium",
            isError ? "text-destructive" : "text-primary",
            "peer-placeholder-shown:top-3 peer-placeholder-shown:translate-y-0",
            "peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:text-muted-foreground",
            "peer-placeholder-shown:bg-transparent peer-placeholder-shown:px-0",
            "peer-focus:top-0 peer-focus:-translate-y-1/2",
            "peer-focus:text-[0.65rem] peer-focus:font-medium peer-focus:px-1",
            "peer-focus:bg-background",
            isError ? "peer-focus:text-destructive" : "peer-focus:text-primary"
          )}
        >
          {label}
        </label>
      </div>
      <FieldError msg={error} />
    </div>
  );
}

export default FloatingTextarea;
