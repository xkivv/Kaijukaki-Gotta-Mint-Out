/* ================= KAIJU MEDIA PLAYER =================
   A slow, warm chiptune loop written in code: triangle bass, square arp,
   soft square lead and a brushed noise hat. No audio files. */
const MUSIC=(()=>{
  let ctx=null,bus=null,playing=false,timer=0,step=0,startAt=0;
  const N=n=>440*Math.pow(2,(n-69)/12);
  /* ---- duas faixas. A segunda so aparece com o codigo TEAMBOAT. ---- */
  const TRACKS={
    lofi:{
      id:'lofi', name:'kakizone_lofi.mod', label:'KAKIZONE LO-FI', bpm:84, swing:0, hatv:0.055,
      /* Fmaj7 - Am7 - Bbmaj7 - C7, dois compassos cada */
      prog:[{root:53,arp:[65,69,72,77]},{root:57,arp:[69,72,76,79]},
            {root:58,arp:[70,74,77,81]},{root:60,arp:[72,76,79,82]}],
      lead:[[0,84,2],[4,81,1],[6,79,2],[10,77,3],
            [16,79,2],[20,81,1],[22,84,3],[28,81,2],
            [32,86,2],[36,84,1],[38,81,2],[42,79,3],
            [48,77,2],[52,79,1],[54,81,4],[60,-1,0]]
    },
    /* Homenagem original ao som de ilha dos anos 80: acordes maiores preguicosos,
       swing leve e uma melodia escrita do zero. Nao e a musica de verdade. */
    kokomo:{
      id:'kokomo', name:'island_drift.mod', label:'ISLAND DRIFT (TEAMBOAT)', bpm:98, swing:0.16, hatv:0.075,
      /* C - Am - F - G, cheirinho de coqueiro */
      prog:[{root:48,arp:[64,67,72,76]},{root:45,arp:[64,69,72,76]},
            {root:53,arp:[65,69,72,77]},{root:55,arp:[67,71,74,79]}],
      lead:[[0,72,2],[3,74,1],[4,76,3],[8,79,2],[12,76,2],
            [16,74,2],[19,72,1],[20,74,3],[24,69,4],
            [32,77,2],[35,76,1],[36,74,3],[40,72,2],[44,69,2],
            [48,67,2],[51,69,1],[52,71,3],[56,72,5],[62,-1,0]]
    }
  };
  let TK=TRACKS.lofi;
  let SPB=60/TK.bpm, STEP=SPB/2;
  function useTrack(id){
    TK=TRACKS[id]||TRACKS.lofi;
    SPB=60/TK.bpm;STEP=SPB/2;
    return TK;
  }
  const TOTAL=64;
  function ac(){
    if(!ctx){
      try{ctx=new (window.AudioContext||window.webkitAudioContext)();}catch(e){return null;}
      bus=ctx.createGain();bus.gain.value=0.0;
      const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=5200;
      bus.connect(lp);lp.connect(ctx.destination);
    }
    if(ctx.state==='suspended')ctx.resume();
    return ctx;
  }
  function voice(freq,at,dur,type,vol,glideTo){
    const o=ctx.createOscillator(),g=ctx.createGain();
    o.type=type;o.frequency.setValueAtTime(freq,at);
    if(glideTo)o.frequency.linearRampToValueAtTime(glideTo,at+dur*.9);
    g.gain.setValueAtTime(0,at);
    g.gain.linearRampToValueAtTime(vol,at+0.012);
    g.gain.setTargetAtTime(0.0001,at+dur*0.55,dur*0.22);
    o.connect(g);g.connect(bus);o.start(at);o.stop(at+dur+0.12);
  }
  function hat(at,vol){
    const n=Math.floor(ctx.sampleRate*0.05),buf=ctx.createBuffer(1,n,ctx.sampleRate),d=buf.getChannelData(0);
    for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,3);
    const s=ctx.createBufferSource();s.buffer=buf;
    const f=ctx.createBiquadFilter();f.type='highpass';f.frequency.value=6200;
    const g=ctx.createGain();g.gain.value=vol;
    s.connect(f);f.connect(g);g.connect(bus);s.start(at);
  }
  function kick(at){
    const o=ctx.createOscillator(),g=ctx.createGain();
    o.type='sine';o.frequency.setValueAtTime(130,at);
    o.frequency.exponentialRampToValueAtTime(45,at+0.14);
    g.gain.setValueAtTime(0.30,at);g.gain.exponentialRampToValueAtTime(0.0001,at+0.20);
    o.connect(g);g.connect(bus);o.start(at);o.stop(at+0.24);
  }
  function schedule(){
    const now=ctx.currentTime;
    while(startAt<now+0.35){
      const s=step%TOTAL, ch=TK.prog[Math.floor(s/16)%4];
      /* swing: as notas impares atrasam um tiquinho */
      const sw=(s%2)?STEP*TK.swing:0;
      if(s%8===0)voice(N(ch.root-12),startAt,SPB*1.6,'triangle',0.20);
      if(s%8===4)voice(N(ch.root-5-12),startAt,SPB*0.7,'triangle',0.15);
      voice(N(ch.arp[(s%4+Math.floor(s/4))%4]),startAt+sw,STEP*0.85,'square',0.045);
      const L=TK.lead.find(x=>x[0]===s);
      if(L&&L[1]>0)voice(N(L[1]),startAt+sw,STEP*L[2]*0.92,'square',0.075);
      if(s%4===2)hat(startAt+sw,TK.hatv);
      if(s%8===0||s%8===6)kick(startAt);
      step++;startAt+=STEP;
    }
  }
  /* volume do jogador, lembrado. Antes o play() sempre voltava em 0.5 e
     ignorava o slider. */
  let vol=0.5, wasPlaying=false;
  function ramp(to,ms){
    if(!ctx||!bus)return;
    const now=ctx.currentTime;
    bus.gain.cancelScheduledValues(now);
    bus.gain.setValueAtTime(bus.gain.value,now);
    bus.gain.linearRampToValueAtTime(to,now+(ms||300)/1000);
  }
  return {
    get playing(){return playing;},
    get vol(){return vol;},
    get step(){return step%TOTAL;},
    get track(){return TK;},
    tracks(){return TRACKS;},
    setTrack(id){const was=playing;useTrack(id);if(was){step=0;}
      if(typeof setPref==='function')setPref('musicTrack',TK.id);
      return TK;},
    toggle(){playing?this.stop():this.play();return playing;},
    play(){
      const c=ac();if(!c)return false;
      if(typeof pref==='function')vol=clamp(+pref('musicVol'),0,1);
      playing=true;wasPlaying=false;startAt=c.currentTime+0.08;
      if(typeof setPref==='function')setPref('musicOn',true,true);
      ramp(vol,600);
      schedule();
      clearInterval(timer);timer=setInterval(schedule,90);
      return true;
    },
    stop(){
      playing=false;wasPlaying=false;clearInterval(timer);
      ramp(0,300);
      if(typeof setPref==='function'){setPref('musicOn',false,true);if(typeof save==='function')save();}
    },
    /* o slider corre: escreve calado e o save vem no soltar (volEnd) */
    setVol(v){vol=clamp(+v||0,0,1);if(typeof setPref==='function')setPref('musicVol',vol,true);if(playing)ramp(vol,80);},
    volEnd(){if(typeof save==='function')save();},
    /* o dia fecha: some devagar, mas nao marca playing=false — senao o
       visualizador morre antes do som acabar e o botao pisca pra PLAY */
    fadeOut(ms){
      if(!playing)return false;
      wasPlaying=true;ramp(0,ms||700);
      setTimeout(()=>{if(wasPlaying)clearInterval(timer);},(ms||700)+40);
      return true;
    },
    /* o dia seguinte abre: volta de onde parou, subindo */
    fadeIn(ms){
      if(!wasPlaying)return false;
      wasPlaying=false;
      const c=ac();if(!c)return false;
      startAt=c.currentTime+0.08;schedule();
      clearInterval(timer);timer=setInterval(schedule,90);
      ramp(vol,ms||1200);
      return true;
    }
  };
})();

