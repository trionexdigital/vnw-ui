import { cn } from "@/core/lib/utils";
import { ui } from "@/core/config/theme";
import { FieldError } from "./field-error";

export interface FieldProps {
  label: React.ReactNode;
  required?: boolean;
  error?: string;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * Top-label field wrapper (label above the control) — used on Settings screens.
 * Pair with shadcn Input / Select / Textarea as children.
 */
export function Field({ label, required, error, htmlFor, className, children }: FieldProps) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className={ui.topLabel}>
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      {children}
      <FieldError msg={error} />
    </div>
  );
}

export default Field;
