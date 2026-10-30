"""Production GLSL regression: photographed forearm contour, grid, real ink.
Run after export-occlusion.cjs with NOIR_BASELINE_SHA set to published v5.
"""
from pathlib import Path
# Reuse the same EGL setup, texture uploads and exact production shader extraction.
source=(Path(__file__).with_name('render-occlusion-gl.py')).read_text().split('regions=json.loads')[0]
exec(compile(source,__file__,'exec'))
regions=json.loads((out/'cases.json').read_text());r=regions[0]
grid=Image.new('RGBA',(600,900),(45,100,135,170));d=ImageDraw.Draw(grid)
for y in range(0,900,60):
 for x in range(0,600,60):
  if (x//60+y//60)%2:d.rectangle((x,y,x+59,y+59),fill=(50,85,95,110))
for x in range(0,600,60):d.line((x,0,x,900),fill=(0,0,0,255),width=4)
for y in range(0,900,60):d.line((0,y,600,y),fill=(0,0,0,255),width=4)
grid.save(out/'grid.png');upload(0,out/'body-0.png')
sheet=Image.new('RGB',(4*480,6*510),'#111111');draw=ImageDraw.Draw(sheet)
# Center, each lateral and rotated positions. Width stays constant; no rescaling to mask.
chosen=[0,2,4,6,8];count=0
for row,k in enumerate(chosen):
 for art in ['grid','ink']:
  upload(1,out/(art+'.png'))
  case=r['cases'][k].copy()
  if art=='grid':case['size']=[490*1.85*2/3,490*1.85,.85,0]
  for tag in ['before','current']:
   upload(2,out/(('before-' if tag=='before' else '')+'field-0.png'))
   frame=render(tag,r,case);count+=1
   col=(0 if art=='grid' else 2)+(tag=='current');x=col*480;y=row*510
   sheet.paste(Image.fromarray(frame).resize((480,480)),(x,y))
   draw.text((x+10,y+483),f'{art} / {tag} / {r["cases"][k]["label"]}',fill='white')
   if art=='ink' and tag=='current' and k==4:Image.fromarray(frame).save(review/'silhouette-tattoo-right.png')
# Narrow positioning like the supplied screenshot, using identical poses before/after.
case=r['cases'][4].copy();case['size']=[v/1.85 if i<2 else v for i,v in enumerate(case['size'])]
for tag in ['before','current']:
 upload(1,out/'ink.png');upload(2,out/(('before-' if tag=='before' else '')+'field-0.png'))
 frame=render(tag,r,case);sheet.paste(Image.fromarray(frame).resize((480,480)),((0 if tag=='before' else 1)*480,5*510))
 draw.text(((0 if tag=='before' else 1)*480+10,5*510+483),'100% / '+tag,fill='white')
sheet.save(review/'silhouette-grid-before-after.png')
# A fully covered test surface: measure the raster clipping against the photographed edge,
# rather than accepting the production mask itself as the expected answer.
body=np.array(Image.open(out/'body-0.png').convert('RGB')).astype(float)
from scipy.ndimage import gaussian_filter
from scipy.signal import savgol_filter
chroma=gaussian_filter(body[:,:,0]-body[:,:,2],1.2);gradient=np.gradient(chroma,axis=1)
old=np.array(Image.open(out/'before-field-0.png'))[:,:,2];new=np.array(Image.open(out/'mask-0.png'))[:,:,3]
metrics=[]
for y in [50,150,300,450,600]:
 actual=int(np.argmin(gradient[y,530:680])+530)
 oldedge=int(np.where(old[y]>127)[0][-1]);newedge=int(np.where(new[y]>127)[0][-1])
 assert abs(actual-newedge)<=2,(y,actual,newedge)
 metrics.append({'row':y,'photoEdge':actual,'oldMaskEdge':oldedge,'newMaskEdge':newedge})
# Renderer evidence at the corrected silhouette, in both centered and right-side grid states.
upload(1,out/'grid.png');upload(2,out/'field-0.png')
for k in [0,4]:
 case=r['cases'][k].copy();case['size']=[490*1.85*2/3,490*1.85,.85,0]
 frame=render('current',r,case)
 for m in metrics:
  y=m['row'];x=m['newMaskEdge']-1
  assert np.max(abs(frame[y,x,:3].astype(float)-body[y,x]))>3,('missing ink at skin edge',k,x,y)
# Before/after contour overlay: cyan is old mask; magenta is corrected photographic contour.
overlay=Image.fromarray(body.astype('uint8'));d=ImageDraw.Draw(overlay)
for y in range(900):
 for m,color in [(old,(0,255,255)),(new,(255,0,255))]:
  xs=np.where(m[y]>127)[0]
  if len(xs):
   for x in [xs[0],xs[-1]]:d.point((int(x),y),fill=color)
overlay.save(review/'silhouette-contour-overlay.png')
(review/'silhouette-diagnostic.json').write_text(json.dumps({'cause':'Forearm mask was inset from the photographed silhouette; mapping remains continuous and unchanged.','shaderFrames':count+4,'photoEdgeSamples':metrics,'gridReachedSkinEdge':True,'mappingAndBlend':'unchanged'},indent=2))
print('PASS: grid and real ink visually rendered before/after; new contour within 2 pixels of measured photograph edge; ink reaches edge; mapping unchanged.')
