import { Children, cloneElement, isValidElement, ReactElement, ReactNode, useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/core/lib/utils';
import { formatINR } from '@/core/lib/format';
import { ThemedSelect } from '@/shared/ui/themed-select';

export function PageHeader({ title, subtitle, description, action }: { title: string; subtitle?: string; description?: string; action?: ReactNode }) {
  const { pathname } = useLocation();
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return action ? <div className="admin-page-actions mb-3 flex justify-end">{action}</div> : null;
  }
  return (
    <div className="vip-page-header mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="relative z-10">
        <h1 className="text-xl font-black text-foreground sm:text-2xl">{title}</h1>
        {(subtitle || description) && <p className="mt-1 text-sm text-muted-foreground">{subtitle || description}</p>}
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
  SUCCESS: 'bg-success-soft text-success border-success/25',
  PROCESSED: 'bg-success-soft text-success border-success/25',
  REVIEW: 'bg-warning-soft text-warning border-warning/25',
  USER_DROPPED: 'bg-muted text-muted-foreground border-border',
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

function CardGridWire({ count = 8, wide = false }: { count?: number; wide?: boolean }) {
  return (
    <div data-wireframe="number-cards" className={cn('number-card-grid', wide && 'w-full')}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-[#dfcfaa] bg-card p-1.5 shadow-sm">
          <div className="rounded-lg bg-[#fbefd5] p-2">
            <div className="flex justify-between"><Wire className="h-6 w-20 rounded-full" /><Wire className="h-6 w-12 rounded-full" /><Wire className="h-6 w-6 rounded-full" /></div>
            <Wire className="mx-auto mt-3 h-5 w-28" /><Wire className="mx-auto mt-2 h-7 w-[85%]" /><Wire className="mx-auto mt-2 h-3 w-24" />
          </div>
          <div className="mt-1.5 grid grid-cols-2 gap-1"><Wire className="h-9 rounded-lg" /><Wire className="h-9 rounded-lg" /></div>
          <Wire className="mt-1.5 h-11 rounded-lg" />
          <div className="mt-1.5 grid grid-cols-[1.1fr_1fr_2rem] gap-1"><Wire className="h-9 rounded-lg" /><Wire className="h-9 rounded-lg" /><Wire className="h-9 rounded-lg" /></div>
        </div>
      ))}
    </div>
  );
}

function FamilyPackWire() {
  return (
    <div data-wireframe="family-packs" className="grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, card) => (
        <div key={card} className="rounded-xl border border-[#dfcfaa] bg-card p-1.5">
          <div className="rounded-lg bg-[#fbefd5] p-2"><div className="flex justify-between"><Wire className="h-6 w-24 rounded-full" /><Wire className="h-8 w-8 rounded-lg" /></div><Wire className="mt-2 h-5 w-36" /><Wire className="mt-1 h-3 w-4/5" /></div>
          <div className="mt-1.5 grid gap-px overflow-hidden rounded-lg border border-border">
            {Array.from({ length: 3 }).map((_, row) => <Wire key={row} className="h-12 rounded-none" />)}
          </div>
          <Wire className="mt-1.5 h-10 rounded-lg" />
          <div className="mt-1.5 grid grid-cols-2 gap-1"><Wire className="h-9 rounded-lg" /><Wire className="h-9 rounded-lg" /></div>
        </div>
      ))}
    </div>
  );
}

function HomeWire() {
  return <div data-wireframe="home" className="mx-auto max-w-[1320px] space-y-5">
    <div className="grid gap-3 rounded-2xl bg-[#faf0df] p-4 lg:grid-cols-2"><div className="space-y-3"><Wire className="h-5 w-44" /><Wire className="h-12 w-4/5" /><Wire className="h-5 w-3/5" /><Wire className="h-9 w-32" /></div><Wire className="h-44 rounded-2xl" /></div>
    <Wire className="h-11 w-full rounded-xl" />
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <Wire key={index} className="h-28 rounded-xl" />)}</div>
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <Wire key={index} className="h-40 rounded-xl" />)}</div>
    <Wire className="h-7 w-48" /><CardGridWire count={4} />
  </div>;
}

function StaticPageWire() {
  return <div data-wireframe="static-page" className="mx-auto max-w-7xl space-y-4">
    <div className="rounded-xl border border-border bg-card p-5"><Wire className="h-5 w-28" /><Wire className="mt-2 h-8 w-2/3 max-w-lg" /><Wire className="mt-2 h-4 w-4/5 max-w-xl" /></div>
    <div className="grid gap-3 md:grid-cols-2">{Array.from({ length: 4 }).map((_, index) => <Wire key={index} className="h-32 rounded-xl" />)}</div>
  </div>;
}

function FaqWire() {
  return (
    <div data-wireframe="faq" className="mx-auto max-w-5xl">
      <HeaderWire />
      <div className="mt-8 grid gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="vnw-card flex min-h-14 items-center justify-between gap-4 p-4">
            <Wire className="h-4 w-3/4 rounded-full" />
            <Wire className="h-8 w-8 shrink-0 rounded-xl" />
          </div>
        ))}
      </div>
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

