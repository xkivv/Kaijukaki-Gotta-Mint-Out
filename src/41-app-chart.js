/* ================= APP: KAIJU CHARTS (candlesticks) ================= */
/* 1H ou 1D: escolha do jogador, guardada no registrador (G.prefs) */
const CV=prefView({scale:'chartScale'});
APPS.chart={
  title:'Kaiju Charts', icon:'chart', w:560, h:420, status:true,
  build(b,ent){
    b.innerHTML=`<div class="chartroot">
      <div class="chart-top">
        <div class="ch-pair">KAIJU / <span>$KM</span></div>
        <div class="ch-last" data-chlast="1"></div>
        <div class="grow"></div>
        <div class="ch-scale">
          <button class="btn" data-cs="h">1H</button>
          <button class="btn" data-cs="d">1D</button>
        </div>
      </div>
      <div class="chart-stage"><canvas data-chart="1"></canvas>
        <div class="ch-tip" data-chtip="1" style="display:none"></div></div>
      <div class="chart-legend" data-chleg="1"></div>
    </div>`;
    this.refresh(b,ent);
  },
  onResize(b,ent){this.refresh(b,ent);},
  refresh(b,ent){
    const root=$('.chartroot',b);if(!root)return;
    $$('[data-cs]',root).forEach(x=>{
      x.classList.toggle('on',x.dataset.cs===CV.scale);
      x.onclick=()=>{SFX.click();CV.scale=x.dataset.cs;APPS.chart.refresh(b,ent);};
    });
    const data=series();
    const last=data.length?data[data.length-1]:null;
    const prev=data.length>1?data[data.length-2]:last;
    const chg=last&&prev&&prev.c?((last.c/prev.c-1)*100):0;
    $('[data-chlast]',root).innerHTML=last
      ? `<b>${money(last.c)}</b> <span class="${chg>=0?'up':'down'}">${chg>=0?'+':''}${chg.toFixed(2)}%</span>`
      : '<b>—</b>';
    $('[data-chleg]',root).innerHTML=`
      <span>${t('Candles')}: <b>${data.length}</b></span>
      <span>${t('Volume')}: <b>${num(data.reduce((a,x)=>a+(x.v||0),0))}</b> ${t('mints')}</span>
      <span>${t('High')}: <b>${money(Math.max.apply(null,data.map(x=>x.h).concat([0])))}</b></span>
      <span>${t('Low')}: <b>${money(data.length?Math.min.apply(null,data.map(x=>x.l)):0)}</b></span>`;
    drawCandles($('[data-chart]',root),data,$('[data-chtip]',root));
    const s1=ent.win.querySelector('.st1'),s2=ent.win.querySelector('.st2');
    if(s1){s1.textContent=t('Floor {0} · Hype {1}%',money(floorPrice()),G.hype.toFixed(0));
      s2.textContent=CV.scale==='h'?t('1 hour'):t('1 day');}
  }
};
function series(){
  if(CV.scale==='h'){
    const arr=G.icandles.slice();
    if(G.curCandle)arr.push(G.curCandle);
    return arr;
  }
  const arr=G.candles.slice();
  const fp=floorPrice();
  arr.push({o:arr.length?arr[arr.length-1].c:fp,h:fp,l:fp,c:fp,v:G.log.mint});
  return arr;
}
/* CUIDADO: aqui dentro nao existe --fs. O tamanho da letra e string de canvas,
   entao a escala da interface tem que entrar NA MAO (uiScale). Os precos do
   eixo e a etiqueta do ultimo preco eram 10px de VT323 — o dono reclamou
   exatamente disto. VT323 desenha pequeno: 17px dele lê como ~12 de Tahoma,
   entao o piso aqui e 17 e ele cresce junto com a interface. */
