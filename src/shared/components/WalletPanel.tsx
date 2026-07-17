import { useEffect, useState } from 'react';
import { Wallet as WalletIcon, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { walletAPI } from '@/core/api/vnwAPI';
import { useToast } from '@/shared/hooks/use-toast';
import { formatINR } from '@/core/lib/format';
import { Panel } from '@/shared/components/ui-bits';

interface Props { showWithdraw?: boolean; onChange?: () => void; }

/** Wallet balance + recent ledger, with an optional withdraw form. Self-loading. */
export default function WalletPanel({ showWithdraw = true, onChange }: Props) {
  const { toast } = useToast();
  const [w, setW] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => { walletAPI.summary().then(setW).catch(() => {}); };
  useEffect(() => { load(); }, []);

  const withdraw = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try {
      await walletAPI.withdraw(Number(amount));
      toast({ title: 'Withdrawal requested', description: 'Funds reserved; admin will process it.' });
      setAmount(''); load(); onChange?.();
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
    finally { setBusy(false); }
  };

  const balance = Number(w?.balance || 0);
  const txns = w?.transactions || [];

  return (
    <Panel className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="gold-gradient-bg grid h-11 w-11 place-items-center rounded-xl text-accent-foreground"><WalletIcon className="h-5 w-5" /></span>
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Wallet Balance</div>
            <div className="text-2xl font-extrabold text-gold">{formatINR(balance)}</div>
          </div>
        </div>
        <div className="hidden text-right text-xs text-muted-foreground sm:block">
          <div>Credited: <b className="text-emerald-500">{formatINR(w?.total_credited || 0)}</b></div>
          <div>Debited: <b className="text-rose-500">{formatINR(w?.total_debited || 0)}</b></div>
        </div>
      </div>

      {showWithdraw && (
        <form onSubmit={withdraw} className="flex items-end gap-2">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-muted-foreground">Withdraw Amount (₹)</label>
            <input type="number" min="1" max={balance} required value={amount} onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-card-border bg-secondary px-3 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
          <button disabled={busy || balance <= 0} className="btn-gold">Withdraw</button>
        </form>
      )}

      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recent Activity</div>
        {txns.length === 0 ? (
          <p className="text-sm text-muted-foreground">No transactions yet.</p>
        ) : (
          <ul className="divide-y divide-card-border">
            {txns.slice(0, 8).map((t: any) => {
              const credit = t.direction === 'CREDIT';
              return (
                <li key={t.txn_id} className="flex items-center justify-between gap-3 py-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${credit ? 'bg-emerald-500/15 text-emerald-500' : 'bg-rose-500/15 text-rose-500'}`}>
                      {credit ? <ArrowDownLeft className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm text-foreground">{t.description || t.source}</div>
                      <div className="text-[11px] text-muted-foreground">{String(t.created_at).slice(0, 16).replace('T', ' ')}</div>
                    </div>
                  </div>
                  <span className={`shrink-0 text-sm font-bold ${credit ? 'text-emerald-500' : 'text-rose-500'}`}>{credit ? '+' : '−'}{formatINR(t.amount)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Panel>
  );
}
