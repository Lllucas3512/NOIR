'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const makeCanvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
// Only the shared master image is retained; uploads and temporary SVGs are not cached.
const imageCache=new Map();
function loadImage(src){if(imageCache.has(src))return imageCache.get(src);const task=new Promise((resolve,reject)=>{const im=new Image();im.decoding='async';im.onload=()=>{Promise.resolve().then(()=>typeof im.decode==='function'?im.decode():undefined).then(()=>resolve(im),reject)};im.onerror=reject;im.src=src});if(src==='assets/blackwork-master.png'){imageCache.set(src,task);task.catch(()=>imageCache.delete(src))}return task}
let uploadName='',selectedArt='blackwork',capturedPreview=null,heroSettled=false,heroFailed=false;
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000)}

const heroTrack=$('.hero-track'),heroBox=$('.hero'),heroInk=$('#ink'),heroScene=$('.scene'),heroFade=$('.fade-black'),heroSteps=$$('.stages span'),heroProgress=$('#progress');
let heroPainter=null,heroPending=false,heroTop=0,heroDistance=1,heroBuild=1,heroHold=1,lastStage=-1,lastPercent=-1;
function measureHero(){heroTop=heroTrack.offsetTop;heroDistance=Math.max(1,heroTrack.offsetHeight-heroBox.offsetHeight);heroBuild=heroBox.offsetHeight*3.056;heroHold=heroBox.offsetHeight*.8;scheduleHero()}
function updateHero(){heroPending=false;const distance=Math.max(0,scrollY-heroTop),p=reduced.matches?1:clamp(distance/heroBuild);
 if(heroPainter)heroPainter.draw(p);
 if(!heroPainter){heroProgress.textContent=heroSettled?'PRÉVIA INDISPONÍVEL':distance>heroBuild*.12?'PREPARANDO TRAÇOS…':'00%';return}
 const percent=Math.round(p*100),stage=p<.12?0:p<.25?1:p<.45?2:p<.65?3:p<.82?4:p<.95?5:6;
 if(percent!==lastPercent){heroProgress.textContent=String(percent).padStart(2,'0')+'%';lastPercent=percent}
 if(stage!==lastStage){heroSteps.forEach((e,i)=>e.classList.toggle('active',i===stage));lastStage=stage}
 const exit=reduced.matches?0:clamp((distance-heroBuild-heroHold)/Math.max(1,heroDistance-heroBuild-heroHold));heroFade.style.opacity=exit;heroScene.style.scale=String(1+exit*.015);
}
function scheduleHero(){if(!heroPending){heroPending=true;requestAnimationFrame(updateHero)}}
addEventListener('scroll',scheduleHero,{passive:true});addEventListener('resize',measureHero,{passive:true});reduced.addEventListener('change',measureHero);
// A failed request retries once, without blocking navigation or resetting scroll.
async function prepareHero(){try{const [image,lines]=await Promise.all([loadImage('assets/blackwork-master.png'),fetch('assets/ink-lines.json').then(r=>{if(!r.ok)throw Error('linework');return r.json()})]);heroPainter=new NoirHeroPainter(heroInk,image,lines,makeCanvas);heroSettled=true;lastPercent=lastStage=-1;measureHero()}catch{if(!heroFailed){heroFailed=true;setTimeout(prepareHero,1200)}else{heroSettled=true;heroProgress.textContent='PRÉVIA INDISPONÍVEL';heroSteps.forEach(el=>el.classList.remove('active'))}}}
prepareHero();measureHero();
$('#menu').addEventListener('click',()=>{const open=$('nav').classList.toggle('open');$('#menu').setAttribute('aria-expanded',open);$('#menu').textContent=open?'FECHAR −':'MENU +'});$$('nav a').forEach(a=>a.addEventListener('click',()=>{$('nav').classList.remove('open');$('#menu').setAttribute('aria-expanded','false');$('#menu').textContent='MENU +'}));
const works=[['Herbário íntimo','Fine Line','pw1','Helena Vilar','Um estudo de folhas, pausas e linhas delicadas. A composição acompanha o antebraço sem disputar espaço com a pele.'],['Matéria escura','Blackwork','pw2','Caio Salles','Peônias e áreas de preto em uma composição de contraste profundo.'],['Fragmento clássico','Realismo','pw3','Caio Salles','Luz e sombra reinterpretam a escultura clássica em preto e cinza.'],['Ritmo orgânico','Ornamental','pw4','Caio Salles','Ornamentos e curvas construídos em diálogo com a anatomia.'],['Memória botânica','Autoral','pw5','Helena Vilar','Uma composição livre, desenhada a partir de referências pessoais.'],['Entre luz e pedra','Realismo','pw6','Caio Salles','Texturas e transições suaves em um estudo de presença e expressão.']];
$('#gallery').innerHTML=works.map((w,i)=>`<button class="work" data-index="${i}" data-category="${w[1]}" aria-label="Ver ${w[0]}, ${w[1]}"><div class="photo ${w[2]}" role="img" aria-label="Tatuagem de ${w[1]}"></div><div class="caption"><div><h3>${w[0]}</h3><p>${w[1].toUpperCase()} / ${w[3].toUpperCase()}</p></div><span>↗</span></div></button>`).join('');
function filter(style){$$('[data-filter]').forEach(b=>b.classList.toggle('active',b.dataset.filter===style));$$('.work').forEach(b=>b.hidden=style!=='Todos'&&b.dataset.category!==style)}
$$('[data-filter]').forEach(b=>b.addEventListener('click',()=>filter(b.dataset.filter)));$$('.artist-filter').forEach(b=>b.addEventListener('click',()=>{filter(b.dataset.style);$('#portfolio').scrollIntoView({behavior:reduced.matches?'instant':'smooth'})}));
$$('.work').forEach(b=>b.addEventListener('click',()=>{const w=works[+b.dataset.index];$('#dialog-photo').className='photo is-loaded '+w[2];$('#dialog-photo').setAttribute('role','img');$('#dialog-photo').setAttribute('aria-label',w[0]);$('#dialog-style').textContent=w[1]+' / '+w[3];$('#dialog-title').textContent=w[0];$('#dialog-description').textContent=w[4]+' Trabalho conceitual ilustrativo.';$('#work-dialog').showModal()}));$('#close-dialog').onclick=()=>$('#work-dialog').close();$('#dialog-cta').onclick=()=>$('#work-dialog').close();$('#work-dialog').addEventListener('click',e=>{if(e.target===$('#work-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close()}});
// =============================================================================
// =============================================================================
// CONFIGURAÇÃO DO WHATSAPP DO ATELIER NØIR
// Insira o número oficial com DDI e DDD (somente dígitos, ex: '5511999999999').
// Deixe vazio ('') até que o número oficial seja fornecido para ativação.
const NOIR_WHATSAPP_NUMBER = '5515988311292';

function buildA4Pdf(jpegDataUrl, imgW, imgH) {
  const b64 = jpegDataUrl.split(',')[1];
  const raw = atob(b64);
  const rawLen = raw.length;
  const imgBytes = new Uint8Array(rawLen);
  for (let i = 0; i < rawLen; i++) imgBytes[i] = raw.charCodeAt(i);

  const ptW = 595.28;
  const ptH = 841.89;

  const enc = new TextEncoder();
  const parts = [];
  let offset = 0;
  const offsets = [];

  function addStr(str) {
    const b = enc.encode(str);
    parts.push(b);
    offset += b.length;
  }
  function addBytes(b) {
    parts.push(b);
    offset += b.length;
  }

  addStr('%PDF-1.4\n');

  // Obj 1: Catalog
  offsets.push(offset);
  addStr('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  // Obj 2: Pages
  offsets.push(offset);
  addStr('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

  // Obj 3: Page
  offsets.push(offset);
  addStr('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + ptW + ' ' + ptH + '] /Resources << /XObject << /Im1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n');

  // Obj 4: Image XObject
  offsets.push(offset);
  addStr('4 0 obj\n<< /Type /XObject /Subtype /Image /Width ' + imgW + ' /Height ' + imgH + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + rawLen + ' >>\nstream\n');
  addBytes(imgBytes);
  addStr('\nendstream\nendobj\n');

  // Obj 5: Content stream
  const content = 'q\n' + ptW + ' 0 0 ' + ptH + ' 0 0 cm\n/Im1 Do\nQ\n';
  const cLen = enc.encode(content).length;
  offsets.push(offset);
  addStr('5 0 obj\n<< /Length ' + cLen + ' >>\nstream\n' + content + 'endstream\nendobj\n');

  // xref table
  const startXref = offset;
  addStr('xref\n0 6\n0000000000 65535 f \n');
  for (let i = 0; i < 5; i++) {
    addStr(String(offsets[i]).padStart(10, '0') + ' 00000 n \n');
  }
  addStr('trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + startXref + '\n%%EOF');

  return new Blob(parts, { type: 'application/pdf' });
}

async function generateEditorialBriefingPdf(data) {
  if (document.fonts && document.fonts.ready) {
    try { await document.fonts.ready; } catch {}
  }

  const W = 1654;
  const H = 2338;
  const cvs = document.createElement('canvas');
  cvs.width = W;
  cvs.height = H;
  const ctx = cvs.getContext('2d');

  // Fundo off-white editorial aquecido
  ctx.fillStyle = '#f8f7f4';
  ctx.fillRect(0, 0, W, H);

  const mx = 120;
  const my = 110;
  const cw = W - mx * 2;

  // Cabeçalho institucional: NØIR / TATTOO ATELIER
  ctx.fillStyle = '#111111';
  ctx.font = '600 46px "Cormorant Garamond", Georgia, serif';
  ctx.fillText('N\u00D8IR', mx, my + 44);

  ctx.fillStyle = '#555555';
  ctx.font = '600 15px "Manrope", Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('TATTOO ATELIER', W - mx, my + 38);
  ctx.textAlign = 'left';

  // Filete superior
  ctx.strokeStyle = '#dedad2';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(mx, my + 75);
  ctx.lineTo(W - mx, my + 75);
  ctx.stroke();

  // Metadados do documento
  let y = my + 130;
  ctx.fillStyle = '#7d7a74';
  ctx.font = '600 13px "Manrope", Arial, sans-serif';
  ctx.fillText('DOCUMENTO DE PROJETO \u00B7 ESTUDO DE COMPOSI\u00C7\u00C3O', mx, y);

  y += 50;
  ctx.fillStyle = '#111111';
  ctx.font = '500 48px "Cormorant Garamond", Georgia, serif';
  ctx.fillText('Estudo de tatuagem', mx, y);

  // Bloco central de destaque visual (tatuagem real ou aviso editorial)
  y += 35;
  const boxY = y;
  const hasPreview = !!data.previewImg;
  const boxH = hasPreview ? 760 : 420;

  ctx.fillStyle = '#edeae4';
  ctx.strokeStyle = '#e2ded7';
  ctx.lineWidth = 1;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(mx, boxY, cw, boxH, 8);
  else ctx.rect(mx, boxY, cw, boxH);
  ctx.fill();
  ctx.stroke();

  if (hasPreview) {
    const pad = 24;
    const maxIW = cw - pad * 2;
    const maxIH = boxH - pad * 2;
    const scale = Math.min(maxIW / data.previewImg.width, maxIH / data.previewImg.height);
    const dw = data.previewImg.width * scale;
    const dh = data.previewImg.height * scale;
    const dx = mx + (cw - dw) / 2;
    const dy = boxY + (boxH - dh) / 2;
    ctx.drawImage(data.previewImg, dx, dy, dw, dh);
  } else {
    ctx.fillStyle = '#66635c';
    ctx.font = '600 32px "Cormorant Garamond", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('\u2726', mx + cw / 2, boxY + 160);

    ctx.font = '600 22px "Cormorant Garamond", Georgia, serif';
    ctx.fillStyle = '#222220';
    ctx.fillText('Pr\u00E9via visual do simulador n\u00E3o anexada', mx + cw / 2, boxY + 210);

    ctx.font = '400 15px "Manrope", Arial, sans-serif';
    ctx.fillStyle = '#77746c';
    ctx.fillText('O estudo visual e o est\u00EAncil ser\u00E3o desenvolvidos diretamente na consultoria com o artista.', mx + cw / 2, boxY + 250);
    ctx.textAlign = 'left';
  }

  // Grade editorial de informações
  y = boxY + boxH + 55;
  const col1X = mx + 20;
  const col2X = mx + cw / 2 + 30;

  const drawField = (label, val, xPos, yPos) => {
    ctx.fillStyle = '#7d7a74';
    ctx.font = '600 13px "Manrope", Arial, sans-serif';
    ctx.fillText(label.toUpperCase(), xPos, yPos);
    ctx.fillStyle = '#111111';
    ctx.font = '600 22px "Manrope", Arial, sans-serif';
    ctx.fillText(val || '\u2014', xPos, yPos + 32);
  };

  drawField('Regi\u00E3o do corpo', data.regiao || 'A definir', col1X, y);
  drawField('Estilo', data.estilo || 'A definir', col2X, y);

  drawField('Tamanho aproximado', data.tamanho || 'A definir', col1X, y + 85);
  drawField('Artista de prefer\u00EAncia', data.artista || 'Sem prefer\u00EAncia', col2X, y + 85);

  const clientY = y + 170;
  if (data.nome || data.email) {
    if (data.nome) drawField('Cliente', data.nome, col1X, clientY);
    if (data.email) drawField('E-mail para contato', data.email, col2X, clientY);
    y = clientY + 100;
  } else {
    y += 185;
  }

  // Filete intermediário
  ctx.strokeStyle = '#dedad2';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(mx, y);
  ctx.lineTo(W - mx, y);
  ctx.stroke();

  // Seção de conceito e ideia
  y += 50;
  ctx.fillStyle = '#7d7a74';
  ctx.font = '600 13px "Manrope", Arial, sans-serif';
  ctx.fillText('CONCEITO & REFER\u00CANCIAS DO PROJETO', mx, y);

  y += 40;
  ctx.fillStyle = '#222222';
  ctx.font = '400 20px "Manrope", Arial, sans-serif';
  const desc = data.ideia || 'Nenhuma descri\u00E7\u00E3o inserida previamente. Conceito a ser alinhado diretamente na consultoria.';
  const paragraphs = desc.split('\n');
  const lineHeight = 32;
  const maxTextWidth = cw;
  const maxY = H - my - 80;

  for (const para of paragraphs) {
    if (y >= maxY) break;
    const words = para.split(' ');
    let curLine = '';
    for (const word of words) {
      const testLine = curLine ? curLine + ' ' + word : word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxTextWidth && curLine) {
        ctx.fillText(curLine, mx, y);
        y += lineHeight;
        if (y >= maxY) break;
        curLine = word;
      } else {
        curLine = testLine;
      }
    }
    if (curLine && y < maxY) {
      ctx.fillText(curLine, mx, y);
      y += lineHeight;
    }
    y += 8;
  }

  // Rodapé editorial
  const footY = H - my - 20;
  ctx.strokeStyle = '#dedad2';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(mx, footY - 30);
  ctx.lineTo(W - mx, footY - 30);
  ctx.stroke();

  ctx.fillStyle = '#777570';
  ctx.font = '600 13px "Manrope", Arial, sans-serif';
  ctx.fillText('ESTUDO PRELIMINAR \u00B7 N\u00D8IR TATTOO ATELIER', mx, footY);

  ctx.fillStyle = '#888680';
  ctx.font = '500 12px "Manrope", Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('SUJEITO \u00C0 AVALIA\u00C7\u00C3O T\u00C9CNICA E APROVA\u00C7\u00C3O DO TATUADOR', W - mx, footY);

  ctx.fillStyle = '#999690';
  ctx.font = '400 12px "Manrope", Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Atendimento com hora marcada \u00B7 Documento autoral', mx, footY + 24);

  const today = new Date().toLocaleDateString('pt-BR');
  ctx.textAlign = 'right';
  ctx.fillText('Gerado em ' + today, W - mx, footY + 24);

  const jpegUrl = cvs.toDataURL('image/jpeg', 0.92);
  return buildA4Pdf(jpegUrl, W, H);
}

// Manipulador do botão de download de PDF
$('#btn-download-pdf').addEventListener('click', async () => {
  const statusEl = $('#form-status');
  statusEl.textContent = 'Gerando briefing editorial em PDF…';

  const form = $('#booking');
  const fields = new FormData(form);
  const nome = (fields.get('nome') || '').trim();
  const email = (fields.get('email') || '').trim();
  const regiao = (fields.get('regiao') || ($('#form-region') ? $('#form-region').value : '') || ($('#region') ? $('#region').value : '') || '').trim();
  const tamanho = (fields.get('tamanho') || '').trim();
  const estilo = (fields.get('estilo') || '').trim();
  const artista = (fields.get('artista') || '').trim();
  const ideia = (fields.get('ideia') || '').trim();

  let previewImg = null;
  if (capturedPreview) {
    try {
      previewImg = await new Promise((resolve, reject) => {
        const im = new Image();
        im.onload = () => resolve(im);
        im.onerror = reject;
        im.src = capturedPreview;
      });
    } catch {}
  } else if (typeof flushPreview === 'function' && flushPreview()) {
    try {
      const curData = $('#preview').toDataURL('image/jpeg', 0.85);
      previewImg = await new Promise((resolve, reject) => {
        const im = new Image();
        im.onload = () => resolve(im);
        im.onerror = reject;
        im.src = curData;
      });
    } catch {}
  }

  try {
    const pdfBlob = await generateEditorialBriefingPdf({
      nome,
      email,
      regiao,
      tamanho,
      estilo,
      artista,
      ideia,
      previewImg
    });

    const slug = nome
      ? nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
      : 'estudo';
    const fileName = `noir-briefing-${slug}.pdf`;
    download(pdfBlob, fileName);

    statusEl.textContent = 'Briefing editorial em PDF baixado com sucesso! Você pode anexá-lo à conversa do WhatsApp.';
  } catch (err) {
    console.error(err);
    statusEl.textContent = 'Não foi possível gerar o PDF. Tente novamente.';
  }
});

// Manipulador do botão de download de imagem PNG da tatuagem
$('#btn-download-png').addEventListener('click', () => {
  const statusEl = $('#form-status');

  if (typeof flushPreview === 'function') {
    try { flushPreview(); } catch {}
  }

  const cvs = $('#preview');
  if (cvs && typeof cvs.toBlob === 'function' && (capturedPreview || !$('#attached').hidden)) {
    cvs.toBlob(blob => {
      if (blob) {
        download(blob, 'noir-estudo-tattoo.png');
        statusEl.textContent = 'Imagem da tatuagem (.PNG) baixada com sucesso! Você pode anexá-la à conversa do WhatsApp.';
      }
    }, 'image/png');
    return;
  }

  if (capturedPreview) {
    const im = new Image();
    im.onload = () => {
      const c = document.createElement('canvas');
      c.width = im.width;
      c.height = im.height;
      c.getContext('2d').drawImage(im, 0, 0);
      c.toBlob(blob => {
        if (blob) {
          download(blob, 'noir-estudo-tattoo.png');
          statusEl.textContent = 'Imagem da tatuagem (.PNG) baixada com sucesso! Você pode anexá-la à conversa do WhatsApp.';
        }
      }, 'image/png');
    };
    im.src = capturedPreview;
    return;
  }

  statusEl.textContent = 'Nenhuma prévia foi gerada no simulador ainda. Experimente o simulador acima e toque em “LEVAR ESTA IDEIA AO ORÇAMENTO”.';
});

// Submissão do formulário com integração do WhatsApp
$('#booking').addEventListener('submit', e => {
  e.preventDefault();
  if (!e.target.reportValidity()) return;
  const fields = new FormData(e.target);
  const nome = (fields.get('nome') || '').trim();
  const email = (fields.get('email') || '').trim();
  const regiao = (fields.get('regiao') || '').trim();
  const tamanho = (fields.get('tamanho') || '').trim();
  const estilo = (fields.get('estilo') || '').trim();
  const artista = (fields.get('artista') || '').trim();
  const ideia = (fields.get('ideia') || '').trim();
  const statusEl = $('#form-status');

  if (!nome || !email || !ideia) {
    statusEl.textContent = 'Por favor, preencha todos os campos obrigatórios antes de prosseguir.';
    return;
  }

  const lines = [
    '*NØIR TATTOO ATELIER — SOLICITAÇÃO DE ORÇAMENTO*',
    '',
    `*Nome:* ${nome}`,
    `*E-mail:* ${email}`,
    regiao ? `*Região do corpo:* ${regiao}` : '',
    tamanho ? `*Tamanho aproximado:* ${tamanho}` : '',
    estilo ? `*Estilo:* ${estilo}` : '',
    artista ? `*Artista de preferência:* ${artista}` : '',
    '',
    '*Ideia / Projeto:*',
    ideia
  ];

  if (capturedPreview || !$('#attached').hidden) {
    const ref = uploadName || (selectedArt === 'blackwork' ? 'Autoral NØIR' : selectedArt);
    lines.push('', `*Estudo no simulador:* Realizado no site (referência: ${ref || 'composição na pele'})`);
  }

  const message = lines.filter(l => l !== '').join('\n');

  if (!NOIR_WHATSAPP_NUMBER) {
    statusEl.textContent = 'Configuração pendente: informe o número oficial do WhatsApp no código para concluir a ativação. Seus dados estão preservados no formulário.';
    return;
  }

  const cleanPhone = NOIR_WHATSAPP_NUMBER.replace(/\D/g, '');
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  window.open(waUrl, '_blank', 'noopener,noreferrer');
  statusEl.textContent = 'Conversa aberta no WhatsApp! Confirme o envio tocando em “Enviar” dentro do aplicativo.';
});

// Below-fold photography keeps its exact atlas and crop; only its request is deferred.
if(typeof IntersectionObserver==='function'){const photos=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('is-loaded');photos.unobserve(entry.target)}},{rootMargin:'800px'});$$('.photo').forEach(el=>photos.observe(el))}else $$('.photo').forEach(el=>el.classList.add('is-loaded'));
// One simulator instance, requested early enough to retain sequential region warmup.
let simulatorTask=null;
function loadScript(src){return new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=src;script.async=false;script.onload=()=>resolve();script.onerror=()=>{script.remove();reject(Error(src))};document.head.appendChild(script)})}
function ensureSimulator(){if(simulatorTask)return simulatorTask;$('.controls').inert=true;$('#preview').setAttribute('aria-busy','true');$('.canvas-tag').textContent='PREPARANDO ESTUDO…';simulatorTask=(async()=>{if(!globalThis.NoirInk)await loadScript('ink-engine.js');await loadScript('simulator.js');$('.controls').inert=false})().catch(()=>{simulatorTask=null;$('.controls').inert=false;$('#preview').setAttribute('aria-busy','false');$('.canvas-tag').textContent='NÃO FOI POSSÍVEL CARREGAR · TOQUE PARA TENTAR';return false});return simulatorTask}
$('.canvas-wrap').addEventListener('click',()=>{if(!simulatorTask)ensureSimulator()});
$('.simulator').addEventListener('focusin',ensureSimulator);
if(typeof IntersectionObserver==='function'){const simObserver=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){simObserver.disconnect();ensureSimulator()}},{rootMargin:'2000px'});simObserver.observe($('.simulator'))}else{const nearSim=()=>{if($('.simulator').getBoundingClientRect().top<innerHeight+2000){removeEventListener('scroll',nearSim);ensureSimulator()}};addEventListener('scroll',nearSim,{passive:true});nearSim()}
