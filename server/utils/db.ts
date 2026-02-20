import Database from 'better-sqlite3'
import { randomUUID } from 'crypto'
import path from 'path'

// Resolve database path from env or default
let dbPath = process.env.DATABASE_URL || './dev.db'
if (dbPath.startsWith('file:')) {
  dbPath = dbPath.slice(5)
}

// Ensure directory exists
import fs from 'fs'
const dbDir = path.dirname(dbPath)
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

const db = new Database(dbPath)

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// Auto-create tables on startup
db.exec(`
  CREATE TABLE IF NOT EXISTS User (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS Workspace (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    ownerId TEXT NOT NULL,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (ownerId) REFERENCES User(id)
  );

  CREATE TABLE IF NOT EXISTS WorkspaceMember (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    workspaceId TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'MEMBER',
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES User(id),
    FOREIGN KEY (workspaceId) REFERENCES Workspace(id),
    UNIQUE(userId, workspaceId)
  );

  CREATE TABLE IF NOT EXISTS Page (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL DEFAULT 'Untitled',
    content TEXT,
    workspaceId TEXT NOT NULL,
    parentId TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (workspaceId) REFERENCES Workspace(id),
    FOREIGN KEY (parentId) REFERENCES Page(id)
  );
`)

export { db, randomUUID }
