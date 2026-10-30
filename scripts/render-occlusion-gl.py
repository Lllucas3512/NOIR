import ctypes as C,json,time,os,tempfile
from pathlib import Path
from PIL import Image,ImageDraw
import numpy as np
out=Path(os.environ.get('NOIR_OCCLUSION_QA',str(Path(tempfile.gettempdir())/'noir-occlusion-qa'))); review=Path(__file__).resolve().parents[1]/'review'
E=C.CDLL('libEGL.so.1');P=C.c_void_p;I=C.c_int;U=C.c_uint;F=C.c_float
E.eglGetProcAddress.argtypes=[C.c_char_p];E.eglGetProcAddress.restype=P
getDisplay=C.CFUNCTYPE(P,U,P,C.POINTER(I))(E.eglGetProcAddress(b'eglGetPlatformDisplayEXT'));display=getDisplay(0x31DD,None,None)
def egl(name,ret,args):fn=getattr(E,name);fn.restype=ret;fn.argtypes=args;return fn
assert egl('eglInitialize',U,[P,P,P])(display,None,None)
assert egl('eglBindAPI',U,[U])(0x30A0)
attrs=(I*15)(0x3033,1,0x3040,4,0x3024,8,0x3023,8,0x3022,8,0x3021,8,0x3038,0,0);config=P();count=I()
assert egl('eglChooseConfig',U,[P,P,P,I,P])(display,attrs,C.byref(config),1,C.byref(count)) and count.value
context=egl('eglCreateContext',P,[P,P,P,P])(display,config,None,(I*3)(0x3098,2,0x3038));assert context
surface=egl('eglCreatePbufferSurface',P,[P,P,P])(display,config,(I*5)(0x3057,900,0x3056,900,0x3038));assert surface
assert egl('eglMakeCurrent',U,[P,P,P,P])(display,surface,surface,context)
def gl(name,ret,args):address=E.eglGetProcAddress(name.encode());assert address,name;return C.CFUNCTYPE(ret,*args)(address)
createShader=gl('glCreateShader',U,[U]);shaderSource=gl('glShaderSource',None,[U,I,P,P]);compileShader=gl('glCompileShader',None,[U]);shaderiv=gl('glGetShaderiv',None,[U,U,P]);shaderLog=gl('glGetShaderInfoLog',None,[U,I,P,P]);createProgram=gl('glCreateProgram',U,[]);attachShader=gl('glAttachShader',None,[U,U]);linkProgram=gl('glLinkProgram',None,[U]);programiv=gl('glGetProgramiv',None,[U,U,P]);useProgram=gl('glUseProgram',None,[U]);genBuffers=gl('glGenBuffers',None,[I,P]);bindBuffer=gl('glBindBuffer',None,[U,U]);bufferData=gl('glBufferData',None,[U,C.c_ssize_t,P,U]);attribLocation=gl('glGetAttribLocation',I,[U,C.c_char_p]);enableAttrib=gl('glEnableVertexAttribArray',None,[U]);attribPointer=gl('glVertexAttribPointer',None,[U,I,U,U,I,P]);uniformLocation=gl('glGetUniformLocation',I,[U,C.c_char_p]);uniform1i=gl('glUniform1i',None,[I,I]);uniform1f=gl('glUniform1f',None,[I,F]);uniform2f=gl('glUniform2f',None,[I,F,F]);uniform3f=gl('glUniform3f',None,[I,F,F,F]);uniform4f=gl('glUniform4f',None,[I,F,F,F,F]);genTextures=gl('glGenTextures',None,[I,P]);activeTexture=gl('glActiveTexture',None,[U]);bindTexture=gl('glBindTexture',None,[U,U]);texParameter=gl('glTexParameteri',None,[U,U,I]);texImage=gl('glTexImage2D',None,[U,I,I,I,I,I,U,U,P]);viewport=gl('glViewport',None,[I,I,I,I]);drawArrays=gl('glDrawArrays',None,[U,I,I]);readPixels=gl('glReadPixels',None,[I,I,I,I,U,U,P]);getError=gl('glGetError',U,[]);getString=gl('glGetString',C.c_char_p,[U])
programs={}
for tag in ['current','before']:
 program=createProgram()
 for typ,ext in [(0x8B31,'vert'),(0x8B30,'frag')]:
  shader=createShader(typ);source=C.c_char_p((out/(tag+'.'+ext)).read_bytes());shaderSource(shader,1,C.byref(source),None);compileShader(shader);okay=I();shaderiv(shader,0x8B81,C.byref(okay))
  if not okay.value:buf=C.create_string_buffer(4096);shaderLog(shader,4096,None,buf);raise RuntimeError(buf.value.decode())
  attachShader(program,shader)
 linkProgram(program);okay=I();programiv(program,0x8B82,C.byref(okay));assert okay.value;programs[tag]=program
