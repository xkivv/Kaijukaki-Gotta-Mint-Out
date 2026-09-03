/* ================= SAVE EM ARQUIVO =================
   O jogo guarda tudo em localStorage. Num app empacotado isso e frágil: uma
   limpeza de cache do Chromium apaga a partida inteira. Aqui o localStorage
   e trocado por um objeto com a MESMA interface, mas que le e escreve um
   arquivo de verdade em AppData. O jogo nao sabe de nada — nem uma linha do
   codigo do jogo muda.

   Escrita: em memoria na hora, no disco 400ms depois. O jogo chama save() a
   cada acao; gravar 40 vezes por minuto sem folego destrui SSD e trava a UI.
   Antes de fechar a janela o que estiver pendente e gravado na hora. */
const fs = require('fs');
const path = require('path');

const arg = process.argv.find(a => a.startsWith('--kk-save-dir='));
const DIR = arg ? arg.slice('--kk-save-dir='.length) : path.join(__dirname, 'saves');
const FILE = path.join(DIR, 'save.json');
const BAK = path.join(DIR, 'save.bak.json');

function carregar() {
  for (const f of [FILE, BAK]) {
    try {
      if (!fs.existsSync(f)) continue;
      const o = JSON.parse(fs.readFileSync(f, 'utf8'));
      if (o && typeof o === 'object') return o;
    } catch (e) { /* arquivo torto: tenta o backup */ }
  }
  return {};
}

let dados = carregar();
let sujo = false, timer = null;

function gravarAgora() {
  if (!sujo) return;
  sujo = false;
  try {
    fs.mkdirSync(DIR, { recursive: true });
    /* grava num temporario e renomeia: se faltar luz no meio, o save antigo
       continua inteiro em vez de virar meio arquivo */
    const tmp = FILE + '.tmp';
    const txt = JSON.stringify(dados);
    fs.writeFileSync(tmp, txt, 'utf8');
    if (fs.existsSync(FILE)) { try { fs.copyFileSync(FILE, BAK); } catch (e) {} }
    fs.renameSync(tmp, FILE);
  } catch (e) {
    console.error('[kaijukaki] nao consegui gravar o save:', e.message);
  }
}
function agendar() {
  sujo = true;
  if (timer) clearTimeout(timer);
  timer = setTimeout(gravarAgora, 400);
}

const shim = {
  getItem(k) { k = String(k); return Object.prototype.hasOwnProperty.call(dados, k) ? dados[k] : null; },
  setItem(k, v) { dados[String(k)] = String(v); agendar(); },
  removeItem(k) { delete dados[String(k)]; agendar(); },
  clear() { dados = {}; agendar(); },
  key(i) { const ks = Object.keys(dados); return i < ks.length ? ks[i] : null; },
  get length() { return Object.keys(dados).length; }
};

/* TEM que ser agora, no topo do preload. O script do jogo roda no fim do body,
   ANTES do DOMContentLoaded — se a troca esperasse esse evento, o jogo ja teria
   lido o localStorage nativo e a partida nasceria vazia toda vez. */
try {
  Object.defineProperty(window, 'localStorage', { value: shim, configurable: true, writable: false });
} catch (e) {
  console.error('[kaijukaki] nao consegui trocar o localStorage:', e.message);
}

/* fechar a janela nao pode perder os ultimos 400ms de jogo */
window.addEventListener('beforeunload', gravarAgora);
window.addEventListener('pagehide', gravarAgora);

/* pra você conseguir achar o save sem procurar */
window.KK_SAVE_DIR = DIR;
