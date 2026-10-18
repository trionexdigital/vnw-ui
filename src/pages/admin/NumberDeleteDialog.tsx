import { useState } from 'react';
import Modal from '@/shared/components/Modal';
import { adminAPI } from '@/core/api/vnwAPI';

export default function NumberDeleteDialog({ initial = '', onClose, onSaved }: { initial?: string; onClose: () => void; onSaved: () => void }) {
  const [numbers, setNumbers] = useState(initial);
  const [analysis, setAnalysis] = useState<any>(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const validate = async () => {
    setBusy(true); setError(''); setAnalysis(null);
    try { setAnalysis(await adminAPI.numberDeleteValidate(numbers)); }
    catch (e: any) { setError(e.message); }
    finally { setBusy(false); }
  };
  const remove = async () => {
    setBusy(true); setError('');
    try { await adminAPI.numberDelete(numbers, analysis.validation_token); onSaved(); onClose(); }
    catch (e: any) { setError(e.message); setConfirming(false); setAnalysis(null); }
    finally { setBusy(false); }
  };
  return <Modal open onClose={() => { if (!busy) onClose(); }} title={confirming ? 'Confirm moving numbers to Recycle' : 'Delete numbers'} wide>
    {confirming ? <>
      <p className="text-sm">Move these {analysis.eligible.length} numbers to Recycle? They will leave inventory and shopping lists. You can restore them from Recycle.</p>
      <ul className="my-4 max-h-48 overflow-y-auto rounded-xl border border-border p-3 text-sm font-bold">{analysis.eligible.map((n: any) => <li key={n.number_id}>{n.display_number || n.number_value}</li>)}</ul>
      <div className="flex flex-wrap justify-end gap-2"><button disabled={busy} onClick={() => setConfirming(false)} className="btn-gold-outline">Back</button><button disabled={busy} onClick={remove} className="btn-gold">{busy ? 'Moving…' : 'Confirm delete'}</button></div>
    </> : <>
      <p className="mb-3 text-sm text-muted-foreground">Enter up to 1,000 mobile numbers, separated by commas or new lines. Delete moves numbers to Recycle.</p>
      <label htmlFor="delete-numbers" className="text-sm font-bold">Mobile numbers</label>
      <textarea id="delete-numbers" value={numbers} disabled={busy} onChange={(e) => { setNumbers(e.target.value); setAnalysis(null); setError(''); }} className="input-premium mt-2 min-h-32 w-full" placeholder="9876543210, 9988776655" />
      <button disabled={busy || !numbers.trim()} onClick={validate} className="btn-gold-outline my-3">{busy ? 'Validating…' : 'Validate'}</button>
      {analysis && <div className="space-y-3" aria-live="polite">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{[['Entered', analysis.total], ['Ready to recycle', analysis.eligible.length], ['Invalid', analysis.invalid.length], ['Not found', analysis.not_found.length], ['Duplicates', analysis.duplicates.length], ['Already recycled', analysis.already_deleted.length], ['Protected', analysis.blocked.length]].map(([label, count]) => <div key={label} className="rounded-xl border border-border bg-muted/30 p-3 text-xs"><span>{label}</span><strong className="block text-lg">{count}</strong></div>)}</div>
        {analysis.invalid.length > 0 && <div className="text-sm"><strong>Invalid entries</strong><ul>{analysis.invalid.map((n: any, i: number) => <li key={i}>{n.input}: {n.reason}</li>)}</ul></div>}
        {(['not_found', 'duplicates', 'already_deleted'] as const).map((key) => analysis[key].length > 0 && <div key={key} className="text-sm"><strong>{key.replaceAll('_', ' ')}</strong><p className="break-words">{analysis[key].join(', ')}</p></div>)}
        {analysis.blocked.map((n: any) => <p key={n.number} className="text-sm text-amber-700">{n.number}: {n.reason}</p>)}
        <div><h3 className="text-sm font-bold">Numbers to move to Recycle</h3><ul className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-border p-3 text-sm">{analysis.eligible.map((n: any) => <li key={n.number_id} className="flex justify-between gap-2 py-1"><strong>{n.display_number || n.number_value}</strong><span>{n.status}</span></li>)}{!analysis.eligible.length && <li>No eligible numbers.</li>}</ul></div>
        <button disabled={busy || !analysis.eligible.length} onClick={() => setConfirming(true)} className="btn-gold">Delete {analysis.eligible.length} numbers</button>
      </div>}
    </>}
    {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
  </Modal>;
}
