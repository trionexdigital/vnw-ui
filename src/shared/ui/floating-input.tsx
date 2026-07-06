import { forwardRef } from "react";
import { cn } from "@/core/lib/utils";
import { FieldError } from "./field-error";

export interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  error?: string;
  /** red border only (no error text) — for fields too small to show a message */
  invalid?: boolean;
  /** muted helper text shown below when there is no error */
  helper?: string;
  containerClassName?: string;
  /** input height — h-10 (default) or h-9 for dense forms */
  dense?: boolean;
}

/**
 * Generic floating-label input (the PatientForm look).
 * Uses placeholder=" " + peer CSS so the label sits inside when empty and
 * floats onto the border when focused or filled.
 */
const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ label, icon, rightElement, error, invalid, helper, className, containerClassName, dense, id, disabled, ...props }, ref) => {
    const isError = !!error || !!invalid;
    return (
      <div className={containerClassName}>
        <div className="relative">
          {icon && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10">
              {icon}
            </span>
          )}

          <input
            ref={ref}
            id={id}
            disabled={disabled}
            placeholder=" "
            className={cn(
              "peer w-full rounded-lg border bg-white px-3 text-sm text-gray-900 outline-none transition-colors",
              dense ? "h-9" : "h-10",
              "dark:bg-gray-900 dark:text-white",
              isError
                ? "border-red-400 focus:border-red-400"
                : "border-gray-200 focus:border-sky-400 dark:border-gray-700 dark:focus:border-sky-500",
              disabled && "opacity-60 cursor-not-allowed bg-gray-50 dark:bg-gray-800",
              icon ? "pl-9" : "pl-3",
              rightElement ? "pr-9" : "pr-3",
              className
            )}
            {...props}
          />

          <label
            htmlFor={id}
            className={cn(
              "pointer-events-none absolute z-10 left-3 transition-all duration-150 select-none",
              // floating (default: has value)
              "top-0 -translate-y-1/2 text-[0.65rem] font-medium px-1 bg-white dark:bg-gray-900",
              isError ? "text-red-500" : "text-sky-500 dark:text-sky-400",
              // inside when empty + unfocused
              "peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2",
              "peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal",
              "peer-placeholder-shown:text-slate-400 dark:peer-placeholder-shown:text-gray-500",
              "peer-placeholder-shown:bg-transparent peer-placeholder-shown:px-0",
              icon && "peer-placeholder-shown:left-9",
              // float back on focus
              "peer-focus:top-0 peer-focus:-translate-y-1/2",
              "peer-focus:text-[0.65rem] peer-focus:font-medium peer-focus:px-1",
              "peer-focus:bg-white dark:peer-focus:bg-gray-900",
              isError ? "peer-focus:text-red-500" : "peer-focus:text-sky-500 dark:peer-focus:text-sky-400",
              icon && "peer-focus:left-3"
            )}
          >
            {label}
          </label>

          {rightElement && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>
          )}
        </div>
        <FieldError msg={error} />
        {!error && helper && <p className="mt-0.5 pl-0.5 text-[0.62rem] text-slate-400 leading-tight">{helper}</p>}
      </div>
    );
  }
);

FloatingInput.displayName = "FloatingInput";
export default FloatingInput;
