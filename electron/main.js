// Fenêtre de bureau de Colosse (Windows, Linux) : charge index.html, sans menu.
const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');
function create() {
  const win = new BrowserWindow({
    width: 1366, height: 820, minWidth: 900, minHeight: 560, backgroundColor: '#14181a', autoHideMenuBar: true, title: 'Colosse',
    icon: path.join(__dirname, '..', 'icons', 'icon-256.png'),
    webPreferences: { contextIsolation: true, nodeIntegration: false, backgroundThrottling: false }
  });
  Menu.setApplicationMenu(null);
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('before-input-event', (e, input) => { if (input.type === 'keyDown' && input.key === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); } });
  win.loadFile(path.join(__dirname, '..', 'index.html'));
}
app.whenReady().then(create);
app.on('window-all-closed', () => app.quit());
