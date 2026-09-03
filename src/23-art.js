/* ================= KAIJU ART =================
   Duas fontes, mesma qualidade de leitura:
   1. PNG original 300x300 da pasta images/ — quando o jogo roda ao lado da colecao.
   2. Folhas de sprite embutidas (128px por Kaiju) — quando o jogo roda sozinho.
   As folhas sao pequenas de proposito: 2048x2048 cada. Um atlas unico de 8888
   Kaiju passa de 80 megapixels e o Safari do iPhone se recusa a decodificar. */
const SHEET_TILE=(typeof KK_SHEET_TILE!=='undefined')?KK_SHEET_TILE:128;
const SHEET_COLS=(typeof KK_SHEET_COLS!=='undefined')?KK_SHEET_COLS:16;
const SHEET_PER=SHEET_COLS*SHEET_COLS;
const SHEETS=(typeof KK_SHEETS!=='undefined')?KK_SHEETS:[];
/* Uma folha e 2048x2048. Decodificar 35 delas de uma vez estoura a memoria de
   qualquer celular, entao no maximo 3 ficam vivas: cada uma e carregada, todos os
   Kaiju que estavam esperando por ela viram canvas de 128px, e a folha e liberada. */
const SH={live:new Map(),MAX:3,pend:new Map(),order:[],url:{}};
const TILEC={m:new Map(),MAX:300};

/* As folhas chegam como texto base64 — 14 MB de string presos na memoria pra
   sempre. Na primeira vez que uma folha e usada viramos ela em Blob (que mora
   fora do heap do JavaScript) e soltamos o texto. Alem de liberar memoria,
   a segunda carga da mesma folha fica muito mais rapida. */
function sheetSrc(k){
  if(SH.url[k])return SH.url[k];
  /* build de desktop: as folhas sao arquivos no disco, nao base64 embutido.
     Sem KK_SHEET_DIR nada muda — a build web continua igualzinha. */
  if(typeof KK_SHEET_DIR!=='undefined'&&KK_SHEET_DIR){
    SH.url[k]=KK_SHEET_DIR+k+'.avif';
    return SH.url[k];
  }
  const b64=SHEETS[k];
  if(!b64)return null;
  try{
    const bin=atob(b64);
    const arr=new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);
    const url=URL.createObjectURL(new Blob([arr],{type:'image/avif'}));
    SH.url[k]=url;
    SHEETS[k]=1;                       /* a string sai da memoria, a folha continua existindo */
    return url;
  }catch(e){
    return 'data:image/avif;base64,'+b64;
  }
}

function cutSheet(k,sh){
  const q=SH.pend.get(k)||[];
  SH.pend.delete(k);
  const cbs=new Set();
  q.forEach(it=>{
    if(!TILEC.m.has(it.id)){
      const j=metaOf(it.id).pos%SHEET_PER;
      const c=document.createElement('canvas');
      c.width=SHEET_TILE;c.height=SHEET_TILE;
      c.getContext('2d').drawImage(sh,(j%SHEET_COLS)*SHEET_TILE,Math.floor(j/SHEET_COLS)*SHEET_TILE,
        SHEET_TILE,SHEET_TILE,0,0,SHEET_TILE,SHEET_TILE);
      TILEC.m.set(it.id,c);
      while(TILEC.m.size>TILEC.MAX){const o=TILEC.m.keys().next().value;TILEC.m.delete(o);}
    }
    if(it.cb)cbs.add(it.cb);
  });
  cbs.forEach(f=>{try{f();}catch(e){}});
}
function releaseSheet(k){
  const im=SH.live.get(k);
  SH.live.delete(k);
  if(im){im.onload=null;im.onerror=null;try{im.src='';}catch(e){}}
}
function pumpSheets(){
  for(const k of SH.order){
    if(SH.live.size>=SH.MAX)return;
    if(SH.live.has(k)||!SH.pend.has(k))continue;
    if(!SHEETS[k]){SH.pend.delete(k);continue;}
    const s=new Image();s.decoding='async';
    s.onload=()=>{
      try{cutSheet(k,s);}catch(e){}
      releaseSheet(k);
      SH.order=SH.order.filter(x=>x!==k);
      if(!document.body.classList.contains('art-ready')){document.body.classList.add('art-ready');artBadge();}
      pumpSheets();
    };
    s.onerror=()=>{SH.pend.delete(k);releaseSheet(k);SH.order=SH.order.filter(x=>x!==k);pumpSheets();};
    SH.live.set(k,s);
    const src=sheetSrc(k);
    if(!src){SH.pend.delete(k);SH.live.delete(k);continue;}
    s.src=src;
  }
}
function tileOf(id,onReady){
  let c=TILEC.m.get(id);
  if(c){TILEC.m.delete(id);TILEC.m.set(id,c);return c;}
  if(!SHEETS.length)return null;
  const k=Math.floor(metaOf(id).pos/SHEET_PER);
  if(!SH.pend.has(k)){SH.pend.set(k,[]);SH.order.push(k);}
  SH.pend.get(k).push({id,cb:onReady});
  pumpSheets();
  return null;
}

