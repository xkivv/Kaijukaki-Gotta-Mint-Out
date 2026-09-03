/* ================= KAIJUKAKI — processo principal do Electron =================
   O jogo inteiro e HTML/JS sem servidor, entao aqui so tem: uma janela, o menu
   fora do caminho, e o caminho da pasta de save passado pro preload. */
const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

/* uma instancia so: duas janelas escrevendo o mesmo save = save corrompido */
if (!app.requestSingleInstanceLock()) { app.quit(); }

let win = null;

/* onde o save mora de verdade. No Windows:
   C:\\Users\\<voce>\\AppData\\Roaming\\Kaijukaki Gotta Mint Out\\saves */
function saveDir() {
  const d = path.join(app.getPath('userData'), 'saves');
  try { fs.mkdirSync(d, { recursive: true }); } catch (e) {}
  return d;
}

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 620,
    backgroundColor: '#0d6b5f',
    show: false,
    autoHideMenuBar: true,
    title: 'Kaijukaki Gotta Mint Out!',
    icon: path.join(__dirname, 'app', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      /* o preload precisa TROCAR window.localStorage por um save em arquivo,
         e contextBridge nao consegue substituir um acessor nativo do window.
         O conteudo aqui e 100% local e offline, entao isolar nao compra nada. */
      contextIsolation: false,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: false,
      spellcheck: false,
      additionalArguments: ['--kk-save-dir=' + saveDir()]
    }
  });

  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, 'app', 'index.html'));
  win.once('ready-to-show', () => win.show());

  /* F11 alterna tela cheia, F12 abre o console (util pra te mandar print de erro) */
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
    if (input.key === 'F12') { win.webContents.toggleDevTools(); e.preventDefault(); }
  });

  /* nada de navegar pra fora dentro da janela do jogo */
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('file://')) e.preventDefault();
  });

  win.on('closed', () => { win = null; });
}

app.on('second-instance', () => {
  if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());

/* se o renderer morrer, avisa em vez de sumir com a janela em silencio */
app.on('render-process-gone', (e, wc, det) => {
  dialog.showErrorBox('Kaijukaki', 'O jogo fechou sozinho (' + det.reason + ').\nSeu save esta em:\n' + saveDir());
});
