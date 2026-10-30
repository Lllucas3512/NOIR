from pathlib import Path
source=Path(__file__).with_name('render-occlusion-gl.py').read_text().split('regions=json.loads')[0]
exec(compile(source,__file__,'exec'))
regions=json.loads((out/'cases.json').read_text());grid=Image.new('RGBA',(600,900),(55,110,130,160));d=ImageDraw.Draw(grid)
for x in range(0,600,60):d.line((x,0,x,900),fill=(0,0,0,255),width=4)
for y in range(0,900,60):d.line((0,y,600,y),fill=(0,0,0,255),width=4)
grid.save(out/'grid.png');sheet=Image.new('RGB',(5*360,7*390),'#111111');draw=ImageDraw.Draw(sheet)
forearm=[]
for r in regions:
 i=r['index'];upload(0,out/f'body-{i}.png');upload(1,out/'ink.png')
 if i==0:
  for case in r['cases']:
   upload(2,out/'field-0.png');now=render('current',r,case)
   upload(2,out/'before-field-0.png');before=render('before',r,case)
   delta=int(np.abs(now.astype(int)-before.astype(int)).max());assert delta==0;forearm.append(delta)
 upload(1,out/'grid.png');upload(2,out/f'field-{i}.png')
 for col,k in enumerate([0,2,4,6,8]):
  case=r['cases'][k].copy();case['size']=[case['size'][1]*2/3,case['size'][1],.85,0]
  frame=render('current',r,case);sheet.paste(Image.fromarray(frame).resize((360,360)),(col*360,i*390));draw.text((col*360+6,i*390+365),r['name']+' / '+case['label'],fill='white')
sheet.save(review/'v7-grid-seven-regions.png')
# Independently selected photographic landmarks (left/right contour per row).
landmarks={1:[(300,146,647),(450,165,639),(600,181,617)],2:[(300,130,635),(450,73,659),(600,57,631)],3:[(300,145,724),(450,163,728),(600,199,726)],4:[(300,278,624),(450,314,605),(600,350,583)],5:[(200,98,837),(350,115,832),(500,169,791)],6:[(500,16,877),(650,57,832),(800,122,768)]}
metrics=[];overlay=Image.new('RGB',(1800,1200))
for i,land in landmarks.items():
 body=np.array(Image.open(out/f'body-{i}.png').convert('RGB'));mask=np.array(Image.open(out/f'mask-{i}.png'))[:,:,3];old=np.array(Image.open(out/f'before-field-{i}.png'))[:,:,2];r=regions[i];upload(0,out/f'body-{i}.png');upload(1,out/'grid.png');upload(2,out/f'field-{i}.png')
 # Broad surface probe spans both silhouettes, independently of tattoo's transparent perimeter.
 case={**r['cases'][0],'pose':[0,450,0,r['radius']],'size':[2400,1800,.85,0]};frame=render('current',r,case)
 for y,left,right in land:
  xs=np.where(mask[y]>127)[0];oldxs=np.where(old[y]>127)[0]
  for side,actual,x in [('left',left,int(xs[0])),('right',right,int(xs[-1]))]:
   assert abs(actual-x)<=2,(i,y,side,actual,x)
   sample=x+(1 if side=='left' else -1);assert np.max(abs(frame[y,sample,:3].astype(int)-body[y,sample].astype(int)))>3
   metrics.append({'region':r['name'],'row':y,'side':side,'photoEdge':actual,'newEdge':x,'oldEdge':int(oldxs[0] if side=='left' else oldxs[-1])})
 p=body.copy()
 for m,color in [(old,[0,255,255]),(mask,[255,0,255])]:
  edge=(m>127)&((np.roll(m,1,0)<=127)|(np.roll(m,-1,0)<=127)|(np.roll(m,1,1)<=127)|(np.roll(m,-1,1)<=127));p[edge]=color
 overlay.paste(Image.fromarray(p).resize((600,600)),(((i-1)%3)*600,((i-1)//3)*600))
overlay.save(review/'v7-contours-before-after.png')
(review/'v7-projection-checks.json').write_text(json.dumps({'forearmNineFramesMaxPixelDifference':forearm,'gridFrames':35,'skinEdgeProbeFrames':6,'photoLandmarks':metrics},indent=2))
print('PASS: 9 complete forearm images identical to v6; 35 grid renders; 36 photographed edge landmarks reached within 2px; 6 full silhouette probes reached skin.')
