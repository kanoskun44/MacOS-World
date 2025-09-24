const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
            contextIsolation: false
        },
        titleBarStyle: 'hidden',
        frame: false,
        show: false,
        icon: path.join(__dirname, 'assets/icon.png')
    });

    mainWindow.loadFile('index.html');

    // Mostrar ventana cuando esté lista
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Manejar el evento de cierre
    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// IPC handlers para los botones de la barra de título
ipcMain.on('window-minimize', function () {
    if (mainWindow) {
        mainWindow.minimize();
    }
});

ipcMain.on('window-maximize', function () {
    if (mainWindow) {
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        } else {
            mainWindow.maximize();
        }
    }
});

ipcMain.on('window-close', function () {
    if (mainWindow) {
        mainWindow.close();
    }
});

//Corregir textos

// Handler para guardar archivos
ipcMain.handle('save-file', async (event, content, defaultFileName) => {
    const result = await dialog.showSaveDialog(mainWindow, {
        defaultPath: defaultFileName,
        filters: [
            { name: 'Text Files', extensions: ['txt'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    });
    
    if (!result.canceled && result.filePath) {
        try {
            fs.writeFileSync(result.filePath, content);
            return { success: true, path: result.filePath };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    return { success: false, error: 'Save dialog cancelled' };
});

// Handler para cargar archivos
ipcMain.handle('load-file', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [
            { name: 'Text Files', extensions: ['txt'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
        try {
            const content = fs.readFileSync(result.filePaths[0], 'utf8');
            return { success: true, content: content, path: result.filePaths[0] };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    return { success: false, error: 'Open dialog cancelled' };
});