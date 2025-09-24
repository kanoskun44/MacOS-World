// Variables globales
let currentNoteId = null;
let notes = JSON.parse(localStorage.getItem('notes')) || [];
let isSidebarVisible = true;
let hasUnsavedChanges = false;
let db = null;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    initDatabase();
    loadNotes();
});

// Inicializar la aplicación
function initializeApp() {
    // Botones de la barra de título
    document.getElementById('close-btn').addEventListener('click', () => {
        if (hasUnsavedChanges) {
            showExitModal();
        } else {
            // En Electron
            if (typeof window.electronAPI !== 'undefined') {
                window.electronAPI.send('window-close');
            } else {
                console.log('Cerrar aplicación');
            }
        }
    });

    document.getElementById('minimize-btn').addEventListener('click', () => {
        // En Electron
        if (typeof window.electronAPI !== 'undefined') {
            window.electronAPI.send('window-minimize');
        } else {
            console.log('Minimizar ventana');
        }
    });

    document.getElementById('maximize-btn').addEventListener('click', () => {
        // En Electron
        if (typeof window.electronAPI !== 'undefined') {
            window.electronAPI.send('window-maximize');
        } else {
            console.log('Maximizar ventana');
        }
    });

    // Botones de la barra de título derecha
    document.getElementById('toggle-sidebar').addEventListener('click', toggleSidebar);
    document.getElementById('change-view').addEventListener('click', changeView);
    document.getElementById('clear-dashboard').addEventListener('click', clearDashboard);
    document.getElementById('new-note-btn').addEventListener('click', toggleNewNoteMenu);

    // Búsqueda
    document.getElementById('search-box').addEventListener('input', handleSearch);
    document.getElementById('mic-btn').addEventListener('click', startVoiceRecognition);
    
    // Búsqueda en el editor
    document.getElementById('editor-search-box').addEventListener('input', handleEditorSearch);
    document.getElementById('editor-mic-btn').addEventListener('click', startEditorVoiceRecognition);
    document.getElementById('ai-assistant-btn').addEventListener('click', openAIModal);

    // Botones de acción del editor
    document.getElementById('save-note-btn').addEventListener('click', saveNoteToFile);
    document.getElementById('back-btn').addEventListener('click', showExitModal);

    // Editor de notas
    setupEditorTools();

    // Menús contextuales
    setupContextMenus();

    // Modales
    setupModals();

    // Atajos de teclado
    setupKeyboardShortcuts();

    // Menú contextual personalizado
    setupCustomContextMenu();

    // Cerrar menús al hacer clic fuera de ellos
    document.addEventListener('click', closeAllMenus);
}

// Configurar atajos de teclado
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl + Q: Nueva nota
        if (e.ctrlKey && e.key === 'q') {
            e.preventDefault();
            createNewNote();
        }
        
        // Ctrl + S: Guardar
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveCurrentNote();
            alert('Nota guardada');
        }
        
        // Ctrl + A: Seleccionar todo
        if (e.ctrlKey && e.key === 'a') {
            e.preventDefault();
            document.execCommand('selectAll', false, null);
        }
        
        // Ctrl + E: Guardar como
        if (e.ctrlKey && e.key === 'e') {
            e.preventDefault();
            saveNoteToFile();
        }
        
        // Ctrl + N: Nueva nota (alternativo)
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            createNewNote();
        }
        
        // Ctrl + Z: Deshacer
        if (e.ctrlKey && e.key === 'z') {
            // Permitir el comportamiento por defecto
        }
        
        // Ctrl + Y: Rehacer
        if (e.ctrlKey && e.key === 'y') {
            e.preventDefault();
            document.execCommand('redo', false, null);
        }
        
        // Ctrl + F: Buscar
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            document.getElementById('editor-search-box').focus();
        }
    });
}

// Configurar menú contextual personalizado
function setupCustomContextMenu() {
    const noteContent = document.getElementById('note-content');
    const noteTitle = document.getElementById('note-title');
    
    // Menú contextual para el contenido de la nota
    noteContent.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        showContextMenu(e, 'content');
    });
    
    // Menú contextual para el título de la nota
    noteTitle.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        showContextMenu(e, 'title');
    });
    
    // Menú contextual para las notas en la lista
    document.addEventListener('contextmenu', function(e) {
        if (e.target.closest('.note-item')) {
            e.preventDefault();
            showNoteContextMenu(e, e.target.closest('.note-item'));
        }
    });
}

