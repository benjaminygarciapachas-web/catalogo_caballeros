const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, 'catalogo.sqlite');
const initSqlPath = path.resolve(__dirname, 'init.sql');

// Instancia de base de datos SQL
const db = new DatabaseSync(dbPath);

// Habilitar claves foráneas
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

// Inicializar esquema si las tablas no existen
function initDatabase() {
  try {
    if (fs.existsSync(initSqlPath)) {
      const sql = fs.readFileSync(initSqlPath, 'utf-8');
      db.exec(sql);
      console.log('✅ [DATABASE] Tablas y esquema SQL inicializados correctamente.');
    }
  } catch (error) {
    console.error('❌ [DATABASE] Error al inicializar esquema SQL:', error);
  }
}

initDatabase();

// Métodos auxiliares para consultas limpias y seguras
const dbHelper = {
  // Retorna todas las filas encontradas
  all(sql, params = []) {
    try {
      const stmt = db.prepare(sql);
      const rows = stmt.all(...params);
      // Convertir prototipos u objetos limpios
      return rows.map(r => ({ ...r }));
    } catch (err) {
      console.error(`[DB ERROR all] ${sql}`, err);
      throw err;
    }
  },

  // Retorna una única fila
  get(sql, params = []) {
    try {
      const stmt = db.prepare(sql);
      const row = stmt.get(...params);
      return row ? { ...row } : null;
    } catch (err) {
      console.error(`[DB ERROR get] ${sql}`, err);
      throw err;
    }
  },

  // Ejecuta INSERT, UPDATE o DELETE
  run(sql, params = []) {
    try {
      const stmt = db.prepare(sql);
      const result = stmt.run(...params);
      return {
        changes: Number(result.changes),
        lastInsertRowid: Number(result.lastInsertRowid)
      };
    } catch (err) {
      console.error(`[DB ERROR run] ${sql}`, err);
      throw err;
    }
  },

  // Ejecuta sentencias directas
  exec(sql) {
    return db.exec(sql);
  },

  raw: db
};

module.exports = dbHelper;
