/* ================= APP: KAIJU BINDER =================
   Left: your collection (filter by Race / Rarity / status).
   Right: a physical-feeling 5-wide binder page you fill by dragging.
   Drag works with pointer events, so mouse and touch behave the same. */
const BIN_COLS=5, BIN_ROWS=3, BIN_SLOTS=BIN_COLS*BIN_ROWS;
/* pagina, filtro e ordenacao do binder ficam no registrador (G.prefs).
   A BUSCA nao: um "#412" esquecido no campo esconderia o album inteiro no
   proximo dia e pareceria bug. */
const BV=prefView({filter:'binFilter',sort:'binSort',page:'binPage'});
let binSearch='';

function binder(){
  if(!G.binder||!Array.isArray(G.binder.pages)||!G.binder.pages.length){
    G.binder={pages:[{name:t('Page 1'),slots:new Array(BIN_SLOTS).fill(null)}]};
  }
  G.binder.pages.forEach(p=>{
    if(!Array.isArray(p.slots))p.slots=new Array(BIN_SLOTS).fill(null);
    while(p.slots.length<BIN_SLOTS)p.slots.push(null);
    p.slots.length=BIN_SLOTS;
  });
  return G.binder;
}
function binderClean(){
  const own=new Set(G.tokens.map(x=>x.id));
  const seen=new Set();
  binder().pages.forEach(p=>{
    p.slots=p.slots.map(id=>{
      if(id==null)return null;
      if(!own.has(id)||seen.has(id))return null;
      seen.add(id);return id;
    });
  });
  binderDirty();
}
function inBinderLegacy(){
  const s=new Set();
  binder().pages.forEach(p=>p.slots.forEach(id=>{if(id!=null)s.add(id);}));
  return s;
}
/* onde esse Kaiju esta arquivado — usado pelo aviso na ficha da carteira */
function binderPageOf(id){
  const B=G&&G.binder;if(!B||!Array.isArray(B.pages))return null;
  for(let i=0;i<B.pages.length;i++){
    const k=(B.pages[i].slots||[]).indexOf(id);
    if(k>=0)return {i,name:B.pages[i].name,slot:k};
  }
  return null;
}
function binderRemove(id){
  const w=binderPageOf(id);if(!w)return false;
  G.binder.pages[w.i].slots[w.slot]=null;binderDirty();return true;
}
/* um Kaiju no cofre nao entra no album: ele esta trabalhando, nao posando */
function binderAllows(id){
  const tk=G.tokens.find(x=>x.id===id);
  if(!tk)return {err:'gone'};
  if(tk.staked)return {err:'staked'};
  if(tk.hidden)return {err:'hidden'};
  return {ok:1};
}
function binderReject(r,id){
  SFX.error();
  if(r.err==='staked')UI.dialog(t('It is in the vault'),
    t('Kaiju #{0} is staked. Take it out of staking before filing it in the binder.',id),'warn');
}
/* quantos de cada raca ja estao no album — o market usa isso pra marcar o que
   fecha uma pagina */
function binderRaceCount(){
  const out={};
  binderIds().forEach(id=>{const r=metaOf(id).traits[RACE_LAYER];out[r]=(out[r]||0)+1;});
  return out;
}
/* quanto falta pra alguma pagina em andamento virar uma pagina de raca unica */
function binderNeedFor(race){
  const B=G&&G.binder;if(!B||!Array.isArray(B.pages))return 0;
  let best=0;
  B.pages.forEach(p=>{
    const ids=(p.slots||[]).filter(x=>x!=null);
    if(!ids.length)return;
    const rs=new Set(ids.map(id=>metaOf(id).traits[RACE_LAYER]));
    if(rs.size===1&&[...rs][0]===race)best=Math.max(best,BIN_SLOTS-ids.length);
  });
  return best;
}
function pageProgress(page){
  const ids=(page.slots||[]).filter(x=>x!=null);
  const races={},rars={};
  ids.forEach(id=>{const m=metaOf(id);
    races[m.traits[RACE_LAYER]]=(races[m.traits[RACE_LAYER]]||0)+1;
    rars[m.rarity]=(rars[m.rarity]||0)+1;});
  const rk=Object.keys(races), rr=Object.keys(rars);
  return {n:ids.length,total:BIN_SLOTS,races,
          raceSet:rk.length===1?rk[0]:null,
          rarSet:rr.length===1?+rr[0]:null,
          full:ids.length===BIN_SLOTS};
}
function binderStats(){
  const placed=binderIds();
  const byRace={};
  placed.forEach(id=>{const r=metaOf(id).traits[RACE_LAYER];byRace[r]=(byRace[r]||0)+1;});
  return {placed:placed.size,byRace};
}

