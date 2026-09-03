/* MEDIDOR PROFUNDO — anda pelas ABAS e sub-telas, nao so a primeira tela.
   uso: node tools/leg2.js [larg] [alt] [uiClass] [txtClass]  */
const {chromium}=require('playwright');
const W=+(process.argv[2]||1366),H=+(process.argv[3]||900);
const UIC=process.argv[4]||'', TXC=process.argv[5]||'';
(async()=>{
const b=await chromium.launch({executablePath:(process.env.KK_CHROME||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome')});
const p=await b.newPage({viewport:{width:W,height:H}});
const errs=[];p.on('pageerror',e=>errs.push(String(e)));
await p.goto('file://'+require('path').resolve(__dirname,'../dist/')+'/kaijukaki.html');
await p.waitForTimeout(2500);
const sr=await p.$('.slotrow');
if(sr){await sr.click();await p.waitForTimeout(400);
  await p.evaluate(()=>{const x=[...document.querySelectorAll('.btn')].find(y=>/LOG ON/i.test(y.textContent));if(x)x.click();});
  await p.waitForTimeout(4500);}
await p.evaluate(()=>{const v=document.querySelector('#wizveil');if(v){v.remove();G.walletMade=true;G.nick='kiv';save();start();}});
await p.waitForTimeout(2500);
if(UIC||TXC)await p.evaluate(([u,t])=>{
  if(u){document.body.classList.remove('ui-s','ui-l','ui-xl');if(u!=='ui')document.body.classList.add(u);}
  if(t){document.body.classList.remove('txt-s','txt-m','txt-l');document.body.classList.add(t);}
},[UIC,TXC]);
await p.evaluate(()=>{
  G.money=250000;G.minted=4200;G.hype=58;G.day=22;G.hour=12;G.min=0;
  G.freeMints=0;G.coupon=1;G.xp=400;G.contract=2;G.gasLv=1;G.bulk=2;G.listLv=1;
  for(let i=0;i<14;i++)ownToken(buildToken(1+Math.floor(Math.random()*8888),G.day));
  G.tokens[0].listed=90;G.tokens[1].staked=true;G.tokens[1].stakedDay=1;
  for(let i=0;i<12;i++){try{makeMktListing();}catch(e){}}
  for(let i=0;i<4;i++){try{makeOffer(true);}catch(e){}}
  G.taxDue=0;G.level=3;G.bestLevel=3;G.peakHeld=14;
  G.seenRaces=KK_META.dict.Race.slice(0,24);
  G.achv=['sale1','race10'];
  /* MODO HISTORIA: sem isto o medidor so enxerga os quatro apps do dia 1 */
  if(typeof story==='function'){
    const S=story();
    (typeof BEATS!=='undefined'?BEATS:[]).forEach(b=>{S.seen[b.id]=1;(b.un||[]).forEach(u=>unlock(u,true));});
    S.q=[];
    if(typeof prefMap==='function'){const m=prefMap('wgt');m.chart=1;m.gas=1;m.clock=1;}
  }
  if(typeof rollQuests==='function')rollQuests(1);
  /* semeia conversas: sem elas a aba Messages só mostra o estado vazio e a
     tela de verdade (balões, oferta, opções de resposta) nunca é medida */
  try{
    const S=soc();S.threads=[];
    socialDM('artschool_dropout','you bought above floor. not many people do that. noted.',1);
    socialDM('first_day_holder','hey. you have been minting a lot. respect.',1);
    const th=thread('zomboy_floor_watch');th.lastAt=-99;
    socialDM('zomboy_floor_watch','I want that one. name is on the offer.',1,
      {tk:G.tokens[0].id,price:tokenValue(G.tokens[0])*1.15});
    KV.dm='zomboy_floor_watch';KV.dmOpen=1;
  }catch(e){}
  save();UI.refresh();
});
await p.waitForTimeout(700);
await p.evaluate(()=>document.querySelectorAll('.lvlup,#lvlveil').forEach(e=>e.remove()));
const LIM=await p.evaluate(()=>{const d=document.createElement('div');d.style.fontSize='calc(15px * var(--fs))';
  document.body.appendChild(d);const v=parseFloat(getComputedStyle(d).fontSize);d.remove();return v;});
console.log('limite '+LIM.toFixed(1)+'px | '+W+'x'+H+' | '+(await p.evaluate(()=>document.body.className)));

const scan=async(label)=>{
  const r=await p.evaluate(lim=>{
    const out=[];
    /* ERRO ANTIGO DESTE MEDIDOR: ele só olhava elementos SEM filhos. Uma frase
       como "…e <b>derrubar queima o hype</b>." tem um filho, então a frase
       inteira era pulada e só o pedaço em negrito era medido. Era exatamente
       onde estavam os textos que o Kiv reportou.
       Agora quem manda é o NÓ DE TEXTO: todo pedaço de texto visível na tela é
       medido pelo tamanho que o pai dele desenha. */
    document.querySelectorAll('.win,#hud,#taskbar,.thought,.toast,.wgt,.ctxmenu,#startmenu,.modal,#modalveil').forEach(w=>{
      const it=document.createNodeIterator(w,NodeFilter.SHOW_TEXT);
      let n;
      while((n=it.nextNode())){
        const txt=(n.nodeValue||'').trim();
        if(txt.length<2)continue;
        const e=n.parentElement;
        if(!e)continue;
        if(/^(SCRIPT|STYLE|TITLE|OPTION)$/.test(e.tagName))continue;
        const cs=getComputedStyle(e);
        if(cs.display==='none'||cs.visibility==='hidden'||+cs.opacity===0)continue;
        const rc=e.getBoundingClientRect();
        if(rc.width<2||rc.height<2)continue;
        const fs=parseFloat(cs.fontSize);
        /* CONTRASTE: "letra fina e cansativa" quase nunca e so tamanho. Cinza
           sobre cinza a 4:1 cansa mesmo em 20px. A regra aqui e a da WCAG AA:
           4.5:1 pra texto normal, 3:1 pra texto grande/negrito. */
        const lum=c=>{const m=c.match(/[\d.]+/g);if(!m)return null;
          const a=m.slice(0,3).map(v=>{v=+v/255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);});
          return .2126*a[0]+.7152*a[1]+.0722*a[2];};
        let bgc=null,n2=e,grad=false;
        while(n2&&!bgc){const s2=getComputedStyle(n2);
          /* gradiente, imagem, ou texto com sombra/contorno: nao da pra medir
             contraste por cor plana, entao nao chuta — reporta so o tamanho.
             Sem isto o medidor acusava titulo branco sobre barra azul como se
             fosse branco sobre cinza, e enchia o relatorio de falso positivo. */
          if(s2.backgroundImage&&s2.backgroundImage!=='none'){grad=true;break;}
          const b2=s2.backgroundColor;
          const mm=b2.match(/[\d.]+/g);
          if(mm&&(mm.length<4||+mm[3]>=.85))bgc=b2;
          n2=n2.parentElement;}
        if(cs.textShadow&&cs.textShadow!=='none')grad=true;
        if(cs.mixBlendMode&&cs.mixBlendMode!=='normal')grad=true;
        if(grad)bgc=null;
        const lf=lum(cs.color), lb=bgc?lum(bgc):null;
        let cr=null;
        if(lf!=null&&lb!=null){const a1=Math.max(lf,lb)+.05,b1=Math.min(lf,lb)+.05;cr=a1/b1;}
        const grande=fs>=24||(fs>=19&&(+cs.fontWeight>=600||cs.fontWeight==='bold'));
        const minCr=grande?3:4.5;
        const ruimFs=fs<lim-0.05, ruimCr=(cr!=null&&cr<minCr-0.02);
        if(ruimFs||ruimCr)out.push({fs:+fs.toFixed(1),cr:cr?+cr.toFixed(2):null,why:(ruimFs?'T':'')+(ruimCr?'C':''),
          sel:(e.className&&typeof e.className==='string'&&e.className)?'.'+e.className.trim().split(/\s+/).join('.'):e.tagName,
          ff:cs.fontFamily.split(',')[0].replace(/"/g,''),fg:cs.color,bg:bgc,t:txt.slice(0,42)});
      }
    });
    return out;},LIM);
  const seen=new Map();r.forEach(x=>{const k=x.sel+'|'+x.fs+'|'+x.why;if(!seen.has(k))seen.set(k,x);});
  if(seen.size){console.log('\n### '+label+'  ('+seen.size+')');
    [...seen.values()].sort((a,b)=>a.fs-b.fs).forEach(x=>
      console.log('  ['+x.why.padEnd(2)+'] '+String(x.fs).padStart(5)+'px cr'+String(x.cr==null?'--':x.cr).padStart(5)+
        '  '+x.sel.padEnd(26)+' '+String(x.fg).padEnd(20)+' on '+String(x.bg).padEnd(20)+' "'+x.t+'"'));}
  return seen.size;
};
let total=0;
const APPS=['site','hubmarket','hubwallet','hubsocial','shop','free','media','tax','inbox','readme','spot','chart','profile','about','binder','vault','datetime','story_log'];
for(const a of APPS){
  await p.evaluate(()=>Object.keys(UI.open||{}).forEach(k=>UI.closeApp(k)));
  await p.waitForTimeout(180);
  await p.evaluate(id=>{try{UI.openApp(id);}catch(e){console.error(e);}},a);
  await p.waitForTimeout(1100);
  /* a janela do app cresce ate onde a tela deixa: sem isso metade das abas
     nasce com barra de rolagem e o medidor nao ve o que esta escondido */
  total+=await scan(a);
  /* percorre TODA aba clicavel, inclusive as de hub */
  const abas=await p.evaluate(()=>[...document.querySelectorAll('.win .tab:not(.on):not(.locked)')].length);
  for(let i=0;i<abas;i++){
    const ok=await p.evaluate(i=>{const t=[...document.querySelectorAll('.win .tab:not(.locked)')][i];
      if(!t)return null;t.click();return t.innerText.trim().slice(0,20);},i);
    if(!ok)continue;
    await p.waitForTimeout(800);
    total+=await scan(a+' › '+ok);
  }
}
console.log('\nTOTAL FORA DA REGRA: '+total);
if(errs.length)console.log('ERROS:',errs.slice(0,6));
await b.close();process.exit(total?1:0);
})();
