import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, Upload, Plus, RefreshCw } from 'lucide-react';
import { languagesAPI, type LanguageDocument, type LanguageEntry, type LanguageList } from '@/core/api/vnwAPI';
import { languages } from '@/shared/language/LanguageProvider';
import { PageHeader, Loader, Table, EmptyState } from '@/shared/components/ui-bits';
import Modal from '@/shared/components/Modal';
import { useToast } from '@/shared/hooks/use-toast';

const field='w-full rounded-xl border border-border bg-background px-3 py-2 text-sm';
export default function AdminLanguages() {
  const {toast}=useToast();
  const [language,setLanguage]=useState('hi'),[q,setQ]=useState(''),[search,setSearch]=useState(''),[missing,setMissing]=useState(false),[page,setPage]=useState(1),[limit,setLimit]=useState(25);
  const [data,setData]=useState<LanguageList|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const [editing,setEditing]=useState<LanguageEntry|null>(null),[adding,setAdding]=useState(false),[imported,setImported]=useState<LanguageDocument|null>(null),[publishing,setPublishing]=useState(false);
  const sequence=useRef(0),file=useRef<HTMLInputElement>(null);
  useEffect(()=>{const timer=setTimeout(()=>{setSearch(q);setPage(1);},250);return()=>clearTimeout(timer);},[q]);
  const load=useCallback(async()=>{
    const id=++sequence.current;setLoading(true);setError('');
    try{const result=await languagesAPI.list({language,page,limit,q:search,missing_only:missing});if(id===sequence.current){setData(result);if(page>1&&!result.items.length)setPage(page-1);}}
    catch(e:any){if(id===sequence.current)setError(e.message);}
    finally{if(id===sequence.current)setLoading(false);}
  },[language,page,limit,search,missing]);
  const loadRef=useRef(load);loadRef.current=load;
  useEffect(()=>{void load();return()=>{sequence.current++;};},[load]);
  const run=async(work:()=>Promise<unknown>,message:string)=>{
    setBusy(true);try{await work();toast({title:message});setEditing(null);setImported(null);setPublishing(false);await loadRef.current();}
    catch(e:any){toast({title:'Could not complete language update',description:e.message,variant:'destructive'});}
    finally{setBusy(false);}
  };
  const exportFile=()=>run(async()=>{
    const document=await languagesAPI.export(language),url=URL.createObjectURL(new Blob([JSON.stringify(document,null,2)],{type:'application/json'}));
    const anchor=window.document.createElement('a');anchor.href=url;anchor.download=`vnw-language-${language}.json`;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  },'Language file exported');
  const readFile=async(event:React.ChangeEvent<HTMLInputElement>)=>{
    const selected=event.target.files?.[0];event.target.value='';if(!selected)return;
    try{
      if(selected.size>8000000)throw new Error('Choose a language file smaller than 8 MB.');
      const document=JSON.parse(await selected.text()) as LanguageDocument;
      if(document.format!=='vnw-language-v1'||document.language!==language||!Array.isArray(document.entries)||!document.entries.length||document.entries.length>5000||document.entries.some(e=>typeof e.source!=='string'||typeof e.translation!=='string'))throw new Error('Choose an exported language file for the selected language (up to 5,000 entries).');
      setImported(document);
    }catch(e:any){toast({title:'Invalid language file',description:e.message,variant:'destructive'});}
  };
  const name=languages.find(l=>l.code===language)?.name;
  return <div><PageHeader title="Languages" subtitle="Manage the text customers see in all 12 languages. English is the source language." action={<button disabled={busy} className="btn-gold" onClick={()=>{setAdding(true);setEditing({source:'',translation:'',revision:0});}}><Plus size={16}/>Add text</button>}/>
    <div className="mb-4 flex flex-wrap gap-2"><button disabled={busy} className="btn-gold-outline" onClick={()=>void run(()=>languagesAPI.sync(),'Storefront content registered')}><RefreshCw size={16}/>Refresh storefront content</button><button disabled={busy||loading||!!error} className="btn-gold-outline" onClick={exportFile}><Download size={16}/>Export</button><button disabled={busy} className="btn-gold-outline" onClick={()=>file.current?.click()}><Upload size={16}/>Import</button><input ref={file} type="file" accept=".json,application/json" className="hidden" aria-label="Import language file" onChange={readFile}/><button disabled={busy||loading||!!error||!data?.summary.drafts} className="btn-gold" onClick={()=>setPublishing(true)}>Publish drafts</button></div>
    <div className="mb-4 grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-[180px_1fr_auto]"><label className="grid gap-1 text-xs font-bold">Language<select aria-label="Language" disabled={busy} className={field} value={language} onChange={e=>{setLanguage(e.target.value);setPage(1);setData(null);}}>{languages.filter(l=>l.code!=='en').map(l=><option key={l.code} value={l.code}>{l.name} ({l.code.toUpperCase()})</option>)}</select></label><label className="grid gap-1 text-xs font-bold">Search text or page<input className={field} value={q} placeholder="Search English text, translation or page" onChange={e=>setQ(e.target.value)}/></label><label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={missing} onChange={e=>{setMissing(e.target.checked);setPage(1);}}/>Missing translations only</label></div>
    {data&&<div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">{[['Source strings',data.summary.total],['Published',data.summary.published],['Missing',data.summary.missing],['Unpublished drafts',data.summary.drafts]].map(([label,value])=><div key={label} className="rounded-xl border border-border bg-card p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="text-xl font-black">{value}</p></div>)}</div>}
    <p className="mb-4 text-sm text-muted-foreground">Save edits as drafts, then publish after review. Missing text stays in English. Use Refresh storefront content to include new FAQs, banners, delivery descriptions and lucky picks. Translations are plain text; keep named placeholders such as {'{count}'} unchanged.</p>
    {loading?<Loader/>:error?<div role="alert" className="rounded-xl border border-border p-4">{error}<button className="btn-gold-outline ml-2" onClick={load}>Retry</button></div>:!data?.items.length?<EmptyState title="No matching text" subtitle="Change the search or add a source string."/>:<Table head={['English source','Translation','Status','Actions']}>{data.items.map(row=><tr key={row.source_hash} className="border-b"><td className="min-w-52 max-w-sm"><p className="line-clamp-3 whitespace-pre-wrap break-words">{row.source}</p><p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{row.context}</p></td><td className="min-w-48 max-w-sm"><p className="line-clamp-3 whitespace-pre-wrap break-words">{row.translation||'—'}</p></td><td>{row.translation!==(row.published_text||'')?'Draft':row.published_text?'Published':'Missing'}</td><td><button disabled={busy} className="font-bold text-primary" onClick={()=>{setAdding(false);setEditing({...row});}}>Edit</button></td></tr>)}</Table>}
    {data&&!error&&<div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm"><label className="flex items-center gap-2">Rows per page<select className={field} aria-label="Rows per page" value={limit} onChange={e=>{setLimit(Number(e.target.value));setPage(1);}}>{[10,25,50,100].map(n=><option key={n}>{n}</option>)}</select></label><span>Page {page} of {Math.max(1,Math.ceil(data.total/limit))} · {data.total} results</span><div className="flex gap-2"><button className="btn-gold-outline" disabled={loading||page===1} onClick={()=>setPage(p=>p-1)}>Previous</button><button className="btn-gold-outline" disabled={loading||page*limit>=data.total} onClick={()=>setPage(p=>p+1)}>Next</button></div></div>}
    <Modal open={!!editing} onClose={()=>{if(!busy)setEditing(null);}} title={adding?'Add translated text':`Edit ${name} translation`} wide>{editing&&<form className="grid gap-4" onSubmit={e=>{e.preventDefault();void run(()=>languagesAPI.save(language,editing),'Translation draft saved');}}><label className="grid gap-1 text-sm font-bold">English source<textarea aria-label="English source" required readOnly={!adding} maxLength={32000} rows={5} className={field} value={editing.source} onChange={e=>setEditing({...editing,source:e.target.value})}/></label><label className="grid gap-1 text-sm font-bold">Translation<textarea aria-label="Translation" maxLength={32000} rows={7} className={field} value={editing.translation} onChange={e=>setEditing({...editing,translation:e.target.value})}/></label><p className="text-xs text-muted-foreground">An empty draft removes the published override when published. The bundled translation or English source will appear instead.</p><button disabled={busy} className="btn-gold">{busy?'Saving…':'Save draft'}</button></form>}</Modal>
    <Modal open={!!imported} onClose={()=>{if(!busy)setImported(null);}} title="Import translation drafts"><p className="mb-3 text-sm">Import {imported?.entries.length} entries for {name}? This replaces matching drafts. Published text stays unchanged until you publish.</p><div className="mb-4 max-h-56 overflow-y-auto rounded-xl border p-3 text-xs">{imported?.entries.slice(0,6).map((entry,i)=><p key={i} className="mb-2 break-words"><b>{entry.source}</b><br/>{entry.translation||'(empty draft)'}</p>)}</div><button disabled={busy} className="btn-gold" onClick={()=>imported&&void run(()=>languagesAPI.import(imported),'Language drafts imported')}>Confirm import</button></Modal>
    <Modal open={publishing} onClose={()=>{if(!busy)setPublishing(false);}} title="Publish language drafts"><p className="mb-4 text-sm">Publish the current {name} drafts for customers? {data?.summary.missing} source strings currently have no published translation. Missing strings retain English until a translation is supplied.</p><button disabled={busy} className="btn-gold" onClick={()=>data&&void run(()=>languagesAPI.publish(language,data.version),'Language drafts published')}>Confirm publish</button></Modal>
  </div>;
}
