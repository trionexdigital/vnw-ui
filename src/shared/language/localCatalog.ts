export type Catalog = Record<string,string>;
const normalize = (s:string) => s.replace(/\s+/g,' ').trim().toLowerCase();
const loaders:Record<string,()=>Promise<{default:Catalog}>>={
  hi:()=>import('./hi.json'),mr:()=>import('./mr.json'),hg:()=>import('./hg.json'),gu:()=>import('./gu.json'),bn:()=>import('./bn.json'),pa:()=>import('./pa.json'),ta:()=>import('./ta.json'),te:()=>import('./te.json'),kn:()=>import('./kn.json'),ml:()=>import('./ml.json'),or:()=>import('./or.json'),
};
export async function loadLocalCatalog(language:string):Promise<Catalog> { return loaders[language] ? (await loaders[language]()).default : {}; }
export function mergeCatalog(base:Catalog,overrides:unknown):Catalog {
  const entries=new Map(Object.entries(base).map(([source,target])=>[normalize(source),{source,target}]));
  if(overrides && typeof overrides==='object' && !Array.isArray(overrides)) for(const [source,target] of Object.entries(overrides)) {
    if(source.length<=32000 && typeof target==='string' && target.trim() && target.length<=32000) entries.set(normalize(source),{source,target});
  }
  return Object.fromEntries([...entries.values()].map(v=>[v.source,v.target]));
}
/** Exact text and named templates; number values are inserted verbatim, never translated. */
export function catalogResolver(catalog:Catalog) {
  const exact=new Map(Object.entries(catalog).map(([source,target])=>[normalize(source),target]));
  const templates=Object.entries(catalog).filter(([s])=>/\{[a-zA-Z]\w*\}/.test(s)).map(([source,target])=>{
    const names:string[]=[];
    const pattern=source.replace(/\{[a-zA-Z]\w*\}|[^{}]+|[{}]/g,part=>{
      if(/^\{[a-zA-Z]\w*\}$/.test(part)) { names.push(part.slice(1,-1)); return '([\\d₹$€,.:%/+−-]+)'; }
      return part.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/\s+/g,'\\s+');
    });
    return {names,target,pattern:new RegExp('^'+pattern+'$','i')};
  });
  return (source:string) => {
    const found=exact.get(normalize(source)); if(found!==undefined) return found;
    for(const template of templates) {
      const match=source.trim().match(template.pattern);if(!match) continue;
      const values=new Map(template.names.map((name,i)=>[name,match[i+1]]));
      // Repeated named variables must represent the same value.
      if(template.names.some((name,i)=>values.get(name)!==match[i+1])) continue;
      return template.target.replace(/\{([a-zA-Z]\w*)\}/g,(token,name)=>values.get(name)??token);
    }
    return source; // Explicit missing translations keep the source; the admin editor reports coverage.
  };
}
