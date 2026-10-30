const fs=require('fs'),vm=require('vm'),assert=require('assert'),{execFileSync}=require('child_process');
const root=require('path').resolve(__dirname,'..'),baseline='5ef48146e510dc73b732964d6cad4ccf5e041771';
let source=fs.readFileSync(__dirname+'/verify-runtime.cjs','utf8').split('(async()=>{')[0];
source=source.replace('vm.createContext(env);',"env.IntersectionObserver=class{observe(){}disconnect(){}};vm.createContext(env);");
const h=new Function('require',source+'\nreturn {run,flush,node,env};')(require);
const pause=ms=>new Promise(r=>setTimeout(r,ms));async function until(fn){for(let n=0;n<200;n++){if(fn())return;await pause(20)}throw Error('timeout')}
(async()=>{
 await until(()=>h.run('!!heroPainter'));h.flush();assert(h.run("typeof painter==='undefined'"));assert.equal(h.run('imageCache.size'),1);
 // Initial hero renderer and scroll constants are identical to the approved version.
 const old=execFileSync('git',['show',baseline+':dist/ink-engine.js'],{cwd:root,encoding:'utf8'}),current=fs.readFileSync(root+'/dist/ink-engine.js','utf8'),start=old.indexOf('class HeroPainter{'),end=old.indexOf('\n}',start)+2;
 assert(fs.readFileSync(root+'/dist/hero-painter.js','utf8').includes(old.slice(start,end)));
 assert.equal(current,(old.slice(0,start)+old.slice(end)).replace('surfaceField,HeroPainter,SurfacePainter','surfaceField,HeroPainter:root.NoirHeroPainter,SurfacePainter'));
 const native=require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');const oldEnv={Path2D:native.Path2D};vm.createContext(oldEnv);vm.runInContext(old,oldEnv);const canvas=native.createCanvas(1672,941),art=await native.loadImage(root+'/dist/assets/blackwork-master.png'),lines=JSON.parse(fs.readFileSync(root+'/dist/assets/ink-lines.json'));const painter=new oldEnv.NoirInk.HeroPainter(canvas,art,lines,native.createCanvas);
 for(const p of [0,.12,.2,.35,.5,.65,.82,.9,.97,1]){h.env.scrollY=p*3056;painter.draw(h.env.scrollY/h.run('heroBuild'));h.run('updateHero()');assert(canvas.toBuffer('image/png').equals(h.node('#ink').toBuffer('image/png')),'hero pixels changed at '+p)}
 // Deferred module requests are coalesced; a transport failure remains retryable.
 const append=h.env.document.head.appendChild;let attempts=0;h.env.document.head.appendChild=script=>{attempts++;script.remove=()=>{};setTimeout(()=>script.onerror(),0)};
 assert.equal(await h.run('ensureSimulator()'),false);assert.equal(h.node('.controls').inert,false);assert(h.run('simulatorTask===null'));
 h.env.document.head.appendChild=script=>{attempts++;append(script)};const first=h.run('ensureSimulator()'),second=h.run('ensureSimulator()');assert.equal(first,second);await first;await until(()=>h.run('!!body&&!!tattoo'));assert.equal(attempts,3);assert.equal(h.run('imageCache.size'),1);
 // Slow/unavailable ink never reports a completed tattoo. No scroll lock or fake progress.
 h.run('heroPainter=null;heroSettled=false');h.env.scrollY=1800;h.run('updateHero()');assert.equal(h.node('#progress').textContent,'PREPARANDO TRAÇOS…');assert.equal(h.env.scrollY,1800);h.run('heroSettled=true;updateHero()');assert.equal(h.node('#progress').textContent,'PRÉVIA INDISPONÍVEL');
 console.log('PASS: zero simulator initialization before approach; coalesced lazy loading and retry after failure; shared master decode; exact approved engine and 10 hero frames; truthful pending/error state without scroll reset.');
})().catch(e=>{console.error(e);process.exitCode=1});
