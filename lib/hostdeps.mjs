import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { homedir } from 'node:os'
import { fileURLToPath, pathToFileURL } from 'node:url'
const self = join(dirname(fileURLToPath(import.meta.url)), '..')
function roots() { const out=[]; const add=p=>{if(p&&!out.includes(p))out.push(p)}; const home=process.env.DSH_HOME||join(homedir(),'.dsh'); const profile=process.env.DSH_PROFILE_DIR; for(const p of [profile,join(home,'profiles','desktop')]) { if(!p) continue; add(p.endsWith('node_modules') ? join(p,'@deepseek-ai') : join(p,'node_modules','@deepseek-ai')) }; try{for(const p of readdirSync(join(home,'profiles'))) add(join(home,'profiles',p,'node_modules','@deepseek-ai'))}catch{}; return out }
function url(root,name){try{const pkg=JSON.parse(readFileSync(join(root,name,'package.json'),'utf8')); const rel=typeof pkg.exports?.['.']==='string'?pkg.exports['.']:(pkg.exports?.['.']?.import||pkg.module||pkg.main); const f=join(root,name,String(rel).replace(/^\.\//,'')); return existsSync(f)?pathToFileURL(f).href:null}catch{return null}}
export async function loadHostDeps(){ let z=null; for(const r of roots()){const u=url(r,'schemastery'); if(u)try{const mod=await import(u); z=mod.default||mod.Schema||mod; if(z)break}catch{}}; return {z} }
