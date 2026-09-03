/* ================= UTIL ================= */
/* ---- modo mobile: decidido uma vez, no carregamento ---- */
const COARSE=(()=>{try{return matchMedia('(pointer:coarse)').matches;}catch(e){return false;}})();
function mobWidth(){return Math.min(window.innerWidth||9999,document.documentElement.clientWidth||9999);}
let IS_MOB=(function(){
  try{
    if(location.hash==='#desktop')return false;
    if(location.hash==='#mobile')return true;
  }catch(e){}
  const w=mobWidth();
  return w<=820&&(COARSE||w<=560);
})();
function haptic(ms){try{if(IS_MOB&&navigator.vibrate)navigator.vibrate(ms||8);}catch(e){}}
/* padroes de vibracao: sempre os mesmos, pra o jogo ter um vocabulario tatil.
   Um numero = um toque seco. Um array = liga/desliga em ms. */
const HAP={
  tap:8, ok:14, cash:[10,30,18], deny:[14,26,14], mint:20, level:[16,40,16,40,34],
  /* a raridade so vibra quando a pilula aparece: nada pode entregar o giro antes */
  rar:[0,0,16,[22,46,22],[26,52,26,52,34],[34,56,30,56,30,56,60]]
};
const $=(s,r)=>(r||document).querySelector(s);
const $$=(s,r)=>[...(r||document).querySelectorAll(s)];
const el=(t,c,h)=>{const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e;};
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const ri=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const rf=(a,b)=>a+Math.random()*(b-a);
const pick=a=>a[Math.floor(Math.random()*a.length)];
const chance=p=>Math.random()<p;

function money(n){
  n=Math.round(n*100)/100;
  const neg=n<0;n=Math.abs(n);
  let s=n>=1000? Math.round(n).toLocaleString('en-US') : n.toFixed(2);
  return (neg?'-$':'$')+s;
}
function num(n){return Math.round(n).toLocaleString('en-US');}
function pad2(n){return String(n).padStart(2,'0');}

/* deterministic hash rng */
function mulberry(seed){let a=seed>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function hash32(str){let h=2166136261>>>0;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}

/* ================= AUDIO (WebAudio, no assets) ================= */
const SFX=(()=>{
  let ctx=null,master=null,muted=false;
  function ac(){
    if(!ctx){try{ctx=new (window.AudioContext||window.webkitAudioContext)();master=ctx.createGain();master.gain.value=.32;master.connect(ctx.destination);}catch(e){return null;}}
    if(ctx.state==='suspended')ctx.resume();
    return ctx;
  }
  function tone(f,dur,type,vol,slide){
    if(muted)return;const c=ac();if(!c)return;
    const o=c.createOscillator(),g=c.createGain();
    o.type=type||'square';o.frequency.setValueAtTime(f,c.currentTime);
    if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,slide),c.currentTime+dur);
    g.gain.setValueAtTime(0,c.currentTime);
    g.gain.linearRampToValueAtTime(vol==null?.25:vol,c.currentTime+.006);
    g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+dur);
    o.connect(g);g.connect(master);o.start();o.stop(c.currentTime+dur+.02);
  }
  function noise(dur,vol,hp){
    if(muted)return;const c=ac();if(!c)return;
    const n=Math.floor(c.sampleRate*dur),buf=c.createBuffer(1,n,c.sampleRate),d=buf.getChannelData(0);
    for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n);
    const s=c.createBufferSource();s.buffer=buf;
    const f=c.createBiquadFilter();f.type='highpass';f.frequency.value=hp||900;
    const g=c.createGain();g.gain.value=vol==null?.2:vol;
    s.connect(f);f.connect(g);g.connect(master);s.start();
  }
  return {
    click(){noise(.028,.16,1600);tone(2100,.02,'square',.05);},
    down(){noise(.02,.12,2000);},
    open(){tone(320,.06,'square',.13);setTimeout(()=>tone(520,.07,'square',.11),40);},
    close(){tone(480,.05,'square',.11);setTimeout(()=>tone(260,.07,'square',.1),36);},
    error(){haptic(HAP.deny);tone(180,.16,'sawtooth',.2);setTimeout(()=>tone(150,.26,'sawtooth',.18),150);},
    coin(){tone(880,.05,'square',.16);setTimeout(()=>tone(1320,.13,'square',.14),52);},
    /* caixa registradora, nao mais um bip subindo igual a todos os outros:
       a gaveta abre, dois sinos metalicos (duas senoides desafinadas), a gaveta
       bate. Venda grande ganha um terceiro sino. */
    cash(big){
      noise(.05,.12,300);
      setTimeout(()=>{tone(1568,.42,'sine',.13);tone(2093,.38,'sine',.07);},40);
      setTimeout(()=>{tone(1319,.5,'sine',.11);tone(1976,.42,'sine',.06);},130);
      if(big)setTimeout(()=>{tone(2637,.44,'sine',.10);tone(1976,.4,'sine',.05);},235);
      setTimeout(()=>{noise(.03,.09,180);tone(90,.05,'triangle',.08);},420);
    },
    mint(){tone(200,.09,'square',.14,420);},
    reveal(r){const base=[300,340,380,440,520,640][r]||300;
      [0,90,180,300].forEach((d,i)=>setTimeout(()=>tone(base*(1+i*.28),.12+i*.03,'square',.14),d));
      if(r>=3)setTimeout(()=>{noise(.4,.1,400);},260);},
    tick(){tone(1500,.012,'square',.05);},
    notify(){tone(760,.07,'triangle',.16);setTimeout(()=>tone(1010,.11,'triangle',.14),70);},
    tax(){[0,140,280].forEach((d,i)=>setTimeout(()=>tone(160-i*22,.24,'sawtooth',.2),d));},
    levelup(){[523,659,784,1046,1318].forEach((f,i)=>setTimeout(()=>tone(f,.16,'square',.15),i*85));},
    key(kind){
      /* a membrane keyboard from 1998: a bit of plastic clack and a low thock,
         detuned a little every press so it never sounds like one sample */
      if(muted)return;const c=ac();if(!c)return;
      const heavy=kind==='space'||kind==='enter';
      noise(heavy?.022:.014, heavy?.11:.075, 2600+Math.random()*1800);
      const f=(heavy?95:150)+Math.random()*(heavy?25:60);
      tone(f,.022,'square',heavy?.055:.035,f*0.62);
      if(kind==='enter')setTimeout(()=>tone(70,.05,'triangle',.05),12);
    },
    modem(){
      /* a very short 56k handshake: two carriers and a burst of noise */
      tone(1100,.09,'sine',.05);
      setTimeout(()=>tone(1750,.11,'sine',.045),90);
      setTimeout(()=>noise(.20,.05,600),200);
      setTimeout(()=>tone(980,.07,'sine',.04),380);
    },
    boot(){tone(392,.28,'triangle',.16);setTimeout(()=>tone(523,.3,'triangle',.15),150);setTimeout(()=>tone(784,.5,'triangle',.14),300);},
    toggle(v){muted=v!==undefined?v:!muted;return muted;},
    get muted(){return muted;},
    warm(){ac();}
  };
})();
