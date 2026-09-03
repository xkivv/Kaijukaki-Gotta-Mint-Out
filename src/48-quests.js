/* ================= MINIQUESTS =================
   Objetivos diarios e semanais que crescem junto com o jogador. A recompensa e
   deliberadamente pequena perto dos royalties: isso e orientacao, nao torneira.
   Comeca facil (mintar 3) e vai apertando conforme o rank e o supply sobem. */
function questScale(){
  return 1+G.bestLevel*0.55+(G.minted/SUPPLY)*3.5+Math.min(2,G.day/25);
}
/* ---------- QUANTO UMA MISSAO PAGA ----------
   Estava pagando ~$37 no dia 1, com o jogador tendo $40 na carteira: uma
   missao dobrava o patrimonio. Missao e orientacao, nao torneira — no comeco
   ela paga o equivalente a uns dois mints e vai crescendo com o RANK, que e o
   que o Kiv pediu ("ir melhorando conforme o jogador vai passando de nivel").
   O termo do nivel e o que manda (potencia 1.35), nao o preco do mint.
     nivel 1, mint $4  -> ~$11
     nivel 3, mint $8  -> ~$24
     nivel 5, mint $15 -> ~$42
     nivel 8, mint $35 -> ~$85 */
function questBase(){
  return 6+2.5*Math.pow(Math.max(1,G.bestLevel),1.35)
          +0.7*mintPrice()*(1+G.minted/SUPPLY);
}
const QUEST_POOL=[
 {id:'mint',  s:'d', need:x=>Math.ceil(3*x),   en:'Mint {0} Kaiju',                 pt:'Mintar {0} Kaiju'},
 {id:'sold',  s:'d', need:x=>Math.ceil(2*x),   en:'Sell {0} Kaiju',                 pt:'Vender {0} Kaiju'},
 {id:'royal', s:'d', need:x=>Math.round(25*x), en:'Earn {0} in royalties',          pt:'Ganhar {0} em royalties', money:1},
 {id:'hype',  s:'d', need:x=>Math.min(85,Math.round(25+x*4)), en:'Reach {0}% hype', pt:'Chegar a {0}% de hype'},
 {id:'buy',   s:'d', need:x=>Math.ceil(1*x),   en:'Buy {0} on the secondary market',pt:'Comprar {0} no mercado secundário'},
 {id:'file',  s:'d', need:x=>Math.ceil(2*x),   en:'File {0} Kaiju in the binder',   pt:'Arquivar {0} Kaiju no binder'},
 {id:'wroyal',s:'w', need:x=>Math.round(220*x),en:'Pull {0} in royalties this week',pt:'Juntar {0} em royalties na semana', money:1},
 {id:'wsold', s:'w', need:x=>Math.ceil(18*x),  en:'Sell {0} Kaiju this week',       pt:'Vender {0} Kaiju na semana'},
 {id:'wmint', s:'w', need:x=>Math.ceil(26*x),  en:'Mint {0} Kaiju this week',       pt:'Mintar {0} Kaiju na semana'},
 {id:'wrace', s:'w', need:x=>Math.min(30,Math.ceil(6+x*1.4)), en:'See {0} different races', pt:'Ver {0} raças diferentes'}
];
function qs(){
  if(!G.quests||typeof G.quests!=='object')G.quests={day:0,week:0,d:[],w:[],prog:{}};
  const q=G.quests;
  q.d=Array.isArray(q.d)?q.d:[];q.w=Array.isArray(q.w)?q.w:[];
  q.prog=q.prog&&typeof q.prog==='object'?q.prog:{};
  return q;
}
function questText(def,need){
  const s=(LANG==='pt'?def.pt:def.en)||def.en;
  return s.replace('{0}',def.money?money(need):num(need));
}
function rollQuests(force){
  const q=qs(), x=questScale();
  if(force||q.day!==G.day){
    q.day=G.day;
    const pool=QUEST_POOL.filter(d=>d.s==='d').slice();
    q.d=[];
    for(let i=0;i<3&&pool.length;i++){
      const d=pool.splice(Math.floor(Math.random()*pool.length),1)[0];
      q.d.push({id:d.id,need:d.need(x),got:0,done:0,paid:0});
    }
    ['mint','sold','royal','buy','file'].forEach(k=>{q.prog[k]=0;});
  }
  const wk=Math.floor((G.day-1)/7);
  if(force||q.week!==wk){
    q.week=wk;
    const pool=QUEST_POOL.filter(d=>d.s==='w').slice();
    q.w=[];
    for(let i=0;i<2&&pool.length;i++){
      const d=pool.splice(Math.floor(Math.random()*pool.length),1)[0];
      q.w.push({id:d.id,need:d.need(x),got:0,done:0,paid:0});
    }
    ['wroyal','wsold','wmint','wrace'].forEach(k=>{q.prog[k]=0;});
  }
}
/* um unico gancho, chamado de onde a acao acontece */
function questBump(kind,n){
  if(!G||!G.quests)return;
  const q=qs();
  q.prog[kind]=(q.prog[kind]||0)+(n||1);
  const wk={mint:'wmint',sold:'wsold',royal:'wroyal'}[kind];
  if(wk)q.prog[wk]=(q.prog[wk]||0)+(n||1);
  questSync();
}
function questValue(it){
  if(it.id==='hype')return G.hype;
  if(it.id==='wrace')return (G.seenRaces||[]).length;
  return qs().prog[it.id]||0;
}
function questSync(){
  const q=qs();
  [...q.d,...q.w].forEach(it=>{
    it.got=questValue(it);
    if(!it.done&&it.got>=it.need){
      it.done=1;
      /* MODO HISTORIA: as tarefas correm por baixo desde o dia 1, mas o cartao
         delas so aparece no b_quests. Mandar o jogador "receber na Kakizone"
         antes disso e mandar ele procurar uma coisa que nao esta la — o aviso
         espera o cartao existir. A tarefa continua contando e paga depois. */
      const podeVer=(typeof unlocked!=='function')||unlocked('f_quests');
      if(typeof UI!=='undefined'&&podeVer){SFX.coin&&SFX.coin();UI.toast('gift',t('Quest done — claim it in the Kakizone.'));}
    }
  });
}
function questReward(it,weekly){
  /* semanal era 6x a diaria: no dia 1 isso dava $68 numa carteira de $40 */
  return Math.round(questBase()*(weekly?4.5:1));
}
function claimQuest(kind,i){
  const q=qs(), arr=kind==='w'?q.w:q.d;
  const it=arr[i];
  if(!it||!it.done||it.paid)return {err:'no'};
  const v=questReward(it,kind==='w');
  it.paid=1;earn(v);
  return {ok:1,value:v};
}
function questsPending(){
  const q=qs();
  return [...q.d,...q.w].filter(it=>it.done&&!it.paid).length;
}
