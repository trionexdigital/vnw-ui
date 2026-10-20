import { useRef, useState, type ReactNode } from 'react';
import { LanguageText } from '@/shared/language/LanguageText';
import { mutation, requestKey } from '@/core/api/dealerManagement';
export const rupee = (value: unknown) => {
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(String(value ?? '0'));
  if (!match) return '—';
  return `₹${match[1]}${BigInt(match[2]).toLocaleString('en-IN')}.${(match[3] || '').padEnd(2, '0')}`;
};
export function previewProfit(cost: unknown, sale: unknown, charges: unknown): string | null {
  const parse = (value: unknown) => {
    const match = /^(\d{1,14})(?:\.(\d{1,2}))?$/.exec(String(value));
    return match ? BigInt(match[1]) * 100n + BigInt((match[2] || '').padEnd(2, '0')) : null;
  };
  const c = parse(cost), s = parse(sale), f = parse(charges);
  if (c === null || s === null || f === null) return null;
  const amount = s - c - f, abs = amount < 0n ? -amount : amount;
  return `${amount < 0n ? '-' : ''}${abs / 100n}.${String(abs % 100n).padStart(2, '0')}`;
}
export const localDate = () => {
  const date = new Date();
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
export const dateInput = (value: unknown) => String(value || '').slice(0, 16).replace(' ', 'T');
export function Field({
  label,
  children
}: {
  label: string;
  children: ReactNode;
}) {
  return <label className="dm-field"><span>{label}</span>{children}</label>;
}
export function Button({
  children,
  onClick,
  primary = false,
  danger = false,
  disabled = false,
  type = 'button'
}: {
  children: ReactNode;
  onClick?: () => void;
  primary?: boolean;
  danger?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  return <button type={type} disabled={disabled} onClick={onClick} className={`dm-button ${primary ? 'dm-button-primary' : ''} ${danger ? 'dm-button-danger' : ''}`}>{children}</button>;
}
export function Stats({
  values
}: {
  values: Array<[string, unknown, boolean?]>;
}) {
  return <div className="dm-stats">{values.map(([label, value, currency]) => <div className="dm-stat" key={label}><small>{label}</small><strong translate="no">{currency ? rupee(value) : String(value ?? 0)}</strong></div>)}</div>;
}
export function Pager({
  page,
  total,
  limit = 25,
  onPage
}: {
  page: number;
  total: number;
  limit?: number;
  onPage: (page: number) => void;
}) {
  return <div className="dm-pagination"><span><LanguageText source="{count} total · Page {page} of {pages}" values={{
        count: total,
        page,
        pages: Math.max(1, Math.ceil(total / limit))
      }} /></span><div className="flex gap-2"><Button disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</Button><Button disabled={page * limit >= total} onClick={() => onPage(page + 1)}>Next</Button></div></div>;
}
export function useMutation(onDone?: () => void) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const attempt = useRef<{
    payload: string;
    key: string;
  } | null>(null);
  const pending = useRef(false);
  const run = async (action: string, payload: Record<string, unknown>) => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError('');
    const serialized = JSON.stringify({
      action,
      payload
    });
    if (attempt.current?.payload !== serialized) attempt.current = {
      payload: serialized,
      key: requestKey()
    };
    try {
      const result = await mutation(action, payload, attempt.current.key);
      attempt.current = null;
      onDone?.();
      return result;
    } catch (e: any) {
      setError(e.message);
      return undefined;
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  return {
    busy,
    error,
    run,
    setError
  };
}
export function ErrorMessage({
  error
}: {
  error?: string;
}) {
  return error ? <div role="alert" className="dm-error">{error}</div> : null;
}
export function DealerSelect({
  dealers,
  value,
  onChange,
  all = false,
  disabled = false
}: {
  dealers: any[];
  value: string;
  onChange: (v: string) => void;
  all?: boolean;
  disabled?: boolean;
}) {
  return <select aria-label="Dealer" required={!all} disabled={disabled} value={value} onChange={e => onChange(e.target.value)}><option value="">{all ? 'All module dealers' : 'Choose dealer'}</option>{dealers.map(d => <option key={d.dealer_id} value={d.dealer_id}>{d.dealer_code} · {d.name}{d.status === 'BLOCKED' ? ' · BLOCKED' : ''}</option>)}</select>;
}
export function Readiness({
  value,
  onChange
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return <select aria-label="Readiness" required value={value} onChange={e => onChange(e.target.value)}><option value="RTP">RTP</option><option value="NON_RTP">NON-RTP</option><option value="RTA">RTA</option></select>;
}