// Mostrar menú contextual para texto
function showContextMenu(e, type) {
    // Crear menú contextual
    const contextMenu = document.createElement('div');
    contextMenu.className = 'custom-context-menu';
    contextMenu.style.position = 'fixed';
    contextMenu.style.left = e.pageX + 'px';
    contextMenu.style.top = e.pageY + 'px';
    contextMenu.style.zIndex = '1000';
    
    // Obtener texto seleccionado
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    // Elementos del menú
    const menuItems = [
        { text: 'Cortar', action: () => document.execCommand('cut'), icon: 'fa-cut' },
        { text: 'Copiar', action: () => document.execCommand('copy'), icon: 'fa-copy' },
        { text: 'Pegar', action: () => document.execCommand('paste'), icon: 'fa-paste' },
        { separator: true }
    ];
    
    // Añadir corrección ortográfica si hay texto seleccionado
    if (selectedText) {
        menuItems.push(
            { text: 'Corregir ortografía', action: () => correctSpelling(selectedText), icon: 'fa-spell-check' },
            { separator: true }
        );
    }
    
    // Añadir opciones de formato
    menuItems.push(
        { text: 'Negrita', action: () => document.execCommand('bold'), icon: 'fa-bold' },
        { text: 'Cursiva', action: () => document.execCommand('italic'), icon: 'fa-italic' },
        { text: 'Subrayado', action: () => document.execCommand('underline'), icon: 'fa-underline' }
    );
    
    // Construir el menú
    contextMenu.innerHTML = menuItems.map(item => {
        if (item.separator) {
            return '<div class="menu-separator"></div>';
        } else {
            return `
                <div class="context-menu-item" onclick="(${item.action})()">
                    <i class="fas ${item.icon}"></i>
                    <span>${item.text}</span>
                </div>
            `;
        }
    }).join('');
    
    // Añadir el menú al documento
    document.body.appendChild(contextMenu);
    
    // Cerrar el menú al hacer clic en cualquier lugar
    const closeMenu = function() {
        document.body.removeChild(contextMenu);
        document.removeEventListener('click', closeMenu);
    };
    
    setTimeout(() => {
        document.addEventListener('click', closeMenu);
    }, 100);
}

// Mostrar menú contextual para notas en la lista
function showNoteContextMenu(e, noteElement) {
    const noteId = noteElement.dataset.id;
    const note = notes[noteId];
    
    // Crear menú contextual
    const contextMenu = document.createElement('div');
    contextMenu.className = 'custom-context-menu';
    contextMenu.style.position = 'fixed';
    contextMenu.style.left = e.pageX + 'px';
    contextMenu.style.top = e.pageY + 'px';
    contextMenu.style.zIndex = '1000';
    
    // Elementos del menú
    const menuItems = [
        { 
            text: note.pinned ? 'Desfijar' : 'Fijar', 
            action: () => toggleNotePin(noteId), 
            icon: note.pinned ? 'fa-thumbtack-slash' : 'fa-thumbtack' 
        },
        { 
            text: note.password ? 'Cambiar contraseña' : 'Establecer contraseña', 
            action: () => setNotePassword(noteId), 
            icon: 'fa-key' 
        },
        { 
            text: 'Compartir', 
            action: () => shareNote(noteId), 
            icon: 'fa-share-alt' 
        },
        { 
            text: 'Resumir con IA', 
            action: () => summarizeNoteWithAI(noteId), 
            icon: 'fa-robot' 
        },
        { 
            text: 'Descargar', 
            action: () => downloadNote(noteId), 
            icon: 'fa-download' 
        },
        { separator: true },
        { 
            text: 'Eliminar', 
            action: () => deleteNote(noteId), 
            icon: 'fa-trash', 
            className: 'text-danger' 
        }
    ];
    
    // Construir el menú
    contextMenu.innerHTML = menuItems.map(item => {
        if (item.separator) {
            return '<div class="menu-separator"></div>';
        } else {
            const className = item.className ? `class="${item.className}"` : '';
            return `
                <div class="context-menu-item ${item.className || ''}" onclick="(${item.action})()">
                    <i class="fas ${item.icon}"></i>
                    <span>${item.text}</span>
                </div>
            `;
        }
    }).join('');
    
    // Añadir el menú al documento
    document.body.appendChild(contextMenu);
    
    // Cerrar el menú al hacer clic en cualquier lugar
    const closeMenu = function() {
        document.body.removeChild(contextMenu);
        document.removeEventListener('click', closeMenu);
    };
    
    setTimeout(() => {
        document.addEventListener('click', closeMenu);
    }, 100);
}

// Corregir ortografía
function correctSpelling(text) {
    // Diccionario de correcciones comunes
    const corrections = {
        'haber': 'a ver',
        'alla': 'haya',
        'echo': 'hecho',
        'iva': 'iba',
        'haci': 'así',
        'demas': 'demás',
        'sino': 'si no',
        'valla': 'vaya',
        'ay': 'ahí',
        'halla': 'haya',
        'hechar': 'echar',
        'hiba': 'iba',
        'asi': 'así',
        'mas': 'más'
    };
    
    let correctedText = text;
    for (const [wrong, correct] of Object.entries(corrections)) {
        const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
        correctedText = correctedText.replace(regex, correct);
    }
    
    document.execCommand('insertText', false, correctedText);
    trackChanges();
}