APPS.binder={
  title:'Kaiju Binder', icon:'binder', w:720, h:520, status:true,
  build(b,ent){
    b.innerHTML='<div class="bwrap"></div>';
    this.refresh(b,ent);
  },
  refresh(b,ent){
    binderClean();
    const wrap=$('.bwrap',b);if(!wrap)return;
    const B=binder();
    BV.page=clamp(BV.page,0,B.pages.length-1);
    const page=B.pages[BV.page];
    const placed=binderIds();

    /* ---- left pane list ---- */
    let list=G.tokens.filter(x=>!placed.has(x.id)&&!x.staked&&!x.hidden);
    if(BV.filter!=='all'){
      if(BV.filter.indexOf('r:')===0)list=list.filter(x=>x.rarity===+BV.filter.slice(2));
      else list=list.filter(x=>x.traits[RACE_LAYER]===BV.filter);
    }
    if(binSearch)list=list.filter(x=>String(x.id).indexOf(binSearch)>=0);
    if(BV.sort==='rare')list.sort((a,c)=>c.rarity-a.rarity||c.score-a.score);
    else if(BV.sort==='new')list.sort((a,c)=>(c.seq||0)-(a.seq||0)||c.id-a.id);
    else if(BV.sort==='race')list.sort((a,c)=>a.traits[RACE_LAYER].localeCompare(c.traits[RACE_LAYER])||c.rarity-a.rarity);
    else list.sort((a,c)=>a.id-c.id);
    const shown=list.slice(0,120);
    const races=RACES;
    const st=binderStats();

    wrap.innerHTML=`
      <div class="bpane bleft">
        <div class="bhead">${t('Collection')} <span class="tiny dim">(${num(list.length)})</span></div>
        <div class="brow">
          <select data-bf="1">
            <option value="all">${t('All races')}</option>
            ${races.map(r=>`<option value="${r}">${r}</option>`).join('')}
            ${RARITY.map((r,i)=>`<option value="r:${i}">${rarName(i)}</option>`).join('')}
          </select>
          <select data-bs="1">
            <option value="rare">${t('Rarest')}</option><option value="race">${t('By race')}</option>
            <option value="new">${t('Newest')}</option><option value="id">${t('By ID')}</option>
          </select>
        </div>
        <div class="brow"><input type="text" data-bq="1" placeholder="#id" value="${binSearch}"></div>
        <div class="blist" data-blist="1"></div>
        <div class="tiny dim bfoot">${(typeof IS_MOB!=='undefined'&&IS_MOB)?t('Tap a Kaiju to file it. Tap it in the binder to take it back.'):t('Drag a Kaiju into the binder. Drag it out to take it back.')}</div>
      </div>

      <div class="bpane bright">
        <div class="bhead">
          <button class="btn bnav" data-bprev="1">&#8592;</button>
          <input type="text" class="bname" data-bname="1" value="${page.name}">
          <span class="tiny dim bpg">${BV.page+1}/${B.pages.length}</span>
          <button class="btn bnav" data-bnext="1">&#8594;</button>
        </div>
        ${(()=>{const pp=pageProgress(page);
          const top=Object.entries(pp.races).sort((a,b)=>b[1]-a[1]).slice(0,3);
          return `<div class="bprog${pp.full?' full':''}">
            <b>${pp.n}/${pp.total}</b>
            <span class="bp-mix">${top.length?top.map(([r,n])=>`${r} &times;${n}`).join(' · '):t('empty page')}</span>
            <span class="bp-goal">${
              pp.full?t('PAGE COMPLETE'):
              pp.raceSet?t('{0} more for a full {1} page',pp.total-pp.n,pp.raceSet):
              pp.rarSet!=null?t('{0} more for a full {1} page',pp.total-pp.n,rarName(pp.rarSet)):
              t('mixed page')}</span>
          </div>`;})()}
        <div class="binder" data-binder="1">
          <div class="rings">${'<i></i>'.repeat(BIN_ROWS*2)}</div>
          <div class="bgrid" data-bgrid="1"></div>
        </div>
        <div class="brow bactions">
          ${unlocked('f_binder_fill')?`<button class="btn" data-bfill="1">${t('Auto-fill page')}</button>`:''}
          <button class="btn" data-bclear="1">${t('Empty page')}</button>
          <button class="btn" data-badd="1">${t('New page')}</button>
          <div class="grow"></div>
          <span class="tiny dim">${t('{0} of {1} in the binder',num(st.placed),num(G.tokens.length))}</span>
        </div>
      </div>`;

    /* left list */
    const lst=$('[data-blist]',wrap);
    shown.forEach(tk=>{
      const c=el('div','bcard');
      c.dataset.id=tk.id;
      c.innerHTML=`<canvas></canvas><div class="bc-id">#${tk.id}</div><div class="bc-r r${tk.rarity}"></div>`;
      c.title=`#${tk.id} · ${rarName(tk.rarity)} · ${tk.traits[RACE_LAYER]}`+(tk.traits.Name?' · '+tk.traits.Name:'');
      lst.appendChild(c);
      drawKaijuCached($('canvas',c),tk,64);
      bindDrag(c,tk.id,null,b,ent);
      c.addEventListener('dblclick',()=>{placeFirstFree(tk.id,b,ent);});
      if(typeof IS_MOB!=='undefined'&&IS_MOB)
        c.addEventListener('click',()=>{if(c.__dragged)return;haptic(9);placeFirstFree(tk.id,b,ent);});
    });
    if(!shown.length)lst.innerHTML=`<div class="center dim tiny" style="padding:22px 8px">${t('Nothing left to file here.')}</div>`;

    /* binder grid */
    const grid=$('[data-bgrid]',wrap);
    page.slots.forEach((id,i)=>{
      const s=el('div','bslot'+(id==null?' empty':''));
      s.dataset.slot=i;
      if(id!=null){
        const tk=G.tokens.find(x=>x.id===id);
        if(tk){
          s.innerHTML=`<div class="sleeve r${tk.rarity}">
            <div class="sl-art"><canvas></canvas></div>
            <div class="sl-foot">
              <span class="sl-id">#${tk.id}</span>
              <span class="sl-race">${tk.traits[RACE_LAYER]}</span>
            </div>
            ${tk.score<=200?'<span class="sl-star" title="top 200">&#9733;</span>':''}
            <div class="bc-r r${tk.rarity}"></div></div>`;
          drawKaijuCached($('canvas',s),tk,74);
          s.title=`#${tk.id} · ${rarName(tk.rarity)} · ${tk.traits[RACE_LAYER]}`;
          bindDrag(s,id,i,b,ent);
          const pull=()=>{page.slots[i]=null;binderDirty();SFX.click();APPS.binder.refresh(b,ent);save();};
          s.addEventListener('dblclick',pull);
          if(typeof IS_MOB!=='undefined'&&IS_MOB)
            s.addEventListener('click',()=>{if(s.__dragged)return;haptic(9);pull();});
        }
      } else {
        s.innerHTML='<div class="ghost">'+pixSVG('kaiju',30)+'</div>';
      }
      grid.appendChild(s);
    });

    /* controls */
    const fsel=$('[data-bf]',wrap),ssel=$('[data-bs]',wrap);
    fsel.value=BV.filter;ssel.value=BV.sort;
    fsel.onchange=e=>{BV.filter=e.target.value;SFX.click();APPS.binder.refresh(b,ent);};
    ssel.onchange=e=>{BV.sort=e.target.value;SFX.click();APPS.binder.refresh(b,ent);};
    const q=$('[data-bq]',wrap);
    q.style.userSelect='text';
    q.oninput=e=>{binSearch=e.target.value.replace(/[^0-9]/g,'');clearTimeout(q._t);q._t=setTimeout(()=>APPS.binder.refresh(b,ent),220);};
    $('[data-bprev]',wrap).onclick=()=>{if(BV.page>0){BV.page--;SFX.down();flipPage(wrap,-1);APPS.binder.refresh(b,ent);}};
    $('[data-bnext]',wrap).onclick=()=>{
      if(BV.page<B.pages.length-1){BV.page++;SFX.down();flipPage(wrap,1);APPS.binder.refresh(b,ent);}
      else{addPage(b,ent);}
    };
    const nm=$('[data-bname]',wrap);
    nm.style.userSelect='text';
    nm.onchange=()=>{page.name=nm.value.slice(0,28)||t('Page {0}',BV.page+1);save();};
    $('[data-badd]',wrap).onclick=()=>addPage(b,ent);
    $('[data-bclear]',wrap).onclick=()=>{
      page.slots=new Array(BIN_SLOTS).fill(null);SFX.close();APPS.binder.refresh(b,ent);save();};
    const bfill=$('[data-bfill]',wrap);
    if(bfill)bfill.onclick=()=>{
      let pool=list.slice();
      let filled=0;
      page.slots=page.slots.map(id=>{
        if(id!=null)return id;
        const tk=pool.shift();if(!tk)return null;
        filled++;return tk.id;
      });
      if(filled){binderDirty();binderFiled(filled);SFX.coin();UI.toast('binder',t('Filed {0} Kaiju.',filled));}
      else SFX.error();
      APPS.binder.refresh(b,ent);checkSet(page,b,ent);save();
    };
    const s1=ent.win.querySelector('.st1'),s2=ent.win.querySelector('.st2');
    if(s1){s1.textContent=t('{0} of {1} in the binder',num(st.placed),num(G.tokens.length));
      s2.textContent=t('{0} pages',B.pages.length);}
    UI.updateTray();
  }
};

