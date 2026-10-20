import { useState } from 'react';
import Modal from '@/shared/components/Modal';
import { adminAPI } from '@/core/api/vnwAPI';
import './NumberDeleteDialog.css';

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
  return <Modal open onClose={() => { if (!busy) onClose(); }} title={confirming ? 'Confirm moving numbers to Recycle' : 'Delete numbers'} className="number-delete-dialog">
    <div className="number-delete-dialog__body">
    {confirming ? <>
      <p className="number-delete-dialog__description">Move these {analysis.eligible.length} numbers to Recycle? They will leave inventory and shopping lists. You can restore them from Recycle.</p>
      <ul className="number-delete-dialog__list number-delete-dialog__confirmation">{analysis.eligible.map((n: any) => <li key={n.number_id}>{n.display_number || n.number_value}</li>)}</ul>
    </> : <>
      <p className="number-delete-dialog__description">Enter up to 1,000 mobile numbers, separated by commas or new lines. Delete moves numbers to Recycle.</p>
      <label htmlFor="delete-numbers" className="number-delete-dialog__label">Mobile numbers</label>
      <textarea id="delete-numbers" value={numbers} disabled={busy} onChange={(e) => { setNumbers(e.target.value); setAnalysis(null); setError(''); }} className="number-delete-dialog__input" placeholder="9876543210, 9988776655" />
      <div className="number-delete-dialog__validate"><button disabled={busy || !numbers.trim()} onClick={validate} className="btn-gold-outline">{busy ? 'Validating…' : 'Validate'}</button></div>
      {analysis && <div className="number-delete-dialog__results" aria-live="polite">
        <div className="number-delete-dialog__summary">{[['Entered', analysis.total], ['Ready to recycle', analysis.eligible.length], ['Invalid', analysis.invalid.length], ['Not found', analysis.not_found.length], ['Duplicates', analysis.duplicates.length], ['Already recycled', analysis.already_deleted.length], ['Protected', analysis.blocked.length]].map(([label, count]) => <div key={label} className="number-delete-dialog__stat" data-stat={label}><span>{label}</span><strong>{count}</strong></div>)}</div>
        {analysis.invalid.length > 0 && <div className="number-delete-dialog__notice"><strong>Invalid entries</strong><ul>{analysis.invalid.map((n: any, i: number) => <li key={i}>{n.input}: {n.reason}</li>)}</ul></div>}
        {(['not_found', 'duplicates', 'already_deleted'] as const).map((key) => analysis[key].length > 0 && <div key={key} className="number-delete-dialog__notice"><strong>{key.replaceAll('_', ' ')}</strong><p>{analysis[key].join(', ')}</p></div>)}
        {analysis.blocked.map((n: any) => <p key={n.number} className="number-delete-dialog__notice text-amber-700">{n.number}: {n.reason}</p>)}
        <div><h3 className="number-delete-dialog__label">Numbers to move to Recycle</h3><ul className="number-delete-dialog__list">{analysis.eligible.map((n: any) => <li key={n.number_id}><strong>{n.display_number || n.number_value}</strong><span className="number-delete-dialog__status">{n.status}</span></li>)}{!analysis.eligible.length && <li>No eligible numbers.</li>}</ul></div>
      </div>}
    </>}
    {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
    </div>
    {confirming ? <div className="number-delete-dialog__footer"><button disabled={busy} onClick={() => setConfirming(false)} className="btn-gold-outline">Back</button><button disabled={busy} onClick={remove} className="btn-gold">{busy ? 'Moving…' : 'Confirm delete'}</button></div>
      : analysis && <div className="number-delete-dialog__footer"><button disabled={busy || !analysis.eligible.length} onClick={() => setConfirming(true)} className="btn-gold">Delete {analysis.eligible.length} numbers</button></div>}
  </Modal>;
}