// Alternar fijación de nota
function toggleNotePin(noteId) {
    notes[noteId].pinned = !notes[noteId].pinned;
    updateNoteInDatabase(notes[noteId]);
    loadNotes();
}

// Establecer contraseña para nota
function setNotePassword(noteId) {
    const currentPassword = notes[noteId].password;
    let message = 'Establece una contraseña para esta nota:';
    
    if (currentPassword) {
        message = 'La nota ya tiene una contraseña. Introduce la nueva contraseña o deja vacío para eliminar:';
    }
    
    const password = prompt(message, '');
    if (password !== null) {
        notes[noteId].password = password || null;
        updateNoteInDatabase(notes[noteId]);
        alert(password ? 'Contraseña establecida correctamente' : 'Contraseña eliminada');
    }
}

// Compartir nota
function shareNote(noteId) {
    const note = notes[noteId];
    if (navigator.share) {
        navigator.share({
            title: note.title || 'Nota sin título',
            text: note.content ? note.content.replace(/<[^>]*>/g, '').substring(0, 100) + '...' : '',
            url: window.location.href
        }).catch(error => {
            console.log('Error al compartir:', error);
        });
    } else {
        // Fallback: copiar al portapapeles
        const textToCopy = `${note.title || 'Nota sin título'}\n\n${note.content ? note.content.replace(/<[^>]*>/g, '') : ''}`;
        navigator.clipboard.writeText(textToCopy).then(() => {
            alert('Contenido de la nota copiado al portapapeles');
        }).catch(err => {
            alert('No se pudo copiar el contenido: ' + err);
        });
    }
}

// Resumir nota con IA
function summarizeNoteWithAI(noteId) {
    const note = notes[noteId];
    const content = note.content ? note.content.replace(/<[^>]*>/g, '') : '';
    
    if (!content.trim()) {
        alert('La nota no tiene contenido para resumir');
        return;
    }
    
    // Simulación de resumen con IA (en una app real, conectarías a una API)
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const summary = sentences.slice(0, Math.min(3, sentences.length)).join('. ') + '.';
    
    // Abrir la nota si no está abierta
    if (currentNoteId !== noteId) {
        openNote(noteId);
    }
    
    // Insertar el resumen al final de la nota
    const summaryHTML = `<div style="background-color: #f0f8ff; padding: 10px; border-left: 4px solid #007acc; margin-top: 20px;">
        <strong>Resumen IA:</strong> ${summary}
    </div>`;
    
    document.execCommand('insertHTML', false, summaryHTML);
    trackChanges();
    saveCurrentNote();
}

// Descargar nota
function downloadNote(noteId) {
    const note = notes[noteId];
    const title = note.title.replace(/<[^>]*>/g, '') || 'nota_sin_titulo';
    const content = note.content.replace(/<[^>]*>/g, '');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert(`Nota "${title}" descargada correctamente`);
}

// Eliminar nota
function deleteNote(noteId) {
    if (confirm('¿Estás seguro de que quieres eliminar esta nota?')) {
        if (db && window.sqlitePlugin) {
            db.transaction(function(tx) {
                tx.executeSql('DELETE FROM notes WHERE id = ?', [notes[noteId].id], function() {
                    notes.splice(noteId, 1);
                    loadNotes();
                    if (currentNoteId === noteId) {
                        showEditorPlaceholder();
                    }
                });
            });
        } else if (db) {
            const transaction = db.transaction(['notes'], 'readwrite');
            const objectStore = transaction.objectStore('notes');
            const request = objectStore.delete(notes[noteId].id);
            
            request.onsuccess = function() {
                notes.splice(noteId, 1);
                loadNotes();
                if (currentNoteId === noteId) {
                    showEditorPlaceholder();
                }
            };
        } else {
            notes.splice(noteId, 1);
            localStorage.setItem('notes', JSON.stringify(notes));
            loadNotes();
            if (currentNoteId === noteId) {
                showEditorPlaceholder();
            }
        }
    }
}

// Inicializar base de datos
function initDatabase() {
    if (window.sqlitePlugin) {
        // Para dispositivos móviles con SQLite
        db = window.sqlitePlugin.openDatabase({
            name: 'notes.db',
            location: 'default'
        });
        
        createTables();
    } else {
        // Para navegadores con IndexedDB
        initIndexedDB();
    }
}

