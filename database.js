const mysql = require('mysql2/promise');

class NotesDatabase {
    constructor() {
        this.connection = null;
    }
    
    // Conectar a la base de datos
    async connect() {
        try {
            this.connection = await mysql.createConnection({
                host: 'localhost',
                user: 'root',
                password: '',
                database: 'notes_app'
            });
            
            console.log('Conectado a la base de datos MySQL');
            
            // Crear tabla si no existe
            await this.createTable();
        } catch (error) {
            console.error('Error conectando a la base de datos:', error);
        }
    }
    
    // Crear tabla de notas
    async createTable() {
        const query = `
            CREATE TABLE IF NOT EXISTS notes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title TEXT,
                content LONGTEXT,
                pinned BOOLEAN DEFAULT FALSE,
                password VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `;
        
        await this.connection.execute(query);
    }
    
    // Obtener todas las notas
    async getAllNotes() {
        try {
            const [rows] = await this.connection.execute('SELECT * FROM notes ORDER BY pinned DESC, updated_at DESC');
            return rows;
        } catch (error) {
            console.error('Error obteniendo notas:', error);
            return [];
        }
    }
    
    // Obtener una nota por ID
    async getNoteById(id) {
        try {
            const [rows] = await this.connection.execute('SELECT * FROM notes WHERE id = ?', [id]);
            return rows[0] || null;
        } catch (error) {
            console.error('Error obteniendo nota:', error);
            return null;
        }
    }
    
    // Crear una nueva nota
    async createNote(note) {
        try {
            const { title, content, pinned, password } = note;
            const [result] = await this.connection.execute(
                'INSERT INTO notes (title, content, pinned, password) VALUES (?, ?, ?, ?)',
                [title, content, pinned || false, password || null]
            );
            return result.insertId;
        } catch (error) {
            console.error('Error creando nota:', error);
            return null;
        }
    }
    
    // Actualizar una nota
    async updateNote(id, note) {
        try {
            const { title, content, pinned, password } = note;
            await this.connection.execute(
                'UPDATE notes SET title = ?, content = ?, pinned = ?, password = ? WHERE id = ?',
                [title, content, pinned || false, password || null, id]
            );
            return true;
        } catch (error) {
            console.error('Error actualizando nota:', error);
            return false;
        }
    }
    
    // Actualizar solo el campo pinned
    async updateNotePin(id, pinned) {
        try {
            await this.connection.execute(
                'UPDATE notes SET pinned = ? WHERE id = ?',
                [pinned, id]
            );
            return true;
        } catch (error) {
            console.error('Error actualizando pin:', error);
            return false;
        }
    }
    
    // Actualizar solo la contraseña
    async updateNotePassword(id, password) {
        try {
            await this.connection.execute(
                'UPDATE notes SET password = ? WHERE id = ?',
                [password, id]
            );
            return true;
        } catch (error) {
            console.error('Error actualizando contraseña:', error);
            return false;
        }
    }
    
    // Eliminar una nota
    async deleteNote(id) {
        try {
            await this.connection.execute('DELETE FROM notes WHERE id = ?', [id]);
            return true;
        } catch (error) {
            console.error('Error eliminando nota:', error);
            return false;
        }
    }
    
    // Buscar notas
    async searchNotes(query) {
        try {
            const searchQuery = `%${query}%`;
            const [rows] = await this.connection.execute(
                'SELECT * FROM notes WHERE title LIKE ? OR content LIKE ? ORDER BY updated_at DESC',
                [searchQuery, searchQuery]
            );
            return rows;
        } catch (error) {
            console.error('Error buscando notas:', error);
            return [];
        }
    }
    
    // Verificar contraseña de nota
    async verifyNotePassword(id, password) {
        try {
            const [rows] = await this.connection.execute(
                'SELECT password FROM notes WHERE id = ?',
                [id]
            );
            
            if (rows.length === 0) return false;
            return rows[0].password === password;
        } catch (error) {
            console.error('Error verificando contraseña:', error);
            return false;
        }
    }
    
    // Cerrar conexión
    async close() {
        if (this.connection) {
            await this.connection.end();
        }
    }
}

module.exports = NotesDatabase;