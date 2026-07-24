import { Children, cloneElement, isValidElement, ReactElement, ReactNode } from 'react';
import { Sparkles } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/core/lib/utils';
import { formatINR } from '@/core/lib/format';

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="vip-page-header mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="relative z-10">
        <h1 className="text-xl font-black text-foreground sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action && <div className="relative z-10">{action}</div>}
    </div>
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('vnw-card p-4', className)}>{children}</div>;
}

export function StatCard({ label, value, icon, accent }: { label: string; value: ReactNode; icon?: ReactNode; accent?: boolean }) {
  return (
    <div className="vip-stat-card vnw-card vnw-card-hover p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-wide text-muted-foreground">{label}</span>
        {icon && <span className="grid h-9 w-9 place-items-center rounded-lg bg-warning-soft text-warning">{icon}</span>}
      </div>
      <div className={cn('mt-2 text-2xl font-black tabular-nums', accent ? 'text-accent' : 'text-foreground')}>{value}</div>
    </div>
  );
}

export function Money({ value, className }: { value: number | string; className?: string }) {
  return <span className={cn('font-black text-success', className)}>{formatINR(value)}</span>;
}

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: 'bg-success-soft text-success border-success/25',
  PENDING: 'bg-warning-soft text-warning border-warning/25',
  PENDING_APPROVAL: 'bg-warning-soft text-warning border-warning/25',
  PAID: 'bg-success-soft text-success border-success/25',
  PROCESSING: 'bg-info-soft text-info border-info/25',
  COMPLETED: 'bg-success-soft text-success border-success/25',
  SOLD: 'bg-muted text-muted-foreground border-border',
  RESERVED: 'bg-info-soft text-info border-info/25',
  CANCELLED: 'bg-destructive/10 text-destructive border-destructive/25',
  REJECTED: 'bg-destructive/10 text-destructive border-destructive/25',
  REFUNDED: 'bg-destructive/10 text-destructive border-destructive/25',
  UNPAID: 'bg-warning-soft text-warning border-warning/25',
  FAILED: 'bg-destructive/10 text-destructive border-destructive/25',
  ACTIVE: 'bg-success-soft text-success border-success/25',
  BLOCKED: 'bg-destructive/10 text-destructive border-destructive/25',
  INACTIVE: 'bg-muted text-muted-foreground border-border',
  VERIFIED: 'bg-success-soft text-success border-success/25',
  APPROVED: 'bg-success-soft text-success border-success/25',
};

export function StatusBadge({ status }: { status?: string }) {
  const s = (status || '').toUpperCase();
  return <span className={cn('rounded-full border px-2.5 py-0.5 text-xs font-black', STATUS_COLORS[s] || 'border-border bg-muted text-muted-foreground')}>{s.replace(/_/g, ' ') || '-'}</span>;
}

function Wire({ className }: { className?: string }) {
  return <div className={cn('wireframe-shimmer rounded-2xl bg-muted', className)} />;
}

function HeaderWire() {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0 flex-1">
        <Wire className="mb-3 h-7 w-36 rounded-full" />
        <Wire className="h-9 w-64 max-w-full" />
        <Wire className="mt-2 h-4 w-80 max-w-full" />
      </div>
      <Wire className="h-11 w-36 rounded-2xl" />
    </div>
  );
}

function StatWire({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="vnw-card p-4">
          <div className="flex items-center justify-between">
            <Wire className="h-4 w-24 rounded-full" />
            <Wire className="h-10 w-10 rounded-2xl" />
          </div>
          <Wire className="mt-4 h-8 w-20" />
          <Wire className="mt-3 h-3 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
}

function TableWire({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="vnw-card overflow-hidden p-0">
      <div className="hidden grid-cols-5 gap-4 border-b border-border bg-muted/60 p-4 md:grid">
        {Array.from({ length: cols }).map((_, i) => <Wire key={i} className="h-4 rounded-full" />)}
      </div>
      <div className="hidden divide-y divide-border md:block">
        {Array.from({ length: rows }).map((_, row) => (
          <div key={row} className="grid grid-cols-5 gap-4 p-4">
            {Array.from({ length: cols }).map((_, col) => <Wire key={col} className="h-5 rounded-full" />)}
          </div>
        ))}
      </div>
      <div className="grid gap-3 p-3 md:hidden">
        {Array.from({ length: 4 }).map((_, row) => (
          <div key={row} className="rounded-2xl border border-border bg-muted/60 p-4">
            <Wire className="h-5 w-36" />
            <div className="mt-4 grid gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="grid grid-cols-[6rem_1fr] items-center gap-3">
                  <Wire className="h-3 rounded-full" />
                  <Wire className="h-4 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CardGridWire({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="vnw-card p-4">
          <Wire className="h-8 w-36" />
          <Wire className="mt-3 h-4 w-24 rounded-full" />
          <div className="mt-5 grid grid-cols-2 gap-2">
            <Wire className="h-9 rounded-2xl" />
            <Wire className="h-9 rounded-2xl" />
          </div>
          <Wire className="mt-4 h-11 rounded-2xl" />
        </div>
      ))}
    </div>
  );
}

function DetailWire() {
  return (
    <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
      <div className="vnw-card p-5">
        <Wire className="h-10 w-64 max-w-full" />
        <Wire className="mt-4 h-5 w-40" />
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => <Wire key={i} className="h-16 rounded-2xl" />)}
        </div>
      </div>
      <div className="vnw-card p-5">
        <Wire className="h-8 w-36" />
        <Wire className="mt-5 h-28 rounded-2xl" />
        <Wire className="mt-4 h-12 rounded-2xl" />
        <Wire className="mt-3 h-12 rounded-2xl" />
      </div>
    </div>
  );
}

