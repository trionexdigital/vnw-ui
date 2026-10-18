import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sources=JSON.parse(fs.readFileSync(path.join(root,'../vnw-server/src/server/pixels/api/site/languageSources.json'),'utf8'));
const norm=s=>s.replace(/\s+/g,' ').trim().toLowerCase();
const codes=['hi','mr','hg','gu','bn','pa','ta','te','kn','ml','or'];
const report={};
for(const code of codes){
  const catalog=JSON.parse(fs.readFileSync(path.join(root,`src/shared/language/${code}.json`),'utf8'));
  const keys=new Set(Object.keys(catalog).map(norm));
  report[code]=sources.filter(row=>!keys.has(norm(row.source)));
  console.log(`${code}: ${keys.size} translated keys; ${report[code].length} registered source entries need review.`);
}
fs.mkdirSync(path.join(root,'../output'),{recursive:true});
fs.writeFileSync(path.join(root,'../output/language-coverage.json'),JSON.stringify(report,null,2)+'\n');
if(process.argv.includes('--strict') && Object.values(report).some(rows=>rows.length))process.exitCode=1;
