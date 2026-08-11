require('dotenv').config();
const { createClient } = require('@libsql/client');

let clientInstance = null;
let dbWrapper = null;

async function connectDB() {
  if (dbWrapper) {
    return dbWrapper;
  }

  const url = process.env.TURSO_DATABASE_URL || 'file:database.db';
  const authToken = process.env.TURSO_AUTH_TOKEN;

  clientInstance = createClient({
    url: url,
    authToken: authToken,
  });

  dbWrapper = {
    async get(sql, args = []) {
      const res = await clientInstance.execute({ sql, args });
      return res.rows[0] || null;
    },

    async all(sql, args = []) {
      const res = await clientInstance.execute({ sql, args });
      return res.rows;
    },

    async run(sql, args = []) {
      const res = await clientInstance.execute({ sql, args });
      return {
        lastID: res.lastInsertRowid !== undefined ? Number(res.lastInsertRowid) : null,
        changes: res.rowsAffected
      };
    },

    async exec(sql) {
      return await clientInstance.executeMultiple(sql);
    }
  };

  try {
    await dbWrapper.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS registrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        event TEXT NOT NULL,
        tickets INTEGER DEFAULT 1,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Connected to Turso Database successfully');
    return dbWrapper;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

module.exports = connectDB;