/* A missao diária "Arquivar N Kaiju no binder" nunca contava: existiam TRES
   caminhos pra arquivar (encher a página, clicar num Kaiju, arrastar pra um
   slot) e nenhum deles avisava o sistema de missões. Agora todo caminho passa
   por aqui, e só conta quando um slot VAZIO recebe um Kaiju — trocar dois de
   lugar ou mover dentro do álbum não é arquivar de novo. */
function binderFiled(n){
  if(n>0&&typeof questBump==='function')questBump('file',n);
}

function addPage(b,ent){
  const B=binder();
  B.pages.push({name:t('Page {0}',B.pages.length+1),slots:new Array(BIN_SLOTS).fill(null)});
  BV.page=B.pages.length-1;SFX.click();
  APPS.binder.refresh(b,ent);save();
}
function flipPage(wrap,dir){
  const bd=$('[data-binder]',wrap);
  if(!bd)return;
  bd.style.animation='none';void bd.offsetWidth;
  bd.style.animation=(dir>0?'flipR':'flipL')+' .26s ease-out';
}
function placeFirstFree(id,b,ent){
  const g=binderAllows(id);
  if(g.err){binderReject(g,id);return;}
  const page=binder().pages[BV.page];
  const i=page.slots.indexOf(null);
  if(i<0){SFX.error();UI.toast('warn',t('This page is full.'));return;}
  page.slots[i]=id;binderDirty();binderFiled(1);SFX.click();
  APPS.binder.refresh(b,ent);checkSet(page,b,ent);save();
}
function checkSet(page,b,ent){
  const ids=page.slots.filter(x=>x!=null);
  if(ids.length<BIN_SLOTS)return;
  const races=new Set(ids.map(id=>metaOf(id).traits[RACE_LAYER]));
  if(races.size===1){
    SFX.levelup();UI.confetti(90,['#a8e832','#d4ff6b','#ffffff']);
    UI.toast('binder',t('{0} page complete! Full set of one Race.',[...races][0]));
  } else {
    const rar=new Set(ids.map(id=>metaOf(id).rarity));
    if(rar.size===1&&[...rar][0]>=2){
      SFX.levelup();UI.confetti(70,[RARITY[[...rar][0]].c,'#ffffff']);
      UI.toast('binder',t('Full {0} page! Somebody is showing off.',rarName([...rar][0])));
    }
  }
}

