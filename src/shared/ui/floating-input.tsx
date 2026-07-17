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
            <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-muted-foreground">
              {icon}
            </span>
          )}

          <input
            ref={ref}
            id={id}
            disabled={disabled}
            placeholder=" "
            className={cn(
              "peer w-full rounded-lg border bg-background px-3 text-sm text-foreground outline-none transition-colors",
              dense ? "h-9" : "h-10",
              isError
                ? "border-destructive focus:border-destructive"
                : "border-input focus:border-primary focus:ring-2 focus:ring-ring/20",
              disabled && "cursor-not-allowed bg-muted opacity-60",
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
              "top-0 -translate-y-1/2 bg-background px-1 text-[0.65rem] font-medium",
              isError ? "text-destructive" : "text-primary",
              // inside when empty + unfocused
              "peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2",
              "peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal",
              "peer-placeholder-shown:text-muted-foreground",
              "peer-placeholder-shown:bg-transparent peer-placeholder-shown:px-0",
              icon && "peer-placeholder-shown:left-9",
              // float back on focus
              "peer-focus:top-0 peer-focus:-translate-y-1/2",
              "peer-focus:text-[0.65rem] peer-focus:font-medium peer-focus:px-1",
              "peer-focus:bg-background",
              isError ? "peer-focus:text-destructive" : "peer-focus:text-primary",
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
        {!error && helper && <p className="mt-0.5 pl-0.5 text-[0.62rem] leading-tight text-muted-foreground">{helper}</p>}
      </div>
    );
  }
);

FloatingInput.displayName = "FloatingInput";
export default FloatingInput;
