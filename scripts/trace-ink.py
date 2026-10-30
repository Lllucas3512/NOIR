# Extract line contours for the scroll timeline from the master artwork.
# The original transparent artwork is retained verbatim for the final ink layer.
from PIL import Image
from scipy import ndimage
import numpy as np,json,math
from pathlib import Path
root=Path(__file__).resolve().parents[1]
im=Image.open(root/'dist/assets/blackwork-master.png').resize((512,768),Image.Resampling.LANCZOS)
a=np.array(im)[:,:,3]
rgba=np.array(im).astype(float)
density=rgba[:,:,3]*(1-rgba[:,:,:3].mean(axis=2)/255)
ridge=density-ndimage.gaussian_filter(density,1.5)
binary=(ridge>12)&(density>45)
# Trace grid boundaries of ink, preserving the irregular engraved linework.
edges={}
def edge(s,t):edges.setdefault(s,[]).append(t)
for y,x in zip(*np.where(binary)):
 if y==0 or not binary[y-1,x]:edge((x,y),(x+1,y))
 if x==511 or not binary[y,x+1]:edge((x+1,y),(x+1,y+1))
 if y==767 or not binary[y+1,x]:edge((x+1,y+1),(x,y+1))
 if x==0 or not binary[y,x-1]:edge((x,y+1),(x,y))
loops=[]
while edges:
 start=next(iter(edges));p=start;points=[p]
 for _ in range(100000):
  if p not in edges:break
  nxt=edges[p].pop()
  if not edges[p]:del edges[p]
  p=nxt;points.append(p)
  if p==start:break
 if len(points)>12:loops.append(points)
def simplify(p,eps=.65):
 if len(p)<3:return p
 ax,ay=p[0];bx,by=p[-1];dx=bx-ax;dy=by-ay
 ds=[abs(dy*x-dx*y+bx*ay-by*ax)/(math.hypot(dx,dy) or 1) if dx or dy else math.hypot(x-ax,y-ay) for x,y in p]
 i=max(range(len(ds)),key=ds.__getitem__)
 if ds[i]<=eps:return [p[0],p[-1]]
 return simplify(p[:i+1],eps)[:-1]+simplify(p[i:],eps)
result=[]
for pts in loops:
 pts=simplify(pts)
 length=sum(math.dist(pts[i-1],pts[i]) for i in range(1,len(pts)))
 if length<9:continue
 result.append({'points':[[int(x*2),int(y*2)] for x,y in pts],'length':round(length*2,1)})
result.sort(key=lambda p:p['length'],reverse=True)
# Longer connected contours establish portrait and foliage first; smaller engraving follows.
for i,p in enumerate(result):p['group']=0 if i<65 else 1 if i<230 else 2
(root/'dist/assets/ink-lines.json').write_text(json.dumps(result[:1800],separators=(',',':')))
print(len(result[:1800]),'engraved contours extracted')