function chartFont(K,base,bold){
  return (bold?'bold ':'')+Math.max(base,Math.round(base*K))+'px "VT323", monospace';
}
function drawCandles(cv,data,tip){
  if(!cv)return;
  const K=(typeof uiScale==='function')?uiScale():1;
  const host=cv.parentNode;
  const W=Math.max(200,host.clientWidth||420), H=Math.max(140,host.clientHeight||220);
  const dpr=Math.min(2,window.devicePixelRatio||1);
  cv.width=W*dpr;cv.height=H*dpr;cv.style.width=W+'px';cv.style.height=H+'px';
  const g=cv.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);
  g.fillStyle='#0a1204';g.fillRect(0,0,W,H);
  if(!data.length){
    g.fillStyle='#7fb03a';g.font=chartFont(K,20);g.textAlign='center';g.textBaseline='middle';
    g.fillText(t('No candles yet — play a few hours.'),W/2,H/2);
    g.textAlign='left';g.textBaseline='alphabetic';return;
  }
  let hi=-Infinity,lo=Infinity,vmax=0;
  data.forEach(c=>{if(c.h>hi)hi=c.h;if(c.l<lo)lo=c.l;if((c.v||0)>vmax)vmax=c.v||0;});
  if(hi===lo){hi*=1.02;lo*=0.98;}
  const span=hi-lo, pad0=span*0.12;
  hi+=pad0;lo-=pad0;
  /* a coluna dos precos e medida, nao chutada: com a letra maior um 58 fixo
     cortava o "$1,240" pela metade */
  const fAxis=chartFont(K,17), fpx=parseInt(fAxis,10);
  g.font=fAxis;
  let maxLab=0;
  for(let i=0;i<=4;i++){
    const w=g.measureText(money(lo+(hi-lo)*i/4)).width;
    if(w>maxLab)maxLab=w;
  }
  const padL=Math.round(6*K), padT=Math.round(8*K), gap=Math.round(6*K);
  const padR=Math.min(Math.round(W*0.42),Math.ceil(maxLab)+Math.round(14*K));
  const volH=Math.round(H*0.22);
  const plotW=Math.max(40,W-padL-padR), plotH=Math.max(30,H-padT-volH-gap-4);
  const y=v=>padT+plotH-((v-lo)/(hi-lo))*plotH;
  /* com a letra grande num painel baixo, cinco precos empilhados se encavalam:
     a grade perde linhas ate cada rotulo ter o seu espaco */
  const passos=Math.max(1,Math.min(4,Math.floor(plotH/(fpx*1.5))));
  const lastC=data[data.length-1].c;
  const tagH=Math.round(fpx*1.35)+Math.round(4*K);
  const tagY=clamp(y(lastC),tagH/2,H-tagH/2);
  /* grid + price axis */
  g.textBaseline='middle';
  for(let i=0;i<=passos;i++){
    const v=lo+(hi-lo)*i/passos, yy=y(v);
    g.strokeStyle='rgba(168,232,50,.10)';g.lineWidth=1;
    g.beginPath();g.moveTo(padL,Math.round(yy)+.5);g.lineTo(padL+plotW,Math.round(yy)+.5);g.stroke();
    /* o preco do momento tem etiqueta propria: nao deixa outro rotulo por baixo */
    if(Math.abs(yy-tagY)<tagH*0.95)continue;
    g.fillStyle='#8fbf4a';g.fillText(money(v),padL+plotW+Math.round(5*K),yy);
  }
  const n=data.length;
  const cw=Math.max(2,Math.min(18,plotW/n-2));
  const step=plotW/n;
  data.forEach((c,i)=>{
    const x=padL+i*step+step/2;
    const up=c.c>=c.o;
    const col=up?'#a8e832':'#d24b3a';
    g.strokeStyle=col;g.fillStyle=col;g.lineWidth=1;
    g.beginPath();g.moveTo(Math.round(x)+.5,y(c.h));g.lineTo(Math.round(x)+.5,y(c.l));g.stroke();
    const yo=y(c.o),yc=y(c.c);
    const top=Math.min(yo,yc), h=Math.max(1.5,Math.abs(yc-yo));
    if(up){g.fillStyle='#0a1204';g.fillRect(x-cw/2,top,cw,h);g.strokeRect(Math.round(x-cw/2)+.5,Math.round(top)+.5,cw,h);}
    else g.fillRect(x-cw/2,top,cw,h);
    if(vmax>0&&c.v){
      const vh=Math.max(1,(c.v/vmax)*(volH-6));
      g.globalAlpha=.55;g.fillStyle=col;
      g.fillRect(x-cw/2,H-4-vh,cw,vh);g.globalAlpha=1;
    }
  });
  /* last price line */
  g.setLineDash([3,3]);g.strokeStyle='#d4ff6b';g.lineWidth=1;
  g.beginPath();g.moveTo(padL,Math.round(y(lastC))+.5);g.lineTo(padL+plotW,Math.round(y(lastC))+.5);g.stroke();
  g.setLineDash([]);
  /* a etiqueta do ultimo preco: a caixa cresce com a letra, senao o numero
     vaza por cima das velas */
  g.fillStyle='#d4ff6b';g.fillRect(padL+plotW+2,tagY-tagH/2,padR-4,tagH);
  g.fillStyle='#16250a';g.font=chartFont(K,17,true);
  g.fillText(money(lastC),padL+plotW+Math.round(5*K),tagY);
  /* volume baseline */
  g.strokeStyle='rgba(168,232,50,.18)';
  g.beginPath();g.moveTo(padL,H-3.5);g.lineTo(padL+plotW,H-3.5);g.stroke();
  /* hover */
  cv.onmousemove=e=>{
    const r=cv.getBoundingClientRect();
    const i=clamp(Math.floor((e.clientX-r.left-padL)/step),0,n-1);
    const c=data[i];if(!c||!tip)return;
    tip.style.display='block';
    tip.style.left=clamp(e.clientX-r.left+10,4,W-150)+'px';
    tip.style.top='8px';
    tip.innerHTML=`O ${money(c.o)}<br>H ${money(c.h)}<br>L ${money(c.l)}<br>C ${money(c.c)}<br>V ${num(c.v||0)}`;
  };
  cv.onmouseleave=()=>{if(tip)tip.style.display='none';};
  if(typeof mobWireChartTouch==='function')
    mobWireChartTouch(cv,e=>cv.onmousemove(e),()=>{if(tip)tip.style.display='none';});
}
