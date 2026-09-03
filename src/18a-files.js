/* ================= ARTE EM ARQUIVO (build de desktop) =================
   No Electron as 35 folhas moram em app/art/*.avif. Nada de base64: o HTML
   cai de 15 MB pra ~1 MB e a memoria para de carregar 14 MB de string.
   ATENCAO: continua sendo a arte PERMUTADA. O mapa jogo -> arquivo real
   (KK_REAL) NAO entra nesta build. Arquivo em disco e trivial de abrir, e
   quem abrir nao pode descobrir a ordem do mint de verdade. */
const KK_SHEET_TILE=128,KK_SHEET_COLS=16;
const KK_SHEET_DIR='art/';
const KK_SHEETS=new Array(35).fill(1);
