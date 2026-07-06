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
            "peer w-full rounded-lg border bg-white px-3 pt-4 pb-2 text-sm text-gray-900 outline-none transition-colors resize-none",
            "dark:bg-gray-900 dark:text-white",
            isError
              ? "border-red-400 focus:border-red-400"
              : "border-gray-200 focus:border-sky-400 dark:border-gray-700 dark:focus:border-sky-500",
            className
          )}
          {...props}
        />
        <label
          className={cn(
            "pointer-events-none absolute z-10 left-3 transition-all duration-150 select-none",
            "top-0 -translate-y-1/2 text-[0.65rem] font-medium px-1 bg-white dark:bg-gray-900",
            isError ? "text-red-500" : "text-sky-500 dark:text-sky-400",
            "peer-placeholder-shown:top-3 peer-placeholder-shown:translate-y-0",
            "peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:text-slate-400 dark:peer-placeholder-shown:text-gray-500",
            "peer-placeholder-shown:bg-transparent peer-placeholder-shown:px-0",
            "peer-focus:top-0 peer-focus:-translate-y-1/2",
            "peer-focus:text-[0.65rem] peer-focus:font-medium peer-focus:px-1",
            "peer-focus:bg-white dark:peer-focus:bg-gray-900",
            isError ? "peer-focus:text-red-500" : "peer-focus:text-sky-500 dark:peer-focus:text-sky-400"
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
