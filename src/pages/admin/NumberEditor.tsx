import { useState } from 'react';
import { ThemedSelect } from '@/shared/ui/themed-select';
import { adminAPI, type NumberAnalysis } from '@/core/api/vnwAPI';
import { badgeOptions, statusOptions } from '@/core/lib/format';
import { NumberAnalysisPanel } from './NumberImportDialog';

const field = 'h-10 w-full min-w-0 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary';

export default function NumberEditor({ initial, onSaved, onChanged }: { initial: any; onSaved: (message: string) => void; onChanged?: () => void }) {
  const [form, setForm] = useState(initial);
  const [analysis, setAnalysis] = useState<NumberAnalysis | null>(null);
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const set = (key: string, value: any) => { setForm((current: any) => ({ ...current, [key]: value })); setAnalysis(null); setError(''); };
  const validate = async () => {
    setBusy(true); setError(''); setAnalysis(null);
    try { setAnalysis(await adminAPI.numbersAnalyze({ ...form, numbers: form.display_number })); }
    catch (reason: any) { setError(reason.message); }
    finally { setBusy(false); }
  };
  const save = async () => {
    if (!analysis?.analysis_token) return;
    setBusy(true); setError('');
    try {
      if (form.number_id) {
        await adminAPI.numberSave({ ...form, number_value: analysis.rows[0].values?.number, display_number: analysis.rows[0].values?.number, mrp: Number(form.mrp), rtp_available_date: form.rtp_status === 'NON_RTP' ? form.rtp_available_date : null });
        onSaved('Number updated');
      } else {
        const result = await adminAPI.numbersImport(analysis.analysis_token);
        onChanged?.();
        if (result.rejected) {
          setAnalysis({ total: result.rows.length, ready: result.imported, rejected: result.rejected, rows: result.rows, analysis_token: null });
          setError(`${result.imported} numbers imported; ${result.rejected} rejected during the final server check. Review the results.`);
        } else onSaved(`${result.imported} numbers added`);
      }
    } catch (reason: any) { setError(reason.message); }
    finally { setBusy(false); }
  };
  return <form onSubmit={(event) => { event.preventDefault(); void save(); }} className="grid gap-3 sm:grid-cols-2" noValidate>
    <label className="grid gap-1 text-xs font-bold sm:col-span-2">{form.number_id ? 'Mobile number' : 'Mobile numbers'}<textarea aria-label="Mobile numbers" disabled={busy} rows={form.number_id ? 1 : 3} className={`${field} h-auto py-2 font-normal`} value={form.display_number} onChange={(event) => set('display_number', event.target.value)} placeholder={form.number_id ? '10-digit mobile number' : 'Enter numbers separated by commas or new lines'} /></label>
    <label className="grid gap-1 text-xs font-bold">Display title<input disabled={busy} className={field} value={form.title_label} onChange={(event) => set('title_label', event.target.value)} /></label>
    <label className="grid gap-1 text-xs font-bold">Badge<ThemedSelect disabled={busy} className={field} value={form.badge} onChange={(event) => set('badge', event.target.value)}>{badgeOptions.map((badge) => <option key={badge.value} value={badge.value}>{badge.label}</option>)}</ThemedSelect></label>
    <label className="grid gap-1 text-xs font-bold">MRP (₹)<input disabled={busy} inputMode="decimal" className={field} value={form.mrp} onChange={(event) => set('mrp', event.target.value)} /><span className="text-[10px] font-normal text-muted-foreground">Discounted price follows store settings.</span></label>
    <label className="grid content-start gap-1 text-xs font-bold">Catalog status<ThemedSelect disabled={busy} className={field} value={form.status} onChange={(event) => set('status', event.target.value)}>{statusOptions.map((status) => <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>)}</ThemedSelect></label>
    <label className="grid gap-1 text-xs font-bold">Visibility<ThemedSelect disabled={busy} className={field} value={form.visibility_type} onChange={(event) => set('visibility_type', event.target.value)}><option value="ONLINE">Online · public catalog</option><option value="OFFLINE">Offline · generic catalog link</option></ThemedSelect></label>
    <label className="grid gap-1 text-xs font-bold">Porting / activation readiness<ThemedSelect disabled={busy} className={field} value={form.rtp_status} onChange={(event) => set('rtp_status', event.target.value)}><option value="RTP">RTP · ready to port</option><option value="RTA">RTA · ready to activate</option><option value="NON_RTP">NON-RTP · pre-book</option></ThemedSelect></label>
    {form.rtp_status === 'NON_RTP' && <label className="grid gap-1 text-xs font-bold">Ready-to-port date (India)<input disabled={busy} type="date" className={field} value={form.rtp_available_date || ''} onChange={(event) => set('rtp_available_date', event.target.value)} /></label>}
    <label className="grid gap-1 text-xs font-bold sm:col-span-2">Description<textarea disabled={busy} rows={2} className={`${field} h-auto py-2 font-normal`} value={form.description || ''} onChange={(event) => set('description', event.target.value)} /></label>
    <div className="space-y-3 sm:col-span-2">{analysis && <NumberAnalysisPanel key={analysis.analysis_token || error} analysis={analysis} />}{error && <p role="alert" className="text-xs text-destructive">{error}</p>}<div className="flex justify-end gap-2"><button type="button" disabled={busy} onClick={() => void validate()} className="btn-gold-outline min-h-9 px-4 text-xs">{busy ? 'Processing…' : 'Validate'}</button><button disabled={busy || !analysis?.analysis_token || (form.number_id && analysis.ready !== 1)} className="btn-gold min-h-9 px-4 text-xs">{form.number_id ? 'Save number' : `Add ${analysis?.ready || 0} accepted`}</button></div></div>
  </form>;
}
