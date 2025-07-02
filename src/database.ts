import Database, { Database as DB } from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(process.cwd(), 'db');
const DB_PATH = path.join(DB_DIR, 'memory-bank.db');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

const createSchema = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        document_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (document_id) REFERENCES documents(id)
    );

    CREATE TABLE IF NOT EXISTS entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        section_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (section_id) REFERENCES sections(id)
    );
  `);
};

createSchema();

export const getDb = (): DB => db;

// Document CRUD
export const createDocument = (name: string): Database.RunResult => {
    return db.prepare('INSERT INTO documents (name) VALUES (?)').run(name);
};

export const getDocument = (name: string): { id: number; } | undefined => {
    return db.prepare('SELECT id FROM documents WHERE name = ?').get(name) as { id: number; } | undefined;
};

// Section and Entry CRUD
export const appendEntry = (documentName: string, sectionHeader: string, entry: string) => {
    let document = getDocument(documentName);
    if (!document) {
        const result = createDocument(documentName);
        document = { id: result.lastInsertRowid as number };
    }

    let section = db.prepare('SELECT id FROM sections WHERE document_id = ? AND title = ?').get(document.id, sectionHeader) as { id: number; } | undefined;
    if (!section) {
        const sectionResult = db.prepare('INSERT INTO sections (document_id, title) VALUES (?, ?)').run(document.id, sectionHeader);
        section = { id: sectionResult.lastInsertRowid as number };
    }

    db.prepare('INSERT INTO entries (section_id, content) VALUES (?, ?)').run(section.id, entry);
};

export const getDocumentContent = (documentName: string): string | null => {
    const document = getDocument(documentName);
    if (!document) {
        return null;
    }

    const sections = db.prepare('SELECT id, title FROM sections WHERE document_id = ? ORDER BY createdAt').all(document.id) as { id: number; title: string; }[];
    if (sections.length === 0) {
        return "";
    }

    let content = '';
    for (const section of sections) {
        content += `${section.title}\n`;
        const entries = db.prepare('SELECT content FROM entries WHERE section_id = ? ORDER BY createdAt').all(section.id) as { content: string; }[];
        for (const entry of entries) {
            content += `- ${entry.content}\n`;
        }
        content += '\n';
    }
    return content;
};

export const listDocuments = (): string[] => {
    const rows = db.prepare('SELECT name FROM documents ORDER BY name').all() as { name: string; }[];
    return rows.map(row => row.name);
}