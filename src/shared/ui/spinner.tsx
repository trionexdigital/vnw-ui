import { Loader2 } from "lucide-react";
import { cn } from "@/core/lib/utils";

export interface SpinnerProps {
  /** pixel size of the spinner (default 20) */
  size?: number;
  className?: string;
}

/** Loading spinner — replaces MUI CircularProgress. Colour follows currentColor. */
export function Spinner({ size = 20, className }: SpinnerProps) {
  return <Loader2 className={cn("animate-spin", className)} style={{ width: size, height: size }} />;
}

export default Spinner;