// Inicializar IndexedDB para navegadores
function initIndexedDB() {
    const request = indexedDB.open('NotesDatabase', 1);
    
    request.onerror = function(event) {
        console.error('Error abriendo la base de datos:', event.target.error);
    };
    
    request.onupgradeneeded = function(event) {
        db = event.target.result;
        
        // Crear object store para notas
        const objectStore = db.createObjectStore('notes', { keyPath: 'id', autoIncrement: true });
        
        // Crear índices para búsqueda
        objectStore.createIndex('title', 'title', { unique: false });
        objectStore.createIndex('pinned', 'pinned', { unique: false });
        objectStore.createIndex('date', 'date', { unique: false });
    };
    
    request.onsuccess = function(event) {
        db = event.target.result;
        console.log('Base de datos IndexedDB inicializada');
        loadNotes();
    };
}

// Crear tablas para SQLite
function createTables() {
    if (window.sqlitePlugin) {
        db.transaction(function(tx) {
            tx.executeSql(`
                CREATE TABLE IF NOT EXISTS notes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT,
                    content TEXT,
                    pinned INTEGER DEFAULT 0,
                    password TEXT,
                    date DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
        }, function(error) {
            console.error('Error creating table:', error);
        }, function() {
            console.log('Tabla de notas creada correctamente');
            loadNotes();
        });
    }
}

// Cargar notas desde la base de datos
function loadNotes() {
    if (db && window.sqlitePlugin) {
        // Cargar desde SQLite
        db.transaction(function(tx) {
            tx.executeSql('SELECT * FROM notes ORDER BY pinned DESC, date DESC', [], function(tx, results) {
                notes = [];
                for (let i = 0; i < results.rows.length; i++) {
                    notes.push(results.rows.item(i));
                }
                displayNotes();
            });
        });
    } else if (db) {
        // Cargar desde IndexedDB
        const transaction = db.transaction(['notes'], 'readonly');
        const objectStore = transaction.objectStore('notes');
        const request = objectStore.getAll();
        
        request.onsuccess = function(event) {
            notes = event.target.result.sort((a, b) => {
                if (a.pinned !== b.pinned) return b.pinned - a.pinned;
                return new Date(b.date) - new Date(a.date);
            });
            displayNotes();
        };
    } else {
        // Fallback a localStorage
        notes = JSON.parse(localStorage.getItem('notes')) || [];
        displayNotes();
    }
}

// Mostrar notas en la interfaz
function displayNotes() {
    const pinnedList = document.getElementById('pinned-notes');
    const allNotesList = document.getElementById('all-notes');
    
    pinnedList.innerHTML = '';
    allNotesList.innerHTML = '';
    
    notes.forEach((note, index) => {
        const noteElement = createNoteElement(note, index);
        
        if (note.pinned) {
            pinnedList.appendChild(noteElement);
        } else {
            allNotesList.appendChild(noteElement);
        }
    });
}

// Crear elemento de nota para la lista
function createNoteElement(note, index) {
    const li = document.createElement('li');
    li.className = 'note-item';
    li.dataset.id = index;
    
    if (currentNoteId === index) {
        li.classList.add('selected');
    }
    
    const titleDiv = document.createElement('div');
    titleDiv.className = 'note-item-title';
    titleDiv.textContent = note.title || 'Sin título';
    
    const previewDiv = document.createElement('div');
    previewDiv.className = 'note-item-preview';
    // Eliminar etiquetas HTML para la vista previa
    const plainText = note.content ? note.content.replace(/<[^>]*>/g, '') : '';
    previewDiv.textContent = plainText.substring(0, 50) + (plainText.length > 50 ? '...' : '');
    
    const dateDiv = document.createElement('div');
    dateDiv.className = 'note-item-date';
    dateDiv.textContent = formatDate(note.date);
    
    // Icono de candado si tiene contraseña
    if (note.password) {
        const lockIcon = document.createElement('i');
        lockIcon.className = 'fas fa-lock';
        lockIcon.style.marginLeft = '5px';
        lockIcon.style.color = '#888';
        lockIcon.style.fontSize = '10px';
        titleDiv.appendChild(lockIcon);
    }
    
    li.appendChild(titleDiv);
    li.appendChild(previewDiv);
    li.appendChild(dateDiv);
    
    li.addEventListener('click', () => {
        openNote(index);
    });
    
    return li;
}

// Formatear fecha
function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return 'Hoy ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
        return 'Ayer ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
        return `Hace ${diffDays} días`;
    } else {
        return date.toLocaleDateString();
    }
}

// Abrir una nota
function openNote(id) {
    currentNoteId = id;
    const note = notes[id];
    
    // Si la nota tiene contraseña, pedirla
    if (note.password) {
        const password = prompt('Esta nota está protegida. Introduce la contraseña:');
        if (password !== note.password) {
            alert('Contraseña incorrecta');
            return;
        }
    }
    
    // Actualizar selección en la lista
    document.querySelectorAll('.note-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    const selectedItem = document.querySelector(`.note-item[data-id="${id}"]`);
    if (selectedItem) {
        selectedItem.classList.add('selected');
    }
    
    // Mostrar editor y ocultar placeholder
    document.getElementById('editor-hidden').style.display = 'none';
    document.getElementById('editor').style.display = 'flex';
    
    // Cargar contenido en el editor
    document.getElementById('note-title').innerHTML = note.title || '';
    document.getElementById('note-content').innerHTML = note.content || '';
    
    // Ocultar sidebar si está visible
    if (isSidebarVisible) {
        toggleSidebar();
    }
    
    // Reiniciar estado de cambios
    hasUnsavedChanges = false;
}

// Crear nueva nota
function createNewNote() {
    const newNote = {
        title: '',
        content: '',
        date: new Date().toISOString(),
        pinned: false,
        password: null
    };
    
    // Guardar en la base de datos
    saveNoteToDatabase(newNote, function(id) {
        newNote.id = id;
        notes.unshift(newNote);
        loadNotes();
        openNote(0);
    });
}

// Guardar nota en la base de datos
function saveNoteToDatabase(note, callback) {
    if (db && window.sqlitePlugin) {
        // Guardar en SQLite
        db.transaction(function(tx) {
            tx.executeSql(
                'INSERT INTO notes (title, content, pinned, password, date) VALUES (?, ?, ?, ?, ?)',
                [note.title, note.content, note.pinned ? 1 : 0, note.password, note.date],
                function(tx, results) {
                    callback(results.insertId);
                }
            );
        });
    } else if (db) {
        // Guardar en IndexedDB
        const transaction = db.transaction(['notes'], 'readwrite');
        const objectStore = transaction.objectStore('notes');
        const request = objectStore.add(note);
        
        request.onsuccess = function(event) {
            callback(event.target.result);
        };
    } else {
        // Fallback a localStorage
        note.id = Date.now();
        notes.unshift(note);
        localStorage.setItem('notes', JSON.stringify(notes));
        callback(note.id);
    }
}

// Actualizar nota en la base de datos
function updateNoteInDatabase(note) {
    if (db && window.sqlitePlugin) {
        // Actualizar en SQLite
        db.transaction(function(tx) {
            tx.executeSql(
                'UPDATE notes SET title = ?, content = ?, pinned = ?, password = ?, date = ? WHERE id = ?',
                [note.title, note.content, note.pinned ? 1 : 0, note.password, note.date, note.id]
            );
        });
    } else if (db) {
        // Actualizar en IndexedDB
        const transaction = db.transaction(['notes'], 'readwrite');
        const objectStore = transaction.objectStore('notes');
        objectStore.put(note);
    } else {
        // Fallback a localStorage
        localStorage.setItem('notes', JSON.stringify(notes));
    }
}

// Alternar visibilidad del sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('hidden');
    isSidebarVisible = !sidebar.classList.contains('hidden');
}

// Cambiar vista (mosaico/lista)
function changeView() {
    const noteList = document.getElementById('all-notes');
    noteList.classList.toggle('grid-view');
    
    const pinnedList = document.getElementById('pinned-notes');
    pinnedList.classList.toggle('grid-view');
    
    const icon = document.getElementById('change-view');
    if (noteList.classList.contains('grid-view')) {
        icon.classList.remove('fa-th');
        icon.classList.add('fa-list');
    } else {
        icon.classList.remove('fa-list');
        icon.classList.add('fa-th');
    }
}

// Limpiar dashboard
function clearDashboard() {
    if (confirm('¿Estás seguro de que quieres eliminar todas las notas?')) {
        if (db && window.sqlitePlugin) {
            db.transaction(function(tx) {
                tx.executeSql('DELETE FROM notes', [], function() {
                    notes = [];
                    loadNotes();
                    showEditorPlaceholder();
                });
            });
        } else if (db) {
            const transaction = db.transaction(['notes'], 'readwrite');
            const objectStore = transaction.objectStore('notes');
            const request = objectStore.clear();
            
            request.onsuccess = function() {
                notes = [];
                loadNotes();
                showEditorPlaceholder();
            };
        } else {
            notes = [];
            localStorage.setItem('notes', JSON.stringify(notes));
            loadNotes();
            showEditorPlaceholder();
        }
    }
}

// Mostrar placeholder del editor
function showEditorPlaceholder() {
    document.getElementById('editor-hidden').style.display = 'flex';
    document.getElementById('editor').style.display = 'none';
    currentNoteId = null;
}

// Alternar menú de nueva nota
function toggleNewNoteMenu(e) {
    e.stopPropagation();
    const menu = document.getElementById('new-note-menu');
    const isVisible = menu.style.display === 'block';
    
    closeAllMenus();
    
    if (!isVisible) {
        menu.style.display = 'block';
        menu.style.top = '45px';
        menu.style.right = '60px';
    }
}

// Configurar herramientas del editor
function setupEditorTools() {
    // Botones de formato de texto
    document.getElementById('bold-btn').addEventListener('click', () => {
        document.execCommand('bold', false, null);
        trackChanges();
    });
    
    document.getElementById('italic-btn').addEventListener('click', () => {
        document.execCommand('italic', false, null);
        trackChanges();
    });
    
    document.getElementById('underline-btn').addEventListener('click', () => {
        document.execCommand('underline', false, null);
        trackChanges();
    });
    
    document.getElementById('strike-btn').addEventListener('click', () => {
        document.execCommand('strikeThrough', false, null);
        trackChanges();
    });
    
    // Alineación de texto
    document.getElementById('align-left-btn').addEventListener('click', () => {
        document.execCommand('justifyLeft', false, null);
        trackChanges();
    });
    
    document.getElementById('align-center-btn').addEventListener('click', () => {
        document.execCommand('justifyCenter', false, null);
        trackChanges();
    });
    
    document.getElementById('align-right-btn').addEventListener('click', () => {
        document.execCommand('justifyRight', false, null);
        trackChanges();
    });
    
    document.getElementById('align-justify-btn').addEventListener('click', () => {
        document.execCommand('justifyFull', false, null);
        trackChanges();
    });
    
    // Listas
    document.getElementById('list-ul-btn').addEventListener('click', () => {
        document.execCommand('insertUnorderedList', false, null);
        trackChanges();
    });
    
    document.getElementById('list-ol-btn').addEventListener('click', () => {
        document.execCommand('insertOrderedList', false, null);
        trackChanges();
    });
    
    document.getElementById('indent-btn').addEventListener('click', () => {
        document.execCommand('indent', false, null);
        trackChanges();
    });
    
    document.getElementById('outdent-btn').addEventListener('click', () => {
        document.execCommand('outdent', false, null);
        trackChanges();
    });

    // Selectores de fuente y tamaño
    document.getElementById('font-family').addEventListener('change', function() {
        document.execCommand('fontName', false, this.value);
        trackChanges();
    });
    
    document.getElementById('font-size').addEventListener('change', function() {
        document.execCommand('fontSize', false, this.value);
        trackChanges();
    });
    
    // Selector de color
    document.getElementById('color-btn').addEventListener('click', function() {
        document.getElementById('color-picker').click();
    });
    
    document.getElementById('color-picker').addEventListener('input', function() {
        document.execCommand('foreColor', false, this.value);
        trackChanges();
    });
    
    // Botón de resaltado
    document.getElementById('highlight-btn').addEventListener('click', function() {
        document.getElementById('highlight-picker').click();
    });
    
    document.getElementById('highlight-picker').addEventListener('input', function() {
        document.execCommand('hiliteColor', false, this.value);
        trackChanges();
    });
    
    // Insertar imagen
    document.getElementById('image-btn').addEventListener('click', function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    document.execCommand('insertImage', false, event.target.result);
                    trackChanges();
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    });
    
    // Insertar video
    document.getElementById('video-btn').addEventListener('click', function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'video/*';
        input.onchange = function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const videoHTML = `<video controls width="100%"><source src="${event.target.result}" type="${file.type}"></video>`;
                    document.execCommand('insertHTML', false, videoHTML);
                    trackChanges();
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    });
    
    // Insertar audio
    document.getElementById('audio-btn').addEventListener('click', function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'audio/*';
        input.onchange = function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const audioHTML = `<audio controls><source src="${event.target.result}" type="${file.type}"></audio>`;
                    document.execCommand('insertHTML', false, audioHTML);
                    trackChanges();
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    });
    
    // Insertar enlace
    document.getElementById('link-btn').addEventListener('click', function() {
        const url = prompt('Introduce la URL:');
        if (url) {
            document.execCommand('createLink', false, url);
            trackChanges();
        }
    });
    
    // Bloquear nota
    document.getElementById('lock-btn').addEventListener('click', function(e) {
        e.stopPropagation();
        const menu = document.getElementById('lock-menu');
        const isVisible = menu.style.display === 'block';
        
        closeAllMenus();
        
        if (!isVisible) {
            menu.style.display = 'block';
            menu.style.bottom = '60px';
            menu.style.right = '15px';
        }
    });
    
    // Compartir nota
    document.getElementById('share-btn').addEventListener('click', function() {
        if (currentNoteId !== null) {
            shareNote(currentNoteId);
        } else {
            alert('No hay ninguna nota para compartir');
        }
    });
    
    // Guardar cambios automáticamente
    const titleElement = document.getElementById('note-title');
    const contentElement = document.getElementById('note-content');
    
    [titleElement, contentElement].forEach(element => {
        element.addEventListener('blur', saveCurrentNote);
        element.addEventListener('input', debounce(() => {
            trackChanges();
            saveCurrentNote();
        }, 1000));
    });
}

// Configurar menús contextuales
function setupContextMenus() {
    // Menú de nueva nota
    document.getElementById('create-note').addEventListener('click', function() {
        createNewNote();
        closeAllMenus();
    });
    
    document.getElementById('create-table').addEventListener('click', function() {
        if (currentNoteId !== null) {
            const rows = prompt('Número de filas:', '3');
            const cols = prompt('Número de columnas:', '2');
            
            if (rows && cols) {
                let tableHTML = '<table border="1" style="width:100%; border-collapse:collapse;">';
                
                // Crear encabezado
                tableHTML += '<tr>';
                for (let i = 0; i < cols; i++) {
                    tableHTML += `<th>Columna ${i+1}</th>`;
                }
                tableHTML += '</tr>';
                
                // Crear filas
                for (let i = 0; i < rows; i++) {
                    tableHTML += '<tr>';
                    for (let j = 0; j < cols; j++) {
                        tableHTML += `<td>Dato ${i+1}-${j+1}</td>`;
                    }
                    tableHTML += '</tr>';
                }
                
                tableHTML += '</table>';
                document.execCommand('insertHTML', false, tableHTML);
                saveCurrentNote();
            }
        } else {
            alert('Primero crea o selecciona una nota');
        }
        closeAllMenus();
    });
    
    // Menú de bloqueo
    document.getElementById('set-password').addEventListener('click', function() {
        if (currentNoteId !== null) {
            setNotePassword(currentNoteId);
        }
        closeAllMenus();
    });
    
    document.getElementById('set-pin').addEventListener('click', function() {
        if (currentNoteId !== null) {
            toggleNotePin(currentNoteId);
        }
        closeAllMenus();
    });
}

// Configurar modales
function setupModals() {
    // Modal de salida
    document.getElementById('exit-confirm').addEventListener('click', () => {
        closeModal('exit-modal');
        showEditorPlaceholder();
        hasUnsavedChanges = false;
    });
    
    document.getElementById('exit-cancel').addEventListener('click', () => {
        closeModal('exit-modal');
    });
    
    // Modal de IA
    document.getElementById('ai-close').addEventListener('click', () => {
        closeModal('ai-modal');
    });
    
    document.querySelectorAll('.ai-option').forEach(option => {
        option.addEventListener('click', function() {
            const action = this.getAttribute('data-action');
            handleAIAction(action);
        });
    });
}

// Mostrar modal de salida
function showExitModal() {
    if (hasUnsavedChanges) {
        showModal('exit-modal');
    } else {
        showEditorPlaceholder();
    }
}

// Mostrar modal
function showModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

// Cerrar modal
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Abrir modal de IA
function openAIModal() {
    showModal('ai-modal');
}

// Manejar acción de IA
function handleAIAction(action) {
    // Aquí integrarías con tu servicio de IA
    // Esta es una implementación simulada
    const noteContent = document.getElementById('note-content');
    let text = noteContent.textContent || noteContent.innerText;
    
    if (!text.trim()) {
        alert('No hay texto para procesar con IA');
        return;
    }
    
    let result = '';
    
    switch(action) {
        case 'improve':
            result = `Texto mejorado: ${text}`;
            break;
        case 'summarize':
            result = `Resumen: ${text.substring(0, 100)}...`;
            break;
        case 'translate':
            result = `Texto traducido: ${text}`;
            break;
        case 'correct':
            result = `Texto corregido: ${text}`;
            break;
    }
    
    // Insertar el resultado en el editor
    document.execCommand('insertText', false, `\n[IA - ${action}]: ${result}\n`);
    trackChanges();
    saveCurrentNote();
    
    closeModal('ai-modal');
}

// Cerrar todos los menús
function closeAllMenus() {
    document.querySelectorAll('.menu').forEach(menu => {
        menu.style.display = 'none';
    });
    
    document.querySelectorAll('.custom-context-menu').forEach(menu => {
        menu.remove();
    });
}

// Seguimiento de cambios
function trackChanges() {
    hasUnsavedChanges = true;
}

// Guardar nota actual
function saveCurrentNote() {
    if (currentNoteId !== null) {
        notes[currentNoteId].title = document.getElementById('note-title').innerHTML;
        notes[currentNoteId].content = document.getElementById('note-content').innerHTML;
        notes[currentNoteId].date = new Date().toISOString();
        
        updateNoteInDatabase(notes[currentNoteId]);
        loadNotes();
        hasUnsavedChanges = false;
    }
}

// Guardar nota como archivo .txt
function saveNoteToFile() {
    if (currentNoteId !== null) {
        const note = notes[currentNoteId];
        const title = note.title.replace(/<[^>]*>/g, '') || 'nota_sin_titulo';
        const content = note.content.replace(/<[^>]*>/g, '');
        
        // En un entorno Electron real, usarías dialog.showSaveDialog
        // Esta es una simulación para el navegador
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert(`Nota guardada como ${title}.txt`);
    } else {
        alert('No hay ninguna nota para guardar');
    }
}

// Búsqueda en el editor
function handleEditorSearch(e) {
    const searchTerm = e.target.value;
    const editorContent = document.getElementById('note-content');
    
    if (!searchTerm) {
        // Limpiar resaltados si no hay término de búsqueda
        removeEditorHighlights(editorContent);
        return;
    }
    
    // Resaltar término de búsqueda
    highlightInEditor(editorContent, searchTerm);
}

// Resaltar texto en el editor
function highlightInEditor(element, searchTerm) {
    // Primero eliminar resaltados anteriores
    removeEditorHighlights(element);
    
    const text = element.innerHTML;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const newText = text.replace(regex, '<mark class="highlight">$1</mark>');
    element.innerHTML = newText;
}

// Eliminar resaltados del editor
function removeEditorHighlights(element) {
    const highlights = element.querySelectorAll('.highlight');
    highlights.forEach(highlight => {
        const parent = highlight.parentNode;
        parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
        parent.normalize();
    });
}

// Iniciar reconocimiento de voz en el editor
function startEditorVoiceRecognition() {
    if ('webkitSpeechRecognition' in window) {
        const recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'es-ES';
        
        recognition.onstart = function() {
            document.getElementById('editor-mic-btn').style.color = '#007aff';
        };
        
        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            document.execCommand('insertText', false, transcript);
            trackChanges();
        };
        
        recognition.onerror = function(event) {
            console.error('Error en reconocimiento de voz:', event.error);
            document.getElementById('editor-mic-btn').style.color = '#888';
        };
        
        recognition.onend = function() {
            document.getElementById('editor-mic-btn').style.color = '#888';
        };
        
        recognition.start();
    } else {
        alert('Tu navegador no soporta reconocimiento de voz');
    }
}

// Manejar búsqueda global
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    
    document.querySelectorAll('.note-item').forEach(item => {
        const title = item.querySelector('.note-item-title').textContent.toLowerCase();
        const preview = item.querySelector('.note-item-preview').textContent.toLowerCase();
        
        if (title.includes(searchTerm) || preview.includes(searchTerm)) {
            item.style.display = 'block';
            
            // Resaltar término de búsqueda
            if (searchTerm) {
                highlightText(item, searchTerm);
            } else {
                removeHighlights(item);
            }
        } else {
            item.style.display = 'none';
        }
    });
}

// Resaltar texto en los elementos de nota
function highlightText(element, searchTerm) {
    removeHighlights(element);
    
    const title = element.querySelector('.note-item-title');
    const preview = element.querySelector('.note-item-preview');
    
    [title, preview].forEach(el => {
        const text = el.textContent;
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        const newText = text.replace(regex, '<mark>$1</mark>');
        el.innerHTML = newText;
    });
}

// Eliminar resaltados
function removeHighlights(element) {
    element.querySelectorAll('mark').forEach(mark => {
        const parent = mark.parentNode;
        parent.replaceChild(document.createTextNode(mark.textContent), mark);
    });
}

// Iniciar reconocimiento de voz
function startVoiceRecognition() {
    if ('webkitSpeechRecognition' in window) {
        const recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'es-ES';
        
        recognition.onstart = function() {
            document.getElementById('mic-btn').style.color = '#007aff';
        };
        
        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            document.getElementById('search-box').value = transcript;
            handleSearch({target: {value: transcript}});
        };
        
        recognition.onerror = function(event) {
            console.error('Error en reconocimiento de voz:', event.error);
            document.getElementById('mic-btn').style.color = '#888';
        };
        
        recognition.onend = function() {
            document.getElementById('mic-btn').style.color = '#888';
        };
        
        recognition.start();
    } else {
        alert('Tu navegador no soporta reconocimiento de voz');
    }
}

// Función debounce para optimizar
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const { ipcRenderer } = require('electron');

// Botones
document.getElementById('btn-minimize').addEventListener('click', () => {
    ipcRenderer.send('window-minimize');
});

document.getElementById('btn-maximize').addEventListener('click', () => {
    ipcRenderer.send('window-maximize');
});

document.getElementById('btn-close').addEventListener('click', () => {
    ipcRenderer.send('window-close');
});