const ART={dir:null,map:null,ready:false,cache:new Map(),MAX:700,tried:0};
/* Onde a build LOCAL procura os PNGs de 300px. Alem da pasta ao lado, sobe
   alguns niveis: desde que o codigo virou repositorio, a build sai em
   dist/ dentro do repo, que fica dentro da pasta da colecao — dai o
   ../../ e o ../../../. Assim o jogo acha a arte sem ninguem ter que
   arrastar arquivo pra lugar nenhum. */
const ART_DIRS=['images/','Images/','kaijukaki-collection/images/',
  '../images/','../Images/','../../images/','../../Images/',
  '../../../images/','../../../Images/',
  '../src/images/','../src/Images/',
  '../../src/images/','../../src/Images/',
  '../../../src/images/','../../../src/Images/',
  '../../../kaijukaki-collection/images/',
  '../../../kaijukaki-collection/src/images/',
  '../../../kaijukaki-collection/src/Images/'];
function artBadge(){
  const el=document.getElementById('m_art');
  if(!el)return;
  el.onclick=()=>{if(typeof UI!=='undefined'&&UI.dialog)UI.dialog('Kaiju art',el.title,ART.dir?'info':'warn');};
  el.style.cursor='pointer';
  if(ART.dir){el.className='artq full';el.textContent='ART 300px';el.title='Full quality: reading the original PNGs from the collection folder.';}
  else if(SHEETS.length){el.className='artq low';el.textContent='ART 128px';
    el.title=canReadLocalArt()
      ? 'Built-in artwork. For the full 300&times;300 originals, open the game from inside the kaijukaki-collection folder, next to images/.'
      : 'Built-in artwork, 128&times;128. This build does not read the images folder on its own: it has no way to tell which file belongs to which number, and that is on purpose. Put <b>kk-artmap.js</b> next to this file and it will read the 300&times;300 originals.';}
  else {el.className='artq bad';el.textContent='ART ?';el.title='No art found. Keep this file inside the kaijukaki-collection folder, next to images/.';}
}
/* CUIDADO — foi aqui que a arte veio trocada:
   ler os PNGs de images/ so faz sentido se esta build tiver o mapa KK_REAL.
   O numero do jogo NAO e o numero do arquivo, entao sem o mapa a gente
   carregaria images/{numero do jogo}.png, que e OUTRA peca — a arte de um e os
   traits de outro. E embutir o mapa na build publica seria justamente o
   vazamento que o shuffle existe pra evitar. Sem mapa: so as folhas. */
function canReadLocalArt(){
  if(typeof KK_REAL!=='undefined'&&KK_REAL&&KK_REAL.length===KK_META.n)return true;
  return !!(ART.map&&ART.map.length===KK_META.n);
}
/* ---------- mapa de arte ao lado do jogo ----------
   A build publica nao pode carregar o mapa jogo->arquivo dentro dela: isso
   entregaria qual peca real e o proximo mint. Mas quem tem a colecao na
   maquina pode por o mapa NUM ARQUIVO SEPARADO ao lado do HTML. Quem so
   baixa o jogo nao tem esse arquivo, entao nada vaza — e quem tem a pasta
   joga em 300px. O arquivo entra por <script>, nao por fetch: file:// bloqueia
   fetch, mas carrega script local numa boa. */
