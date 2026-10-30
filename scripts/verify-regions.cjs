// Native Canvas visual and geometry regression checks; browser/GPU performance is a separate check.
const fs=require('fs'),assert=require('assert'),path=require('path');
const {createCanvas,loadImage,Path2D}=require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');global.Path2D=Path2D;
const root=path.resolve(__dirname,'..');require(root+'/dist/ink-engine.js');
(async()=>{
 const ink=await loadImage(root+'/dist/assets/blackwork-master.png'),out=createCanvas(1800,7*500),oc=out.getContext('2d'),canvas=createCanvas(900,900),painter=new NoirInk.MeshPainter(canvas,createCanvas);
 painter.setInk(ink);let count=0;const results=[];
 for(let index=0;index<7;index++){
 const r=NoirInk.REGIONS[index],body=await loadImage(root+'/dist/'+r.src);painter.setBody(body,index);const x=NoirInk.profile(r,r.home[1]),base=painter.base.getContext('2d').getImageData(0,0,900,900).data,mask=painter.coverage.getContext('2d').getImageData(0,0,900,900).data;
 const cases=[{side:0,size:45,rotation:0,opacity:55},{side:0,size:100,rotation:0,opacity:78},{side:-.97,size:200,rotation:32,opacity:90},{side:.97,size:200,rotation:-32,opacity:65},{side:-.96,size:100,rotation:-90,opacity:55},{side:.96,size:45,rotation:90,opacity:90},{side:0,size:200,rotation:0,opacity:78}];
 for(let k=0;k<cases.length;k++){
 const c=cases[k],state={x:x.c+x.r*c.side,y:r.home[1],...c};painter.draw(state);const pixels=canvas.getContext('2d').getImageData(0,0,900,900).data;let leak=0,changed=0;
 for(let i=0;i<pixels.length;i+=4){const delta=Math.max(Math.abs(pixels[i]-base[i]),Math.abs(pixels[i+1]-base[i+1]),Math.abs(pixels[i+2]-base[i+2]));if(delta>2){changed++;if(mask[i+3]===0)leak++}}
 assert.equal(leak,0,r.name+' leaked outside anatomy');assert(changed>0,r.name+' invisible in case '+k);
 const t=NoirInk.placement(r,state,ink.width/ink.height);for(let v=0;v<=1;v+=.1)for(let u=0;u<=1;u+=.1){const p=NoirInk.project(r,t,u,v);assert(Number.isFinite(p.x)&&Number.isFinite(p.y))}
 if([0,1,2,3].includes(k)){oc.drawImage(canvas,k*450,index*500,450,450);oc.fillStyle='#111';oc.fillRect(k*450,index*500+450,450,50);oc.fillStyle='#eee';oc.font='17px Arial';oc.fillText(r.name+' · '+c.size+'% · '+c.rotation+'°',k*450+16,index*500+480)}
 count++;
 }
 // Center width compresses near the horizon instead of remaining a flat decal.
 const middle=NoirInk.placement(r,{x:x.c,y:r.home[1],size:30,rotation:0,opacity:80},.6),side=NoirInk.placement(r,{x:x.c+x.r*.9,y:r.home[1],size:30,rotation:0,opacity:80},.6);
 const span=t=>Math.abs(NoirInk.project(r,t,.55,.5).x-NoirInk.project(r,t,.45,.5).x);assert(span(side)<span(middle));results.push({region:r.name,cases:cases.length,anatomicalLeakPixels:0,sideCompression: +(span(side)/span(middle)).toFixed(3)});
 }
 fs.writeFileSync(root+'/review/seven-regions.png',out.toBuffer('image/png'));fs.writeFileSync(root+'/review/seven-regions-checks.json',JSON.stringify(results,null,2));console.log('PASS: '+count+' native visual scenarios across all 7 regions. No pixels leaked outside coverage. All regions compress near their lateral horizon.');
})();
