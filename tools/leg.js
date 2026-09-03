/* MEDIDOR DE LEGIBILIDADE
   uso: node tools/leg.js <app1,app2,...> [largura] [altura]
   Abre o jogo com a configuracao PADRAO (UI Large, Text Medium), abre cada app
   e lista TODO texto que uma pessoa le renderizando abaixo de 15px * --fs.
   Sai com codigo 1 se achar alguma coisa. */
const {chromium}=require('playwright');
const apps=(process.argv[2]||'site').split(',').filter(Boolean);
const W=+(process.argv[3]||1366), H=+(process.argv[4]||900);
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
await p.evaluate(()=>{
  G.money=250000;G.minted=4200;G.hype=58;G.day=22;G.hour=12;G.min=0;
  G.freeMints=2;G.coupon=1;G.xp=400;G.contract=2;G.gasLv=1;G.bulk=2;G.listLv=1;
  for(let i=0;i<14;i++)ownToken(buildToken(1+Math.floor(Math.random()*8888),G.day));
  G.tokens[0].listed=90;G.tokens[1].staked=true;G.tokens[1].stakedDay=1;
  G.taxDue=320;G.taxRows=[['tx',80,3],['power',60,2],['comm',70,40],['liq',50,4],['rent',30,2],['inc',30,12]];
  if(typeof rollQuests==='function')rollQuests(1);
  G.level=3;G.bestLevel=3;G.peakHeld=14;save();UI.refresh();
  document.querySelectorAll('.lvlup,#lvlveil,.modal').forEach(e=>e.remove());
});
await p.waitForTimeout(700);
/* o LIMITE: 15px * --fs, medido no proprio documento */
const LIM=await p.evaluate(()=>{
  const d=document.createElement('div');d.style.fontSize='calc(15px * var(--fs))';
  document.body.appendChild(d);const v=parseFloat(getComputedStyle(d).fontSize);d.remove();return v;});
console.log('limite = '+LIM.toFixed(1)+'px  (15px * --fs)   viewport '+W+'x'+H);
let total=0;
for(const a of apps){
  await p.evaluate(()=>{Object.keys(UI.open||{}).forEach(k=>UI.closeApp(k));});
  await p.waitForTimeout(200);
  await p.evaluate(id=>{try{UI.openApp(id);}catch(e){console.error(e);}},a);
  await p.waitForTimeout(1200);
  const r=await p.evaluate(lim=>{
    const out=[];
    document.querySelectorAll('.win,#hud,#taskbar,.thought,.toast,.wgt,.ctxmenu,#startmenu,.modal').forEach(w=>{
      w.querySelectorAll('*').forEach(e=>{
        if(e.children.length)return;
        const txt=(e.textContent||'').trim();
        if(!txt||txt.length<2)return;
        const cs=getComputedStyle(e);
        if(cs.display==='none'||cs.visibility==='hidden'||+cs.opacity===0)return;
        const rc=e.getBoundingClientRect();
        if(rc.width<2||rc.height<2)return;
        const fs=parseFloat(cs.fontSize);
        if(fs<lim-0.05)out.push({fs:+fs.toFixed(1),
          sel:(e.className&&typeof e.className==='string'&&e.className)?'.'+e.className.trim().split(/\s+/).join('.'):e.tagName,
          ff:cs.fontFamily.split(',')[0].replace(/"/g,''),t:txt.slice(0,44)});
      });
    });
    return out;
  },LIM);
  const seen=new Map();
  r.forEach(x=>{const k=x.sel+'|'+x.fs;if(!seen.has(k))seen.set(k,x);});
  if(seen.size){
    total+=seen.size;
    console.log('\n### '+a+'  ('+seen.size+' distintos, '+r.length+' nos)');
    [...seen.values()].sort((a,b)=>a.fs-b.fs).forEach(x=>
      console.log('   '+String(x.fs).padStart(5)+'px  '+x.ff.padEnd(15)+' '+x.sel.padEnd(34)+' "'+x.t+'"'));
  } else console.log('\n### '+a+'  OK');
}
console.log('\nTOTAL FORA DA REGRA: '+total);
if(errs.length)console.log('ERROS DE PAGINA:',errs.slice(0,6));
await b.close();
process.exit(total?1:0);
})();