APPS.media={
  title:'Kaiju Media Player', icon:'music', w:330, h:250, status:true,
  build(b,ent){
    b.innerHTML=`<div class="pad" style="padding:8px">
      <div class="mp-screen"><canvas data-viz="1"></canvas>
        <div class="mp-title"><span data-mptitle="1">${MUSIC.track.name}</span></div></div>
      <div class="row" style="margin-top:8px;gap:5px">
        <button class="btn" data-mpplay="1" style="min-width:74px">&#9654; ${t('PLAY')}</button>
        <button class="btn" data-mpstop="1" style="min-width:64px">&#9632; ${t('STOP')}</button>
        <div class="grow"></div>
        <span class="tiny dim">${t('VOL')}</span>
        <input type="range" data-mpvol="1" min="0" max="100" value="${Math.round((typeof pref==='function'?pref('musicVol'):MUSIC.vol)*100)}" style="width:82px">
      </div>
      <div class="mp-list" data-mplist="1"></div>
      <div class="tiny dim" style="margin-top:7px;line-height:1.6" data-mpnote="1"></div>
    </div>`;
    const cv=$('[data-viz]',b);
    mountViz(cv);
    const pb=$('[data-mpplay]',b);
    const owned=()=>['lofi'].concat((G.tracks||[]).filter(x=>x!=='lofi'));
    const sync=()=>{
      pb.innerHTML=MUSIC.playing?('&#10074;&#10074; '+t('PAUSE')):('&#9654; '+t('PLAY'));
      const T=MUSIC.tracks(),list=owned();
      $('[data-mptitle]',b).textContent=MUSIC.track.name;
      $('[data-mplist]',b).innerHTML=list.map((id,i)=>{
        const tr=T[id];if(!tr)return '';
        return `<button class="mp-tr${MUSIC.track.id===id?' on':''}" data-mptr="${id}">
          <span class="mp-n">${i+1}</span><span class="mp-l">${tr.label}</span>
          ${MUSIC.track.id===id&&MUSIC.playing?'<span class="mp-eq">&#9835;</span>':''}</button>`;}).join('');
      $('[data-mpnote]',b).textContent=list.length>1
        ? t('Track {0} of {1} · looped forever, like the bear market.',list.indexOf(MUSIC.track.id)+1,list.length)
        : t('Track 1 of 1 · looped forever, like the bear market.');
      $$('[data-mptr]',b).forEach(x=>x.onclick=()=>{
        SFX.click();
        MUSIC.setTrack(x.dataset.mptr);
        if(!MUSIC.playing)MUSIC.play();
        sync();
        const s2=ent.win.querySelector('.st1');if(s2)s2.textContent=MUSIC.track.label;
      });
      const s1=ent.win.querySelector('.st1');if(s1)s1.textContent=MUSIC.track.label;
    };
    pb.onclick=()=>{SFX.click();MUSIC.toggle();sync();};
    $('[data-mpstop]',b).onclick=()=>{SFX.click();MUSIC.stop();sync();};
    const vsl=$('[data-mpvol]',b);
    vsl.oninput=e=>MUSIC.setVol(+e.target.value/100);
    vsl.onchange=()=>MUSIC.volEnd();
    sync();
  }
};
function mountViz(cv){
  const W=290,H=76,dpr=Math.min(2,window.devicePixelRatio||1);
  cv.width=W*dpr;cv.height=H*dpr;cv.style.width='100%';cv.style.height=H+'px';
  const g=cv.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);
  const bars=28;const vals=new Array(bars).fill(0);
  let raf=0;
  const loop=()=>{
    if(!cv.isConnected){cancelAnimationFrame(raf);return;}
    g.fillStyle='#0a1204';g.fillRect(0,0,W,H);
    for(let i=0;i<bars;i++){
      const target=MUSIC.playing?(0.18+Math.abs(Math.sin(Date.now()/320+i*0.55))*(0.5+0.5*Math.sin(Date.now()/900+i)))*H*0.8:2;
      vals[i]+=(target-vals[i])*0.18;
      const w=Math.floor(W/bars)-2;
      const h=Math.max(2,vals[i]);
      const grd=g.createLinearGradient(0,H-h,0,H);
      grd.addColorStop(0,'#d4ff6b');grd.addColorStop(1,'#4d7a14');
      g.fillStyle=grd;
      g.fillRect(i*(w+2)+2,H-h-3,w,h);
    }
    g.strokeStyle='rgba(168,232,50,.18)';g.lineWidth=1;
    for(let y=6;y<H;y+=6){g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke();}
    raf=requestAnimationFrame(loop);
  };
  raf=requestAnimationFrame(loop);
}
