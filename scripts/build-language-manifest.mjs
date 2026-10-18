import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const normalize = s => s.replace(/\s+/g, ' ').trim();
const sources = new Map();
function add(value, context, visible=false) {
  const entities={amp:'&',apos:"'",quot:'"',lt:'<',gt:'>',nbsp:' '};
  const text = normalize(value.replace(/&(#x[\da-f]+|#\d+|amp|apos|quot|lt|gt|nbsp);/gi,(whole,key)=>key.startsWith('#')?String.fromCodePoint(parseInt(key.slice(key[1]==='x'?2:1),key[1]==='x'?16:10)):entities[key]||whole));
  if (!/[a-zA-Z]{2}/.test(text) || text.length < 2 || text.length > 32000 || /^(https?:|\/|@|[.#])/.test(text) || !visible && /^[-\w]+(?:\/[-\w]+)*$/.test(text) && !/^[A-Z][a-z]/.test(text) || /(?:flex|rounded|padding|grid|border|text|font|bg|gap|width|height|space|shadow|overflow)-/.test(text) || (!visible && /^[A-Z_]+$/.test(text)) || /^[\w.+-]+@[\w.-]+\.[a-z]+$/.test(text)) return;
  const contexts = sources.get(text) || new Set(); contexts.add(context); sources.set(text, contexts);
}
function walk(dir) {
  for (const item of fs.readdirSync(dir, {withFileTypes:true})) {
    const file = path.join(dir,item.name);
    if(item.isDirectory()) { if(!['admin','dealer','employee','language'].includes(item.name)) walk(file); continue; }
    if(!/\.tsx?$/.test(file)) continue;
    const context = path.relative(path.join(root,'src'),file).replaceAll('\\','/');
    const ast = ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,file.endsWith('tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
    function visit(node) {
      if(ts.isJsxText(node)) add(node.text,context,true);
      if(ts.isStringLiteral(node)||ts.isNoSubstitutionTemplateLiteral(node)) {
        const parent=node.parent;
        // Ignore implementation identifiers and attributes, including conditional className values.
        for(let owner=parent;owner && !ts.isStatement(owner);owner=owner.parent) {
          if(ts.isJsxAttribute(owner) && !['source','title','subtitle','label','description','text','message','heading','placeholder','aria-label','alt','data-label'].includes(owner.name.getText(ast))) return;
          if(ts.isPropertyAssignment(owner) && ['className','icon','href','to','value','id','slug','key','src','image','image_url','imageSrc','role','permission','permissions','queryKey'].includes(owner.name.getText(ast).replace(/['"]/g,''))) return;
        }
        if(/^[A-Z][a-z]+[A-Z]\w*$/.test(node.text) && !ts.isJsxAttribute(parent)) return;
        if(/^\([^)]*(?:width|height|motion)[^)]*\)$/.test(node.text)||/^:(?:focus|hover|active|nth|not)/.test(node.text)) return;
        if(ts.isJsxAttribute(parent) && !['source','title','subtitle','label','description','text','message','heading','placeholder','aria-label','alt','data-label'].includes(parent.name.getText(ast))) return;
        if(ts.isImportDeclaration(parent)||ts.isExportDeclaration(parent)) return;
        add(node.text,context,ts.isJsxAttribute(parent));
      }
      ts.forEachChild(node,visit);
    }
    visit(ast);
  }
}
for(const dir of ['pages','shared','core/categories','core/numbers']) { const location=path.join(root,'src',dir); if(fs.existsSync(location)) walk(location); }
// The API owns canonical public category labels; register those editorial strings too.
const taxonomy=path.join(root,'../vnw-server/src/server/pixels/api/categories/internalCategoryTaxonomy.ts');
if(fs.existsSync(taxonomy)) {
  const ast=ts.createSourceFile(taxonomy,fs.readFileSync(taxonomy,'utf8'),ts.ScriptTarget.Latest,true);
  const visit=node=>{
    if(ts.isPropertyAssignment(node) && node.name.getText(ast)==='name' && ts.isStringLiteral(node.initializer)) {
      const label=node.initializer.text;
      if(!/^[\dA-Ea-exXyYzZ\s.*+/?()_-]+$/.test(label))add(label,'API/category taxonomy',true);
    }
    ts.forEachChild(node,visit);
  };visit(ast);
}
const result=[...sources].sort(([a],[b])=>a.localeCompare(b)).map(([source,contexts])=>({source,context:[...contexts].join(', ')}));
fs.writeFileSync(path.join(root,'../vnw-server/src/server/pixels/api/site/languageSources.json'),JSON.stringify(result,null,2)+'\n');
console.log(`Registered ${result.length} public source strings for the language editor.`);
