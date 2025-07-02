import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const mockStatement = {
    run: jest.fn(),
    get: jest.fn(),
    all: jest.fn(),
};

const mockDbInstance = {
    prepare: jest.fn(),
    exec: jest.fn(),
};

jest.unstable_mockModule('better-sqlite3', () => ({
    default: jest.fn(() => mockDbInstance),
}));

const {
    createDocument,
    getDocument,
    appendEntry,
    getDocumentContent,
    listDocuments,
} = await import('./database.js');


describe('Database Functions', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        mockDbInstance.prepare.mockImplementation(() => mockStatement);
    });

    describe('createDocument', () => {
        it('should create a new document successfully', () => {
            mockStatement.run.mockReturnValue({ lastInsertRowid: 1, changes: 1 });
            const result = createDocument('test-doc');
            expect(mockDbInstance.prepare).toHaveBeenCalledWith('INSERT INTO documents (name) VALUES (?)');
            expect(mockStatement.run).toHaveBeenCalledWith('test-doc');
            expect(result).toEqual({ lastInsertRowid: 1, changes: 1 });
        });

        it('should handle errors during document creation', () => {
            const error = new Error('DB Error');
            mockStatement.run.mockImplementation(() => {
                throw error;
            });
            expect(() => createDocument('test-doc')).toThrow('DB Error');
        });
    });

    describe('getDocument', () => {
        it('should retrieve an existing document', () => {
            const doc = { id: 1 };
            mockStatement.get.mockReturnValue(doc);
            const result = getDocument('test-doc');
            expect(mockDbInstance.prepare).toHaveBeenCalledWith('SELECT id FROM documents WHERE name = ?');
            expect(mockStatement.get).toHaveBeenCalledWith('test-doc');
            expect(result).toEqual(doc);
        });

        it('should return undefined for a non-existent document', () => {
            mockStatement.get.mockReturnValue(undefined);
            const result = getDocument('non-existent-doc');
            expect(mockDbInstance.prepare).toHaveBeenCalledWith('SELECT id FROM documents WHERE name = ?');
            expect(mockStatement.get).toHaveBeenCalledWith('non-existent-doc');
            expect(result).toBeUndefined();
        });
    });

    describe('appendEntry', () => {
        it('should create a new document and append an entry', () => {
            mockStatement.get
                .mockReturnValueOnce(undefined) // getDocument returns no doc
                .mockReturnValueOnce(undefined); // get section returns no section

            mockStatement.run
                .mockReturnValueOnce({ lastInsertRowid: 1, changes: 1 }) // createDocument
                .mockReturnValueOnce({ lastInsertRowid: 1, changes: 1 }); // createSection

            appendEntry('new-doc', 'section1', 'entry1');

            // createDocument call
            expect(mockDbInstance.prepare).toHaveBeenCalledWith('INSERT INTO documents (name) VALUES (?)');
            expect(mockStatement.run).toHaveBeenCalledWith('new-doc');

            // createSection call
            expect(mockDbInstance.prepare).toHaveBeenCalledWith('INSERT INTO sections (document_id, title) VALUES (?, ?)');
            expect(mockStatement.run).toHaveBeenCalledWith(1, 'section1');

            // createEntry call
            expect(mockDbInstance.prepare).toHaveBeenCalledWith('INSERT INTO entries (section_id, content) VALUES (?, ?)');
            expect(mockStatement.run).toHaveBeenCalledWith(1, 'entry1');
        });

        it('should append an entry to an existing document and new section', () => {
            mockStatement.get
                .mockReturnValueOnce({ id: 1 }) // getDocument
                .mockReturnValueOnce(undefined); // get section

            mockStatement.run.mockReturnValueOnce({ lastInsertRowid: 2, changes: 1 }); // createSection

            appendEntry('existing-doc', 'new-section', 'entry1');

            expect(mockDbInstance.prepare).toHaveBeenCalledWith('SELECT id FROM documents WHERE name = ?');
            expect(mockStatement.get).toHaveBeenCalledWith('existing-doc');

            expect(mockDbInstance.prepare).toHaveBeenCalledWith('INSERT INTO sections (document_id, title) VALUES (?, ?)');
            expect(mockStatement.run).toHaveBeenCalledWith(1, 'new-section');

            expect(mockDbInstance.prepare).toHaveBeenCalledWith('INSERT INTO entries (section_id, content) VALUES (?, ?)');
            expect(mockStatement.run).toHaveBeenCalledWith(2, 'entry1');
        });

        it('should append an entry to an existing document and existing section', () => {
            mockStatement.get
                .mockReturnValueOnce({ id: 1 }) // getDocument
                .mockReturnValueOnce({ id: 1 }); // get section

            appendEntry('existing-doc', 'existing-section', 'entry2');

            expect(mockDbInstance.prepare).toHaveBeenCalledWith('SELECT id FROM documents WHERE name = ?');
            expect(mockStatement.get).toHaveBeenCalledWith('existing-doc');

            expect(mockDbInstance.prepare).toHaveBeenCalledWith('SELECT id FROM sections WHERE document_id = ? AND title = ?');
            expect(mockStatement.get).toHaveBeenCalledWith(1, 'existing-section');

            expect(mockDbInstance.prepare).toHaveBeenCalledWith('INSERT INTO entries (section_id, content) VALUES (?, ?)');
            expect(mockStatement.run).toHaveBeenCalledWith(1, 'entry2');
        });
    });

    describe('getDocumentContent', () => {
        it('should return null for a non-existent document', () => {
            mockStatement.get.mockReturnValue(undefined);
            const content = getDocumentContent('non-existent-doc');
            expect(content).toBeNull();
        });

        it('should return an empty string for a document with no sections', () => {
            mockStatement.get.mockReturnValue({ id: 1 });
            mockStatement.all.mockReturnValue([]);
            const content = getDocumentContent('empty-doc');
            expect(content).toBe("");
        });

        it('should retrieve content from a populated document', () => {
            mockStatement.get.mockReturnValue({ id: 1 });
            mockStatement.all
                .mockReturnValueOnce([
                    { id: 1, title: 'Section 1' },
                    { id: 2, title: 'Section 2' },
                ]) // sections
                .mockReturnValueOnce([{ content: 'Entry 1.1' }, { content: 'Entry 1.2' }]) // entries for section 1
                .mockReturnValueOnce([{ content: 'Entry 2.1' }]); // entries for section 2

            const content = getDocumentContent('populated-doc');

            const expectedContent =
`Section 1
- Entry 1.1
- Entry 1.2

Section 2
- Entry 2.1

`;
            expect(content).toBe(expectedContent);
        });
    });

    describe('listDocuments', () => {
        it('should return an empty array when the database is empty', () => {
            mockStatement.all.mockReturnValue([]);
            const docs = listDocuments();
            expect(docs).toEqual([]);
        });

        it('should return a list of document names', () => {
            const docNames = [{ name: 'doc1' }, { name: 'doc2' }];
            mockStatement.all.mockReturnValue(docNames);
            const docs = listDocuments();
            expect(docs).toEqual(['doc1', 'doc2']);
        });
    });
});