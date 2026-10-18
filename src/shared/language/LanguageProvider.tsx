import { useLayoutEffect, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { Languages } from 'lucide-react';
import { useAppSelector } from '@/app/hooks';
import { BASE_URL } from '@/core/api/baseURL';
import Modal from '@/shared/components/Modal';
import { BrandLockup } from '@/shared/components/Logo';
import { Methods } from '@/core/services/methods';
import { LanguageContext, interpolate, useLanguage, type MessageValues } from './LanguageContext';
export { useLanguage } from './LanguageContext';
import { catalogResolver, loadLocalCatalog, mergeCatalog, type Catalog } from './localCatalog';

export const languages = [
  { code:'en', name:'English' }, { code:'hi', name:'हिंदी' }, { code:'mr', name:'मराठी' }, { code:'hg', name:'Hinglish' },
  { code:'gu', name:'ગુજરાતી' }, { code:'bn', name:'বাংলা' }, { code:'pa', name:'ਪੰਜਾਬੀ' }, { code:'ta', name:'தமிழ்' },
  { code:'te', name:'తెలుగు' }, { code:'kn', name:'ಕನ್ನಡ' }, { code:'ml', name:'മലയാളം' }, { code:'or', name:'ଓଡ଼ିଆ' },
];
const valid = (code: string | null) => languages.some(l => l.code === code);
const saved = () => { try { return localStorage.getItem('vnw_language'); } catch { return null; } };
export function LanguageButton({ compact=false, iconOnly=false }: { compact?:boolean; iconOnly?:boolean }) {
  const {language,openChooser}=useLanguage();
  return <button type="button" translate="no" aria-label="Choose language" title={languages.find(l=>l.code===language)?.name} onClick={openChooser} className={`public-language-button vnw-interactive inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card px-2 text-xs font-bold text-foreground shadow-sm ${compact?'is-compact':''} ${iconOnly?'is-icon-only':''}`}><Languages aria-hidden="true" className="h-4 w-4 shrink-0"/>{!iconOnly && <span>{languages.find(l=>l.code===language)?.name}</span>}</button>;
}
export default function LanguageProvider({children}:{children:ReactNode}) {
  const location=useLocation(), [params,setParams]=useSearchParams();
  const user=useAppSelector(s=>s.auth.user);
  const consoleRoute=/^\/(admin|dealer|employee)(\/|$)/.test(location.pathname) || (user?.role==='ADMIN' && ['/account','/change-password','/notifications','/orders','/dashboard'].some(p=>location.pathname===p || location.pathname.startsWith(p+'/')));
  const query=params.get('lang');
  const [language,setLanguage]=useState(()=>valid(query)?query!:valid(saved())?saved()!:'en');
  const [open,setOpen]=useState(()=>!consoleRoute && !valid(query) && !valid(saved()));
  const [catalog,setCatalog]=useState<{language:string;entries:Catalog}>({language:'en',entries:{}});
  const resolve=useMemo(()=>catalogResolver(catalog.entries),[catalog]);
  const t=useMemo(()=>(source:string,values?:MessageValues)=>interpolate(consoleRoute || language==='en' || catalog.language!==language ? source : source.replace(source.trim(),resolve(source.trim())),values),[consoleRoute,language,catalog.language,resolve]);
  useEffect(()=>{ if(valid(query)) {setLanguage(query!);try{localStorage.setItem('vnw_language',query!);}catch{}} },[query]);
  useLayoutEffect(()=>{
    document.documentElement.lang=consoleRoute?'en':language==='hg'?'hi-Latn':language;
    // Browser auto-translation must not rewrite React's DOM alongside our own catalogs.
    document.documentElement.setAttribute('translate','no');
  },[language,consoleRoute]);
  useEffect(()=>{
    if(consoleRoute || language==='en') return;
    let stopped=false,base:Catalog={},request=0;
    const controller=new AbortController();
    const install=(catalog:Catalog)=>{
      if(stopped) return;
      setCatalog({language,entries:catalog});
    };
    const refresh=async()=>{
      const id=++request;
      try {
        const response=await fetch(BASE_URL+'site/languages/catalog',{method:'POST',headers:{'Content-Type':'application/json',Authorization:new Methods().getAuthKey()},body:JSON.stringify({language}),signal:controller.signal});
        if(!response.ok) return;
        const result=await response.json();
        if(!stopped && id===request && response.ok && result.status===1 && result.data?.language===language) {
          const merged=mergeCatalog(base,result.data.translations);
          install(merged);
        }
      } catch { /* Local language packs work when the app API is temporarily offline. */ }
    };
    void loadLocalCatalog(language).then(catalog=>{if(!stopped){base=catalog;install(catalog);void refresh();}}).catch(()=>{});
    const onFocus=()=>{void refresh();};window.addEventListener('focus',onFocus);
    return ()=>{stopped=true;controller.abort();window.removeEventListener('focus',onFocus);};
  },[language,consoleRoute]);
  const choose=(code:string)=>{setLanguage(code);setOpen(false);try{localStorage.setItem('vnw_language',code);}catch{}const next=new URLSearchParams(params);next.set('lang',code);setParams(next,{replace:true});};
  return <LanguageContext.Provider value={{language,openChooser:()=>setOpen(true),t}}>
    {children}
    {!consoleRoute && (location.pathname==='/login'||location.pathname==='/register'||/^\/(account|orders|dashboard|referrals|sell|change-password|notifications)(\/|$)/.test(location.pathname)) && <div className="fixed bottom-20 right-3 z-50"><LanguageButton /></div>}
    {!consoleRoute && open && <Modal open onClose={()=>choose(language)} title="Choose your language" wide><div translate="no" data-no-translate>
      <div className="mb-4 flex justify-center"><BrandLockup /></div><p className="mb-4 text-center text-sm text-muted-foreground">You can change your language anytime using the language button.</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{languages.map(l=><button type="button" key={l.code} onClick={()=>choose(l.code)} aria-pressed={language===l.code} className="min-h-16 rounded-xl border border-border bg-muted/30 px-2 py-3 text-center font-bold text-foreground transition hover:border-primary hover:bg-primary/10"><span className="block text-base">{l.name}</span><span className="mt-1 block text-[10px] text-muted-foreground">{l.code.toUpperCase()}</span></button>)}</div>
    </div></Modal>}
  </LanguageContext.Provider>;
}
