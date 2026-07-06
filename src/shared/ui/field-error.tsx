import { cn } from "@/core/lib/utils";
import { ui } from "@/core/config/theme";

/** Inline validation error shown under a form field. */
export function FieldError({ msg, className }: { msg?: string; className?: string }) {
  if (!msg) return null;
  return <p className={cn(ui.fieldError, className)}>{msg}</p>;
}

export default FieldError;