buffer=U();genBuffers(1,C.byref(buffer));bindBuffer(0x8892,buffer);vertices=(F*12)(-1,-1,1,-1,-1,1,-1,1,1,-1,1,1);bufferData(0x8892,C.sizeof(vertices),vertices,0x88E4)
textures=(U*3)();genTextures(3,textures)
for unit in range(3):
 activeTexture(0x84C0+unit);bindTexture(0x0DE1,textures[unit])
 for name,value in [(0x2801,0x2601),(0x2800,0x2601),(0x2802,0x812F),(0x2803,0x812F)]:texParameter(0x0DE1,name,value)
uniform3fv=gl('glUniform3fv',None,[I,I,P]);viewport(0,0,900,900)
def upload(unit,filename):
 image=np.array(Image.open(filename).convert('RGBA'));activeTexture(0x84C0+unit);bindTexture(0x0DE1,textures[unit]);texImage(0x0DE1,0,0x1908,image.shape[1],image.shape[0],0,0x1908,0x1401,image.ctypes.data)
upload(1,out/'ink.png')
def render(tag,region,case):
 program=programs[tag];useProgram(program);location=attribLocation(program,b'a_position');enableAttrib(location);attribPointer(location,2,0x1406,0,0,None)
 loc=lambda name:uniformLocation(program,name.encode())
 for i,name in enumerate(['u_body','u_ink','u_field']):uniform1i(loc(name),i)
 uniform4f(loc('u_pose'),*case['pose']);uniform4f(loc('u_size'),*case['size']);uniform1f(loc('u_curve'),region['curvature'])
 if loc('u_edge')>=0:
  rows=np.array(region['profile']+[region['profile'][-1]]*(9-len(region['profile'])),dtype=np.float32);uniform3fv(loc('u_rows[0]'),9,rows.ctypes.data);p=region['projection'];uniform2f(loc('u_edge'),p['knee'],p['slope']);uniform3f(loc('u_cap'),p['capY'],p['capRadius'],p['capBend'])
 drawArrays(4,0,6);pixels=np.zeros((900,900,4),dtype=np.uint8);readPixels(0,0,900,900,0x1908,0x1401,pixels.ctypes.data);error=getError();assert error==0,hex(error);return pixels[::-1].copy()
regions=json.loads((out/'cases.json').read_text());sheet=Image.new('RGB',(9*360,7*400),'#131313');labels=ImageDraw.Draw(sheet);stats=[];frames=0
for r in regions:
 index=r['index'];upload(0,out/f'body-{index}.png');upload(2,out/f'field-{index}.png');body=np.array(Image.open(out/f'body-{index}.png').convert('RGBA'));mask=np.array(Image.open(out/f'mask-{index}.png').convert('RGBA'))[:,:,3];field=np.array(Image.open(out/f'field-{index}.png').convert('RGBA'));center=r['cases'][0];now=None
 for k,case in enumerate(r['cases']):
  frame=render('current',r,case);frames+=1
  delta=np.max(abs(frame[:,:,:3].astype(int)-body[:,:,:3].astype(int)),axis=2);leak=int(np.count_nonzero((mask==0)&(delta>2)));assert leak==0,(r['name'],k,leak)
  if k==0:now=frame
  if True:
   col=k;x=col*360;y=index*400;sheet.paste(Image.fromarray(frame).convert('RGB').resize((360,360)),(x,y));labels.text((x+8,y+368),r['name']+' / '+case['label'],fill='white')
  if index in [0,2] and k==2:Image.fromarray(frame).save(review/f'occlusion-detail-{index}.png')
 upload(2,out/f'before-field-{index}.png');before=render('before',r,{**center,'pose':r['beforePose']});
 # Compare the same visible central pixels through the two exact production shaders.
 xs=np.arange(900)[None,:];c=field[:,:,0].astype(float)/255*900;radius=np.maximum(1,field[:,:,1].astype(float)/255*600);lateral=(xs-c)/radius;old_field=np.array(Image.open(out/f'before-field-{index}.png').convert('RGBA'));roi=(np.abs(lateral)<.48)&(mask==255)&(old_field[:,:,2]==255)
 diff=np.max(abs(now[:,:,:3].astype(int)-before[:,:,:3].astype(int)),axis=2);maxdiff=int(diff[roi].max());assert maxdiff<=1,(r['name'],'central change',maxdiff)
 stats.append({'region':r['name'],'cases':9,'leakedPixels':0,'centerMaxChannelDifference':maxdiff})
sheet.save(review/'occlusion-seven-regions.png');(review/'occlusion-shader-checks.json').write_text(json.dumps({'renderer':getString(0x1F01).decode(),'frames':frames,'shaderCompilation':'passed','regions':stats},indent=2));print(f'PASS: production GLSL compiled and rendered {frames} cases; no outside-mask pixels; center preserved within 1/255 in every region. Renderer: '+getString(0x1F01).decode())