function FormWire() {
  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
      <div className="vnw-card grid gap-3 p-4 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => <Wire key={i} className="h-11 rounded-2xl" />)}
        <Wire className="h-24 rounded-2xl sm:col-span-2" />
        <Wire className="h-11 w-40 rounded-2xl sm:col-span-2" />
      </div>
      <div className="vnw-card p-4">
        <Wire className="h-12 w-12 rounded-2xl" />
        <Wire className="mt-4 h-6 w-44" />
        <div className="mt-4 grid gap-3">
          <Wire className="h-16 rounded-2xl" />
          <Wire className="h-16 rounded-2xl" />
          <Wire className="h-16 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

function DashboardWire() {
  return (
    <div>
      <HeaderWire />
      <StatWire count={6} />
      <div className="mt-5 grid gap-5 lg:grid-cols-[1.35fr_.85fr]">
        <div className="vnw-card p-5">
          <Wire className="h-6 w-44" />
          <Wire className="mt-5 h-64 rounded-2xl" />
        </div>
        <div className="vnw-card p-5">
          <Wire className="h-6 w-40" />
          <div className="mt-5 grid gap-3">
            {Array.from({ length: 5 }).map((_, i) => <Wire key={i} className="h-9 rounded-2xl" />)}
          </div>
        </div>
      </div>
      <div className="mt-5"><TableWire rows={5} /></div>
    </div>
  );
}

function ShopWire() {
  return (
    <div>
      <HeaderWire />
      <div className="mb-4 grid gap-3 lg:grid-cols-[260px_1fr]">
        <div className="vnw-card hidden p-4 lg:block">
          {Array.from({ length: 7 }).map((_, i) => <Wire key={i} className="mb-3 h-10 rounded-2xl last:mb-0" />)}
        </div>
        <CardGridWire />
      </div>
    </div>
  );
}

function GenericWire({ label }: { label?: string }) {
  return (
    <div>
      <HeaderWire />
      <div className="mb-3 flex items-center gap-2 text-xs font-black text-accent">
        <Sparkles className="h-3.5 w-3.5" /> {label || 'Loading content'}
      </div>
      <StatWire />
      <div className="mt-5"><TableWire /></div>
    </div>
  );
}

export function Loader({ label, variant }: { label?: string; variant?: 'dashboard' | 'table' | 'cards' | 'detail' | 'form' | 'shop' | 'generic' }) {
  const { pathname } = useLocation();
  const inferred = variant
    || (pathname === '/' || pathname.includes('/shop') || pathname.includes('/wishlist') || pathname.includes('/compare') ? 'shop'
      : pathname.includes('/number/') || pathname.includes('/orders/') ? 'detail'
        : pathname.includes('/dashboard') || pathname === '/admin' || pathname === '/dealer' || pathname === '/employee' ? 'dashboard'
          : pathname.includes('/account') || pathname.includes('/settings') || pathname.includes('/create') || pathname.includes('/new') || pathname.includes('/edit') ? 'form'
            : 'table');

  return (
    <div className="animate-rise-in py-2" aria-busy="true" aria-live="polite" aria-label={label || 'Loading content'}>
      {inferred === 'dashboard' && <DashboardWire />}
      {inferred === 'table' && <TableWire />}
      {inferred === 'cards' && <CardGridWire />}
      {inferred === 'detail' && <><HeaderWire /><DetailWire /></>}
      {inferred === 'form' && <><HeaderWire /><FormWire /></>}
      {inferred === 'shop' && <ShopWire />}
      {inferred === 'generic' && <GenericWire label={label} />}
    </div>
  );
}

export function EmptyState({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="vnw-card flex flex-col items-center gap-2 py-16 text-center">
      <p className="text-lg font-black text-foreground">{title}</p>
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

function labelTableCells(node: ReactNode, head: string[]): ReactNode {
  return Children.map(node, (child) => {
    if (!isValidElement(child)) return child;
    const element = child as ReactElement<any>;

    if (element.type === 'tr') {
      const cells = Children.map(element.props.children, (cell, index) => {
        if (!isValidElement(cell)) return cell;
        return cloneElement(cell as ReactElement<any>, {
          'data-label': head[index] || '',
          className: cn((cell as ReactElement<any>).props.className, 'admin-table-cell'),
        });
      });
      return cloneElement(element, {
        className: cn(element.props.className, 'admin-table-row'),
        children: cells,
      });
    }

    if (element.props?.children) {
      return cloneElement(element, {
        children: labelTableCells(element.props.children, head),
      });
    }

    return child;
  });
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  const labeledChildren = labelTableCells(children, head);
  return (
    <div className="vnw-card overflow-hidden p-0">
      <table className="admin-responsive-table w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/60 text-left text-xs uppercase text-muted-foreground">
            {head.map((h) => <th key={h} className="px-4 py-3 font-black">{h}</th>)}
          </tr>
        </thead>
        <tbody className="[&_tr]:border-border [&_td]:align-middle">{labeledChildren}</tbody>
      </table>
    </div>
  );
}