function loadArtMap(then){
  if(typeof KK_REAL!=='undefined'&&KK_REAL)return then(false);
  /* SO EM file://. O mapa ao lado do HTML e uma conveniencia pra quem tem a
     colecao na propria maquina. Se um dia alguem servir a pasta dist/ inteira
     num servidor ou num bucket, o kk-artmap.js fica na mesma origem e o jogo
     carregaria ele sozinho — entregando a permutacao pra qualquer visitante.
     Servido por http(s), nem tenta. */
  try{
    const pr=(location&&location.protocol)||'';
    if(pr!=='file:'&&pr!=='app:')return then(false);
  }catch(e){return then(false);}
  const sc=document.createElement('script');
  sc.src='kk-artmap.js';
  sc.onload=()=>{
    const m=(typeof KK_ARTMAP!=='undefined')?KK_ARTMAP:null;
    if(m&&m.length===KK_META.n){ART.map=m;then(true);}
    else then(false);
  };
  sc.onerror=()=>then(false);
  document.head.appendChild(sc);
}
(function probeArt(){
  const start=()=>{
    if(!canReadLocalArt()){
      ART.ready=true;
      artBadge();
      if(!SHEETS.length)setTimeout(()=>{
        if(typeof UI!=='undefined'&&UI.dialog)UI.dialog('Kaiju art not found',
          'This build has no artwork in it.','warn');
      },2600);
      return;
    }
    tryDir(0);
  };
  const tryDir=k=>{
    if(k>=ART_DIRS.length){
      ART.ready=true;
      artBadge();
      if(!SHEETS.length)setTimeout(()=>{
        if(typeof UI!=='undefined'&&UI.dialog)UI.dialog('Kaiju art not found',
          'This build reads the real 300&times;300 artwork from the <b>images</b> folder.<br><br>Keep <b>Kaijukaki Gotta Mint Out.html</b> inside <b>kaijukaki-collection</b>, right next to the <b>images</b> folder, and open it from there.','warn');
      },2600);
      return;
    }
    const im=new Image();
    im.onload=()=>{
      ART.dir=ART_DIRS[k];ART.ready=true;
      document.body.classList.add('art-full','art-ready');
      artBadge();
      if(typeof UI!=='undefined'&&UI.refresh)UI.refresh();
    };
    im.onerror=()=>tryDir(k+1);
    im.src=ART_DIRS[k]+'1.png';
  };
  loadArtMap(start);
})();
/* O numero que o jogo mostra nao e o numero real da colecao — a build publica
   nao carrega esse mapa. Ele so existe aqui do lado da pasta images/. */
function realFileId(id){
  if(typeof KK_REAL!=='undefined'&&KK_REAL)return KK_REAL[id-1]||id;
  if(ART.map)return ART.map[id-1]||id;
  return id;
}
function localArt(id,onReady){
  if(!ART.dir||!canReadLocalArt())return null;
  let im=ART.cache.get(id);
  if(im){
    if(im.__ok)return im;
    if(im.__bad)return null;
    if(onReady)(im.__cbs||(im.__cbs=[])).push(onReady);
    return null;
  }
  im=new Image();
  im.__cbs=onReady?[onReady]:[];
  im.onload=()=>{im.__ok=true;const cbs=im.__cbs||[];im.__cbs=[];cbs.forEach(f=>{try{f();}catch(e){}});};
  im.onerror=()=>{im.__bad=true;im.__cbs=[];};
  im.src=ART.dir+realFileId(id)+'.png';
  ART.cache.set(id,im);
  if(ART.cache.size>ART.MAX){
    const it=ART.cache.keys();
    for(let k=0;k<120;k++){const n=it.next();if(n.done)break;ART.cache.delete(n.value);}
  }
  return null;
}

function drawKaiju(cv,tk,size){
  size=size||cv.width||96;
  const dpr=Math.min(2,window.devicePixelRatio||1);
  cv.width=Math.round(size*dpr);cv.height=Math.round(size*dpr);
  cv.style.width=size+'px';cv.style.height=size+'px';
  const g=cv.getContext('2d');
  g.setTransform(dpr,0,0,dpr,0,0);
  const id=tk&&tk.id?clamp(tk.id,1,KK_META.n):1;
  g.imageSmoothingEnabled=true;
  g.imageSmoothingQuality='high';
  g.clearRect(0,0,size,size);

  /* CUIDADO — este foi o bug da arte errada no sorteio.
     O giro desenha uns 13 Kaiju ALEATORIOS neste mesmo canvas, e cada um
     agenda "redesenhe quando a folha carregar". As folhas chegam segundos
     depois, ja com o resultado na tela, e repintavam o Kaiju aleatorio por
     cima — arte de um, nome de outro. Na carteira nunca acontecia porque la
     nao tem giro.
     O canvas agora carimba qual id ele QUER: callback de id velho nao pinta. */
  cv.__want=id;
  const again=()=>{if(cv.isConnected&&cv.__want===id)drawKaiju(cv,tk,size);};
  const full=localArt(id,again);
  if(full){g.drawImage(full,0,0,size,size);return;}
  const tile=tileOf(id,again);
  if(tile){g.drawImage(tile,0,0,size,size);return;}
  g.fillStyle='#12190c';g.fillRect(0,0,size,size);
  g.fillStyle='#1d2a12';
  for(let i=0;i<6;i++)g.fillRect(0,size*(i/6),size,size/12);
}
function drawKaijuCached(cv,tk,size){return drawKaiju(cv,tk,size);}
function randomTokenId(){return 1+Math.floor(Math.random()*KK_META.n);}

