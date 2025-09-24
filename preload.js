const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Botones de la barra de título
    send: (channel, data) => {
        ipcRenderer.send(channel, data);
    },
    
    // Guardar archivo
    saveFile: (content, defaultFileName) => {
        return ipcRenderer.invoke('save-file', content, defaultFileName);
    },
    
    // Cargar archivo
    loadFile: () => {
        return ipcRenderer.invoke('load-file');
    }
});