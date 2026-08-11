require('dotenv').config();
const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

let dbInstance = null;

async function connectDB() {
  if (dbInstance) {
    return dbInstance;
  }

  const dbFile = process.env.DB_FILE || 'database.db';
  const dbPath = process.env.VERCEL || process.env.NODE_ENV === 'production'
    ? path.join('/tmp', dbFile)
    : path.join(__dirname, dbFile);

  try {
    dbInstance = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    await dbInstance.exec(`
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

    console.log(`✅ Database connected successfully (${dbPath})`);
    return dbInstance;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

module.exports = connectDB;