export function Loader({ label, variant }: { label?: string; variant?: 'home' | 'static' | 'dashboard' | 'table' | 'cards' | 'packs' | 'faq' | 'detail' | 'form' | 'shop' | 'generic' }) {
  const { pathname } = useLocation();
  const inferred = variant
    || (pathname === '/' ? 'home'
      : ['/about', '/contact', '/how-it-works', '/numerology'].includes(pathname) ? 'static'
      : pathname.includes('/shop') || pathname.includes('/wishlist') || pathname === '/pre-book' || pathname === '/newly-added-vip-numbers' || pathname === '/premium-numbers' ? 'shop'
      : pathname.includes('/number/') || pathname.includes('/orders/') || pathname === '/cart' || pathname === '/compare' ? 'detail'
        : pathname === '/family-pack' ? 'packs'
            : pathname === '/faq' ? 'faq'
              : pathname === '/categories' || pathname === '/numerology' ? 'cards'
          : pathname.includes('/checkout') || pathname === '/contact' ? 'form'
            : pathname.includes('/dashboard') || pathname === '/admin' || pathname === '/dealer' || pathname === '/employee' ? 'dashboard'
              : pathname.includes('/account') || pathname.includes('/settings') || pathname.includes('/create') || pathname.includes('/new') || pathname.includes('/edit') ? 'form'
                : 'table');

  return (
    <div className="animate-rise-in py-2" aria-busy="true" aria-live="polite" aria-label={label || 'Loading content'}>
      {inferred === 'home' && <HomeWire />}
      {inferred === 'static' && <StaticPageWire />}
      {inferred === 'dashboard' && <DashboardWire />}
      {inferred === 'table' && <TableWire />}
      {inferred === 'cards' && <CardGridWire count={10} wide />}
      {inferred === 'packs' && <FamilyPackWire />}
      {inferred === 'faq' && <FaqWire />}
      {inferred === 'detail' && <><HeaderWire /><DetailWire /></>}
      {inferred === 'form' && <><HeaderWire /><FormWire /></>}
      {inferred === 'shop' && <ShopWire />}
      {inferred === 'generic' && <GenericWire label={label} />}
    </div>
  );
}

export function EmptyState({ title, subtitle, description, action }: { title: string; subtitle?: string; description?: string; action?: ReactNode }) {
  return (
    <div className="vnw-card flex flex-col items-center gap-2 px-4 py-8 text-center sm:py-10">
      <p className="text-lg font-black text-foreground">{title}</p>
      {(subtitle || description) && <p className="text-sm text-muted-foreground">{subtitle || description}</p>}
      {action && <div className="mt-2">{action}</div>}
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

export type TablePagination = { page: number; pageSize: number; total: number; onPageChange: (page: number) => void; onPageSizeChange: (size: number) => void };

function TablePager({ page, pageSize, total, onPageChange, onPageSizeChange }: TablePagination) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return <div className="table-pager" role="navigation" aria-label="Table pagination">
    <span>{total ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}` : '0 results'}</span>
    <label>Rows <ThemedSelect aria-label="Rows per page" value={String(pageSize)} onChange={(event) => onPageSizeChange(Number(event.target.value))} className="table-pager__size">{Array.from(new Set([10, 25, 50, 100, 500, 1000, pageSize])).sort((a, b) => a - b).map((size) => <option key={size} value={size}>{size}</option>)}</ThemedSelect></label>
    <button type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>‹</button>
    <span>Page {page} of {pages}</span>
    <button type="button" aria-label="Next page" disabled={page >= pages} onClick={() => onPageChange(page + 1)}>›</button>
  </div>;
}

export function Table({ head, children, pagination }: { head: string[]; children: ReactNode; pagination?: TablePagination }) {
  const [localPage, setLocalPage] = useState(1);
  const [localPageSize, setLocalPageSize] = useState(25);
  const rows = Children.toArray(children);
  const page = pagination?.page ?? localPage;
  const pageSize = pagination?.pageSize ?? localPageSize;
  const total = pagination?.total ?? rows.length;
  const visibleRows = pagination ? children : rows.slice((localPage - 1) * localPageSize, localPage * localPageSize);
  const labeledChildren = labelTableCells(visibleRows, head);
  useEffect(() => { if (!pagination && localPage > Math.max(1, Math.ceil(rows.length / localPageSize))) setLocalPage(1); }, [localPage, localPageSize, pagination, rows.length]);
  return (
    <div className="vnw-card overflow-hidden p-0">
      <div className="overflow-x-auto"><table className="admin-responsive-table w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/60 text-left text-xs uppercase text-muted-foreground">
            {head.map((h) => <th key={h} className="px-4 py-3 font-black">{h}</th>)}
          </tr>
        </thead>
        <tbody className="[&_tr]:border-border [&_td]:align-middle">{labeledChildren}</tbody>
      </table></div>
      {(pagination || total > localPageSize) && <TablePager page={page} pageSize={pageSize} total={total} onPageChange={pagination?.onPageChange ?? setLocalPage} onPageSizeChange={pagination?.onPageSizeChange ?? ((size) => { setLocalPageSize(size); setLocalPage(1); })} />}
    </div>
  );
}
