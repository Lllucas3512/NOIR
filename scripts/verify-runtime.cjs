const fs=require('fs'),vm=require('vm'),assert=require('assert');
const native=require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const root='/workspace/sites/noir-tattoo/dist/';
const nodes=new Map(),groups=new Map(),frames=[];
function decorate(el,key){el.style={};el.events={};el.value='';el.selectedIndex=0;el.offsetTop=0;el.offsetHeight=key==='.hero-track'?5000:1000;el.classList={toggle(){},remove(){},add(){}};el.setAttribute=()=>{};el.addEventListener=(e,cb)=>{(el.events[e]??=[]).push(cb)};el.fire=(event,data={})=>{for(const cb of el.events[event]||[])cb(data)};el.getBoundingClientRect=()=>({width:900,top:0});el.setPointerCapture=()=>{};el.cloneNode=()=>decorate(native.createCanvas(900,900),key);el.replaceWith=n=>nodes.set(key,n);el.scrollIntoView=()=>{};el.textContent='';el.click=()=>{};if(el.getContext){const get=el.getContext.bind(el);el.getContext=(type,...args)=>type==='webgl'?null:get(type,...args)}return el}
function node(key){if(!nodes.has(key)){const el=key==='#preview'||key==='#ink'?native.createCanvas(key==='#ink'?1672:900,key==='#ink'?941:900):{};nodes.set(key,decorate(el,key))}return nodes.get(key)}
for(const [k,v]of Object.entries({size:100,rotation:0,opacity:78,threshold:80,region:'Antebraço'}))node('#'+k).value=v;
groups.set('.stages span',Array.from({length:7},(_,i)=>node('stage'+i)));
groups.set('[data-art]',['blackwork','botanical','moon','ornament'].map(type=>{const n=node(type);n.dataset={art:type};return n}));
class Image extends native.Image{set src(v){super.src=v.startsWith('assets/')?root+v:v}get src(){return super.src}}
const env={console,Path2D:native.Path2D,Image,document:{querySelector:node,querySelectorAll:s=>groups.get(s)||[],createElement:t=>t==='canvas'?decorate(native.createCanvas(1,1),'new'):decorate({},'new')},fetch:async url=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(root+url))}),matchMedia:()=>({matches:false,addEventListener(){}}),addEventListener(){},removeEventListener(){},requestAnimationFrame:fn=>{frames.push(fn);return frames.length},scrollY:0,innerHeight:1000,setTimeout,clearTimeout,URL,Blob,FormData:class{}};
env.document.head={appendChild(script){setTimeout(()=>{try{vm.runInContext(fs.readFileSync(root+script.src,'utf8'),env);script.onload()}catch(e){console.error(e);script.onerror()}},0)}};
vm.createContext(env);vm.runInContext(fs.readFileSync(root+'hero-painter.js','utf8'),env);vm.runInContext(fs.readFileSync(root+'app.js','utf8'),env);
const run=code=>vm.runInContext(code,env),flush=()=>{while(frames.length){const f=frames.shift();f()}};
(async()=>{
 for(let attempt=0;attempt<100&&!run("!!heroPainter && typeof body!=='undefined' && !!body && !!tattoo");attempt++)await new Promise(resolve=>setTimeout(resolve,50));flush();assert(run("!!heroPainter && typeof body!=='undefined' && !!body && !!tattoo"),'assets not initialized');
 // Thousands of pointer events schedule exactly one render, without image reprocessing.
 let drawCount=0;const original=run('painter');const draw=original.draw.bind(original);original.draw=s=>{drawCount++;draw(s)};
 const canvas=node('#preview');canvas.fire('pointerdown',{clientX:468,clientY:354,pointerId:1});
 for(let i=0;i<1000;i++)canvas.fire('pointermove',{clientX:468+Math.sin(i/10)*300,clientY:354+Math.cos(i/10)*150});assert.equal(frames.length,1);flush();assert.equal(drawCount,1);canvas.fire('pointerup');assert.equal(canvas.events.pointermove.length,1);
 for(const id of ['size','rotation','opacity']){node('#'+id).value=({size:180,rotation:50,opacity:65})[id];node('#'+id).fire('input')}assert.equal(frames.length,1);flush();assert.equal(run('state.size'),180);
 // Actual upload processing uses a real bitmap with white background; PNG data then becomes cached ink.
 run("rawUpload=makeCanvas(200,250);const uploadCtx=rawUpload.getContext('2d');uploadCtx.fillStyle='#fff';uploadCtx.fillRect(0,0,200,250);uploadCtx.fillStyle='#111';uploadCtx.fillRect(70,40,60,170);rawPixels=uploadCtx.getImageData(0,0,200,250).data;processUpload()");flush();assert(run('tattoo.width<100 && tattoo.height>150'),'upload background not removed/trimmed');
 for(let i=0;i<7;i++){node('#region').selectedIndex=i;node('#region').fire('change');for(let n=0;n<100&&run('regionLoading');n++)await new Promise(resolve=>setTimeout(resolve,25));flush();assert.equal(run('painter.region'),i)}
 node('#reset').onclick();flush();assert.equal(run('state.size'),100);node('#use-design').onclick();assert(run("capturedPreview.startsWith('data:image/jpeg')"));
 // Scroll is reversible at every checkpoint. Pixel hashes must exactly match forward/backward results.
 const checkpoints=[0,.12,.2,.35,.5,.65,.82,.9,.97,1],hashes=new Map(),crypto=require('crypto');const hash=()=>crypto.createHash('sha256').update(node('#ink').toBuffer('image/png')).digest('hex');
 for(const p of checkpoints){env.scrollY=p*3056;run('updateHero()');hashes.set(p,hash())}
 for(const p of [...checkpoints].reverse()){env.scrollY=p*3056;run('updateHero()');assert.equal(hash(),hashes.get(p),'non-deterministic reverse')}
 env.scrollY=3056;run('updateHero()');const completeHash=hash();for(const y of [3056,3156,3500,3800,3856]){env.scrollY=y;run('updateHero()');assert.equal(hash(),completeHash);assert.equal(Number(node('.fade-black').style.opacity),0)}env.scrollY=3928;run('updateHero()');assert(Math.abs(Number(node('.fade-black').style.opacity)-.5)<1e-6);env.scrollY=3200;run('updateHero()');assert.equal(Number(node('.fade-black').style.opacity),0);env.scrollY=0;run('updateHero()');assert.equal(node('#ink').getContext('2d').getImageData(0,0,1672,941).data.some((v,i)=>i%4===3&&v>0),false,'initial frame not clean');
 console.log('PASS: runtime initialization, single RAF under 1000 pointer events, all controls, cached upload/background processing, 7 regions, briefing snapshot, 10 forward/reverse pixel-identical hero frames, clean initial frame, 80vh hold with no fade, reversible transition.');
})();
