import Database, { Database as DB } from 'better-sqlite3';
import { jest, describe, beforeAll, afterAll, beforeEach, test, expect } from '@jest/globals';
import {
  createDocument,
  getDocument,
  appendEntry,
  getDocumentContent,
  listDocuments,
  getDb,
} from './database.js';

// Mock the getDb function to use an in-memory database for tests
jest.mock('./database.js', () => {
  const originalModule = jest.requireActual('./database.js') as any;
  const inMemoryDb = new Database(':memory:');

  // Redirect all database operations to the in-memory instance
  return {
    ...originalModule,
    getDb: () => inMemoryDb,
  };
});

const createTestSchema = (db: DB) => {
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

describe('Database Integration Tests', () => {
  let db: DB;

  beforeAll(() => {
    db = getDb();
    createTestSchema(db);
  });

  afterAll(() => {
    db.close();
  });

  // Clear all data before each test
  beforeEach(() => {
    db.exec('DELETE FROM entries');
    db.exec('DELETE FROM sections');
    db.exec('DELETE FROM documents');
  });

  test('should create a document and retrieve it', () => {
    const docName = 'test-document';
    createDocument(docName);
    const doc = getDocument(docName);
    expect(doc).toBeDefined();
    expect(doc?.id).toBeGreaterThan(0);
  });

  test('should list all documents', () => {
    createDocument('doc1');
    createDocument('doc2');
    const docs = listDocuments();
    expect(docs).toHaveLength(2);
    expect(docs).toContain('doc1');
    expect(docs).toContain('doc2');
  });

  test('should append an entry to a new document and section', () => {
    const docName = 'diary';
    const section = '2025-07-02';
    const entry = 'Today was a good day.';
    
    appendEntry(docName, section, entry);
    
    const content = getDocumentContent(docName);
    expect(content).toContain(section);
    expect(content).toContain(entry);
  });

  test('should append multiple entries to the same section', () => {
    const docName = 'logs';
    const section = 'errors';
    
    appendEntry(docName, section, 'error 1');
    appendEntry(docName, section, 'error 2');

    const content = getDocumentContent(docName);
    expect(content).toContain('error 1');
    expect(content).toContain('error 2');
  });

  test('should handle multiple sections in a document', () => {
    const docName = 'project-plan';
    appendEntry(docName, 'Frontend', 'Build UI');
    appendEntry(docName, 'Backend', 'Setup database');

    const content = getDocumentContent(docName);
    expect(content).toContain('Frontend');
    expect(content).toContain('Backend');
    expect(content).toContain('Build UI');
    expect(content).toContain('Setup database');
  });

  test('should return null for non-existent document content', () => {
    const content = getDocumentContent('non-existent-doc');
    expect(content).toBeNull();
  });

  test('should return an empty string for a document with no sections', () => {
    const docName = 'empty-doc';
    createDocument(docName);
    const content = getDocumentContent(docName);
    expect(content).toBe("");
  });
});