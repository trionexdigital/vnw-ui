import type { ReactNode } from 'react';
import { type LucideIcon } from 'lucide-react';

export default function CompactPageHeader({ title, subtitle, icon: Icon, action }: { title: string; subtitle: string; icon: LucideIcon; action?: ReactNode }) {
  return <header className="compact-page-header mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-primary/15 bg-gradient-to-r from-card to-primary/5 p-4">
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span>
    <div className="min-w-0 flex-1"><h1>{title}</h1><p className="mt-1 text-xs text-muted-foreground">{subtitle}</p></div>{action && <div className="compact-page-header__actions flex shrink-0 items-center gap-2">{action}</div>}
  </header>;
}