/* ---- fish rank art ---- */
const FISH_COL=['#9fb3ab','#a8c8b0','#b9c49e','#c07a4a','#7fa8c8','#6f93b8','#93bccc','#6b7a88','#2f3a44','#24506b'];
function drawFish(cv,level,size){
  size=size||96;const S=16,dpr=Math.min(2,window.devicePixelRatio||1);
  cv.width=size*dpr;cv.height=size*dpr;cv.style.width=size+'px';cv.style.height=size+'px';
  const g=cv.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);g.imageSmoothingEnabled=false;
  const u=size/S,P=(x,y,w,h,c)=>{if(x<-1||x>S)return;g.fillStyle=c;g.fillRect(Math.round(x*u),Math.round(y*u),Math.ceil(w*u),Math.ceil(h*u));};
  const L=clamp(level|0,1,10);
  const body=FISH_COL[L-1], dark='#0d0d0d', belly='rgba(255,255,255,.30)';
  const len=Math.round(5+L*0.85), gir=Math.max(1,Math.round(0.6+L*0.42));
  const x0=Math.max(1,Math.round((S-len-3)/2)), cy=8;
  const hAt=i=>{const t=len>1?i/(len-1):0;return Math.max(1,Math.round(gir*Math.sin(Math.PI*(0.20+t*0.70))));};
  /* dorsal fin */
  if(L>=4){const mi=Math.floor(len*0.45),h=hAt(mi);
    for(let k=0;k<Math.max(2,gir);k++)P(x0+mi+k,cy-h-1-(Math.max(2,gir)-k),1,Math.max(2,gir)-k+1,body);}
  /* body */
  for(let i=0;i<len;i++){
    const h=hAt(i);
    P(x0+i,cy-h,1,h*2+1,body);
    P(x0+i,cy-h-1,1,1,dark);
    P(x0+i,cy+h+1,1,1,dark);
    if(h>1)P(x0+i,cy+h-1,1,1,belly);
  }
  /* head outline */
  const h0=hAt(0);
  P(x0-1,cy-h0,1,h0*2+1,dark);
  /* orca / whale markings */
  if(L===9){P(x0+1,cy-gir+1,2,1,'#f0f0f0');P(x0+2,cy+1,Math.max(2,len-5),gir,'#f0f0f0');}
  if(L===10){P(x0+2,cy+2,Math.max(3,len-5),Math.max(1,gir-1),'#cfe0e8');
    P(x0+1,cy-gir-3,1,3,'#cfe0e8');P(x0,cy-gir-4,1,2,'#cfe0e8');P(x0+2,cy-gir-4,1,2,'#cfe0e8');}
  /* tail */
  const tx=x0+len, tg=gir+1;
  P(tx,cy-1,1,3,body);P(tx,cy-2,1,1,dark);P(tx,cy+2,1,1,dark);
  P(tx+1,cy-tg,1,tg*2+1,body);
  P(tx+1,cy-tg-1,1,1,dark);P(tx+1,cy+tg+1,1,1,dark);
  P(tx+2,cy-tg-1,1,tg+1,body);P(tx+2,cy+1,1,tg+1,body);
  P(tx+2,cy-tg-2,1,1,dark);P(tx+2,cy+tg+2,1,1,dark);
  P(tx+2,cy,1,1,dark);
  /* pectoral fin */
  if(L>=3)P(x0+2,cy+hAt(2),2,1,body);
  /* eye */
  P(x0+1,cy-1,1,1,'#ffffff');
  P(x0+1,cy-1,1,1,L>=8?'#e8e8e8':'#ffffff');
  P(x0+1,cy-1,1,1,'#ffffff');
  P(x0+1,cy-1,1,1,'#fff');
  P(x0+1,cy-1,1,1,'#ffffff');
  P(x0+1,cy-1,1,1,'#ffffff');
  P(x0+1,cy-1,1,1,'#ffffff');
  P(x0+1,cy-1,1,1,'#ffffff');
  P(x0+1,cy-1,1,1,'#ffffff');
  P(x0+1,cy-1,1,1,'#ffffff');
  P(x0+1,cy-1,1,1,'#ffffff');
  P(x0+1,cy-2,1,3,'#ffffff');
  P(x0+1,cy-1,1,1,'#101010');
  /* mouth */
  P(x0,cy+Math.max(1,h0-1),1,1,dark);
}

