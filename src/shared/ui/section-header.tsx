import { cn } from "@/core/lib/utils";
import { ui } from "@/core/config/theme";

export interface SectionHeaderProps {
  icon?: React.ReactNode;
  label: string;
  /** show a trailing divider line filling the row */
  divider?: boolean;
  className?: string;
}

/** Icon + UPPERCASE section label (PatientForm look). */
export function SectionHeader({ icon, label, divider = true, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex items-center gap-2 mb-2.5", className)}>
      {icon && <span className="text-sky-500 shrink-0">{icon}</span>}
      <span className={ui.sectionTitle}>{label}</span>
      {divider && <span className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />}
    </div>
  );
}

export default SectionHeader;
