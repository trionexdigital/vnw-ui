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
      {icon && <span className="shrink-0 text-primary">{icon}</span>}
      <span className={ui.sectionTitle}>{label}</span>
      {divider && <span className="h-px flex-1 bg-border" />}
    </div>
  );
}

export default SectionHeader;
