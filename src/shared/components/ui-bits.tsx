import { ReactNode } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/core/lib/utils';
import { formatINR } from '@/core/lib/format';

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/58 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-[#7c2cff] shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-[#d9a31b]" /> VNW Console
        </div>
        <h1 className="text-2xl font-black text-[#1d1830] sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('vnw-card p-5', className)}>{children}</div>;
}

export function StatCard({ label, value, icon, accent }: { label: string; value: ReactNode; icon?: ReactNode; accent?: boolean }) {
  return (
    <div className="vnw-card vnw-card-hover p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-wide text-muted-foreground">{label}</span>
        {icon && <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/62 text-[#7c2cff] shadow-sm">{icon}</span>}
      </div>
      <div className={cn('mt-3 text-3xl font-black', accent ? 'text-gradient-vnw' : 'text-[#1d1830]')}>{value}</div>
    </div>
  );
}

export function Money({ value, className }: { value: number | string; className?: string }) {
  return <span className={cn('font-black text-[#063d2a]', className)}>{formatINR(value)}</span>;
}

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/20',
  PENDING: 'bg-amber-500/15 text-amber-700 border-amber-500/20',
  PENDING_APPROVAL: 'bg-amber-500/15 text-amber-700 border-amber-500/20',
  PAID: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/20',
  PROCESSING: 'bg-sky-500/15 text-sky-700 border-sky-500/20',
  COMPLETED: 'bg-emerald-600/15 text-emerald-700 border-emerald-500/20',
  SOLD: 'bg-zinc-500/15 text-zinc-600 border-zinc-500/20',
  RESERVED: 'bg-sky-500/15 text-sky-700 border-sky-500/20',
  CANCELLED: 'bg-rose-500/15 text-rose-700 border-rose-500/20',
  REJECTED: 'bg-rose-500/15 text-rose-700 border-rose-500/20',
  REFUNDED: 'bg-rose-500/15 text-rose-700 border-rose-500/20',
  UNPAID: 'bg-amber-500/15 text-amber-700 border-amber-500/20',
  FAILED: 'bg-rose-500/15 text-rose-700 border-rose-500/20',
  ACTIVE: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/20',
  BLOCKED: 'bg-rose-500/15 text-rose-700 border-rose-500/20',
  INACTIVE: 'bg-zinc-500/15 text-zinc-600 border-zinc-500/20',
  VERIFIED: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/20',
  APPROVED: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/20',
};

export function StatusBadge({ status }: { status?: string }) {
  const s = (status || '').toUpperCase();
  return <span className={cn('rounded-full border px-2.5 py-0.5 text-xs font-black', STATUS_COLORS[s] || 'border-white/70 bg-white/60 text-muted-foreground')}>{s.replace(/_/g, ' ') || '-'}</span>;
}

export function Loader({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin text-[#7c2cff]" /> {label || 'Loading...'}
    </div>
  );
}

export function EmptyState({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="vnw-card flex flex-col items-center gap-2 py-16 text-center">
      <p className="text-lg font-black text-[#1d1830]">{title}</p>
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="vnw-card overflow-x-auto p-0">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/70 bg-white/36 text-left text-xs uppercase tracking-wide text-muted-foreground">
            {head.map((h) => <th key={h} className="px-4 py-3 font-black">{h}</th>)}
          </tr>
        </thead>
        <tbody className="[&_tr]:border-white/60 [&_td]:align-middle">{children}</tbody>
      </table>
    </div>
  );
}