/* ---------- pointer drag & drop ---------- */
let dragGhost=null;
function bindDrag(node,id,fromSlot,b,ent){
  node.addEventListener('pointerdown',e=>{
    if(e.pointerType==='mouse'&&e.button!==0)return;
    const sx=e.clientX,sy=e.clientY,pid=e.pointerId;
    let started=false;
    const start=()=>{
      started=true;
      node.classList.add('dragging-card');
      dragGhost=el('div','dragghost');
      const cv=el('canvas');
      dragGhost.appendChild(cv);
      $('#screen').appendChild(dragGhost);
      const tk=G.tokens.find(x=>x.id===id);
      if(tk)drawKaijuCached(cv,tk,72);
      move(e);
      SFX.down();
    };
    const move=ev=>{
      if(!dragGhost)return;
      const off=(typeof IS_MOB!=='undefined'&&IS_MOB)?96:36;
      dragGhost.style.left=(ev.clientX-43)+'px';
      dragGhost.style.top=(ev.clientY-off)+'px';
      const el2=document.elementFromPoint(ev.clientX,ev.clientY);
      $$('.bslot.hot').forEach(x=>x.classList.remove('hot'));
      const slot=el2&&el2.closest?el2.closest('.bslot'):null;
      if(slot)slot.classList.add('hot');
    };
    const mv=ev=>{
      if(ev.pointerId!==pid)return;
      if(!started&&Math.abs(ev.clientX-sx)+Math.abs(ev.clientY-sy)<6)return;
      if(!started)start();
      ev.preventDefault();
      move(ev);
    };
    const up=ev=>{
      if(ev.pointerId!==pid)return;
      node.removeEventListener('pointermove',mv);
      node.removeEventListener('pointerup',up);
      node.removeEventListener('pointercancel',up);
      try{node.releasePointerCapture(pid);}catch(_){}
      node.classList.remove('dragging-card');
      if(!started){node.__dragged=false;return;}
      node.__dragged=true;setTimeout(()=>{node.__dragged=false;},240);
      const el2=document.elementFromPoint(ev.clientX,ev.clientY);
      const slot=el2&&el2.closest?el2.closest('.bslot'):null;
      const leftPane=el2&&el2.closest?el2.closest('.bleft'):null;
      if(dragGhost){dragGhost.remove();dragGhost=null;}
      $$('.bslot.hot').forEach(x=>x.classList.remove('hot'));
      const page=binder().pages[BV.page];
      if(slot){
        /* arrastar de fora do album passa pela guarda; mover dentro dele nao */
        if(fromSlot==null){
          const g=binderAllows(id);
          if(g.err){binderReject(g,id);APPS.binder.refresh(b,ent);return;}
        }
        const target=+slot.dataset.slot;
        const prev=page.slots[target];
        if(fromSlot!=null){
          page.slots[fromSlot]=prev==null?null:prev;
          page.slots[target]=id;binderDirty();
        } else {
          if(prev!=null){ /* bump the previous card back to the collection */ }
          page.slots[target]=id;binderDirty();
          if(prev==null)binderFiled(1);   /* slot vazio virou cheio: conta */
        }
        SFX.click();
        APPS.binder.refresh(b,ent);checkSet(page,b,ent);save();
      } else if(leftPane&&fromSlot!=null){
        page.slots[fromSlot]=null;binderDirty();SFX.close();
        APPS.binder.refresh(b,ent);save();
      }
    };
    try{node.setPointerCapture(e.pointerId);}catch(_){}
    node.addEventListener('pointermove',mv);
    node.addEventListener('pointerup',up);
    node.addEventListener('pointercancel',up);
  });
}
