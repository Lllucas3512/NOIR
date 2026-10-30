/* Unchanged hero painter, split from the deferred simulator. */
(function(root){'use strict';const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
class HeroPainter{
 constructor(canvas,art,lines,makeCanvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.art=art;this.makeCanvas=makeCanvas;this.layers=[0,1,2].map(()=>[]);lines.forEach((line,i)=>{const pts=line.points,path=new Path2D();path.moveTo(...pts[0]);pts.slice(1).forEach(pt=>path.lineTo(...pt));this.layers[i<80?0:i<270?1:2].push({path,length:line.length})});this.mask=makeCanvas(1024,1536);this.fill=makeCanvas(1024,1536);this.last=-1;
 // Regions are separately painted; a deterministic stagger interleaves face and foliage.
 this.patches=[];for(let y=0;y<8;y++)for(let x=0;x<5;x++)this.patches.push({x:x*205,y:y*192,w:206,h:193,order:((x*13+y*7)%40)/40,reverse:(x+y)%2});
 }
 strokeGroup(group,p,start,end,width,color){const ctx=this.ctx,items=this.layers[group];ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';items.forEach((item,i)=>{const t=clamp((p-start-i/Math.max(1,items.length-1)*(end-start)*.78)/((end-start)*.22));if(!t)return;ctx.setLineDash([item.length]);ctx.lineDashOffset=item.length*(1-t);ctx.stroke(item.path)});ctx.setLineDash([])}
 draw(p){if(p===this.last)return;this.last=p;const ctx=this.ctx;ctx.clearRect(0,0,this.canvas.width,this.canvas.height);if(p<=.12)return;ctx.save();ctx.scale(this.canvas.width/1672,this.canvas.height/941);ctx.translate(1150,476);ctx.rotate(64*Math.PI/180);ctx.scale(.53,.74);ctx.translate(-512,-768);
 // Purple stencil is temporary. Final ink is built from traced paths, not an opacity reveal.
 if(p<.50){ctx.globalAlpha=.55*(1-clamp((p-.25)/.25));this.strokeGroup(0,p,.12,.25,2.1,'#675878');ctx.globalAlpha=1}
 const fillProgress=clamp((p-.82)/.18);ctx.globalAlpha=1-fillProgress*.68;
 this.strokeGroup(0,p,.25,.45,1.7,'#343931');this.strokeGroup(1,p,.45,.65,1.15,'#343931');this.strokeGroup(2,p,.65,.82,.85,'#3b4036');ctx.globalAlpha=1;
 if(p>.82){const m=this.mask.getContext('2d');m.clearRect(0,0,1024,1536);
 // Fine texture is laid before the dark passes; every patch follows its own brush route.
 const q=clamp((p-.82)/.18);
 for(const patch of this.patches){const t=clamp((q-patch.order*.66)/.34);if(!t)continue;m.save();m.beginPath();m.rect(patch.x,patch.y,patch.w,patch.h);m.clip();m.strokeStyle='#fff';m.lineWidth=25;m.lineCap='round';m.lineJoin='round';m.beginPath();const total=13*patch.h;let remaining=t*total;for(let line=0;line<13;line++){const bx=patch.x+line*18,from=(line+patch.reverse)%2?patch.y+patch.h:patch.y,to=(line+patch.reverse)%2?patch.y:patch.y+patch.h;if(remaining<=0)break;const fraction=Math.min(1,remaining/patch.h);m.moveTo(bx,from);m.lineTo(bx,to*fraction+from*(1-fraction));remaining-=patch.h}m.stroke();m.restore()}
 const f=this.fill.getContext('2d');f.clearRect(0,0,1024,1536);f.globalCompositeOperation='source-over';f.drawImage(this.art,0,0,1024,1536);f.globalCompositeOperation='destination-in';f.drawImage(this.mask,0,0);f.globalCompositeOperation='source-over';ctx.globalAlpha=.78;ctx.drawImage(this.fill,0,0);ctx.globalAlpha=1;
 }
 ctx.restore();
 }
}
root.NoirHeroPainter=HeroPainter;
})(globalThis);
