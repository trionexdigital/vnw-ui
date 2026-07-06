import { cn } from "@/core/lib/utils";
import { ui } from "@/core/config/theme";

export interface SectionCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** optional header title (string) */
  title?: React.ReactNode;
  /** optional right-aligned header content (actions) */
  actions?: React.ReactNode;
  bodyClassName?: string;
}

/** Rounded card surface used for form sections / panels (PatientForm look). */
export function SectionCard({ title, actions, className, bodyClassName, children, ...props }: SectionCardProps) {
  return (
    <div className={cn(ui.card, className)} {...props}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          {title && <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h2>}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </div>
  );
}

export default SectionCard;
