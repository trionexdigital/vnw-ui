import { useState } from 'react';
import { Download, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { adminAPI, type NumberAnalysis, type NumberWorkbook } from '@/core/api/vnwAPI';
import Modal from '@/shared/components/Modal';

export function downloadNumberWorkbook(workbook: NumberWorkbook) {
  const bytes = Uint8Array.from(atob(workbook.content_base64), (character) => character.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type: workbook.mime }));
  const link = document.createElement('a'); link.href = url; link.download = workbook.filename; link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function NumberAnalysisPanel({ analysis }: { analysis: NumberAnalysis }) {
  const [showRejected, setShowRejected] = useState(false);
  const [visible, setVisible] = useState(100);
  const rows = showRejected ? analysis.rows.filter((row) => row.reasons.length) : analysis.rows;
  return <section aria-label="Number validation results" className="space-y-2 rounded-xl border border-border p-3">
    <div role="status" className="flex flex-wrap items-center gap-3 text-xs font-bold"><span>{analysis.total} entries analyzed</span><span className="inline-flex items-center gap-1 text-success"><CheckCircle2 className="h-4 w-4" />{analysis.ready} ready</span><span className="inline-flex items-center gap-1 text-destructive"><AlertCircle className="h-4 w-4" />{analysis.rejected} rejected</span></div>
    <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={showRejected} onChange={(event) => { setShowRejected(event.target.checked); setVisible(100); }} /> Show rejected entries only</label>
    <div className="max-h-44 overflow-auto"><table className="w-full text-left text-xs"><thead className="sticky top-0 bg-card"><tr><th className="p-2">Row</th><th className="p-2">Number</th><th className="p-2">Result</th></tr></thead><tbody>{rows.slice(0, visible).map((row) => <tr key={row.row} className="border-t border-border"><td className="p-2">{row.row}</td><td className="p-2">{row.values?.number || row.input}</td><td className={`p-2 ${row.reasons.length ? 'text-destructive' : 'text-success'}`}>{row.reasons.length ? row.reasons.join(' ') : 'Ready to import'}</td></tr>)}</tbody></table></div>
    {rows.length > visible && <button type="button" onClick={() => setVisible((count) => count + 100)} className="text-xs font-bold text-primary">Show 100 more results</button>}
  </section>;
}

export default function NumberImportDialog({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<NumberAnalysis | null>(null);
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const analyze = async () => {
    if (!file) return;
    setBusy(true); setError(''); setDone(''); setAnalysis(null);
    try { setAnalysis(await adminAPI.numbersAnalyzeFile(file)); }
    catch (reason: any) { setError(reason.message); }
    finally { setBusy(false); }
  };
  const commit = async () => {
    if (!analysis?.analysis_token) return;
    setBusy(true); setError('');
    try {
      const result = await adminAPI.numbersImport(analysis.analysis_token);
      setDone(`${result.imported} numbers imported. ${result.rejected} entries rejected during the final server check.`);
      setAnalysis({ total: result.rows.length, ready: result.imported, rejected: result.rejected, rows: result.rows, analysis_token: null });
      onSaved();
    } catch (reason: any) { setError(reason.message); }
    finally { setBusy(false); }
  };
  const template = async () => { setBusy(true); setError(''); try { downloadNumberWorkbook(await adminAPI.numbersTemplate()); } catch (reason: any) { setError(reason.message); } finally { setBusy(false); } };
  return <Modal open={open} onClose={() => !busy && onClose()} title="Import numbers" wide>
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-muted-foreground">CSV or XLSX · up to 5,000 entries per file</p><button disabled={busy} onClick={() => void template()} className="btn-gold-outline min-h-9 px-3 text-xs"><Download className="h-4 w-4" /> Excel template</button></div>
      <label className="grid gap-2 rounded-xl border border-dashed border-border p-3 text-xs font-bold">Numbers file<input type="file" accept=".csv,.xlsx" disabled={busy} onChange={(event) => { setFile(event.target.files?.[0] || null); setAnalysis(null); setDone(''); setError(''); }} className="w-full text-xs" /></label>
      <p className="text-xs text-muted-foreground">The server checks mobile numbers, duplicates, prices, statuses and readiness dates. Only accepted entries can be imported.</p>
      {analysis && <NumberAnalysisPanel key={analysis.analysis_token || done} analysis={analysis} />}
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}{done && <p role="status" className="text-xs font-bold text-success">{done}</p>}
      <div className="flex flex-wrap justify-end gap-2"><button disabled={busy || !file} onClick={() => void analyze()} className="btn-gold-outline min-h-9 px-4 text-xs">{busy ? 'Processing…' : 'Analyze file'}</button><button disabled={busy || !analysis?.analysis_token} onClick={() => void commit()} className="btn-gold min-h-9 px-4 text-xs"><Upload className="h-4 w-4" /> Import {analysis?.ready || 0} accepted</button></div>
    </div>
  </Modal>;
}
