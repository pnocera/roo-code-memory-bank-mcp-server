import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import type { RooMemoryBankServer as RooMemoryBankServerType } from './index.js';

const mockDb = {
  createDocument: jest.fn(),
  listDocuments: jest.fn(),
  getDocumentContent: jest.fn(),
  appendEntry: jest.fn(),
};

const mockFs = {
  existsSync: jest.fn(),
};

jest.unstable_mockModule('./database.js', () => (mockDb));
jest.unstable_mockModule('fs', () => ({
    default: mockFs,
    ...mockFs
}));

const { RooMemoryBankServer } = await import('./index.js');

describe('RooMemoryBankServer', () => {
  let server: RooMemoryBankServerType;

  beforeEach(() => {
    server = new RooMemoryBankServer();
    jest.resetAllMocks();
  });

  describe('initializeMemoryBank', () => {
    it('should call createDocument for each initial document', async () => {
      const initialDocs = ["productContext.md", "activeContext.md", "progress.md", "decisionLog.md", "systemPatterns.md"];
      await server.initializeMemoryBank({});
      expect(mockDb.createDocument).toHaveBeenCalledTimes(initialDocs.length);
      for (const doc of initialDocs) {
        expect(mockDb.createDocument).toHaveBeenCalledWith(doc);
      }
    });

    it('should call appendEntry for productContext.md when project_brief_content is provided', async () => {
      const brief = "This is a test brief.";
      await server.initializeMemoryBank({ project_brief_content: brief });
      expect(mockDb.appendEntry).toHaveBeenCalledWith("productContext.md", "# Product Context", `Based on project brief:\n\n${brief}`);
    });

    it('should return a success message on initialization', async () => {
        mockDb.createDocument.mockImplementation(() => {
            const error: any = new Error("Already exists");
            error.code = 'SQLITE_CONSTRAINT_UNIQUE';
            throw error;
        });
        const result = await server.initializeMemoryBank({});
        expect(JSON.parse(result.content[0].text)).toEqual(expect.objectContaining({
            status: "success"
        }));
    });
  });

  describe('checkMemoryBankStatus', () => {
    it('should report that the bank is not initialized when database is empty', async () => {
        mockFs.existsSync.mockReturnValue(false);
        const result = await server.checkMemoryBankStatus();
        expect(JSON.parse(result.content[0].text)).toEqual({ exists: false, files: [] });
    });

    it('should report that the bank is initialized and list documents', async () => {
        const mockDocs = ["productContext.md", "activeContext.md"];
        mockFs.existsSync.mockReturnValue(true);
        mockDb.listDocuments.mockReturnValue(mockDocs);
        const result = await server.checkMemoryBankStatus();
        expect(JSON.parse(result.content[0].text)).toEqual({ exists: true, files: mockDocs });
    });
  });

  describe('readMemoryBankFile', () => {
    it('should return file content when the file exists', async () => {
      const fileName = "productContext.md";
      const content = "## Product Context";
      mockDb.getDocumentContent.mockReturnValue(content);
      const result = await server.readMemoryBankFile({ file_name: fileName });
      expect(mockDb.getDocumentContent).toHaveBeenCalledWith(fileName);
      expect(JSON.parse(result.content[0].text)).toEqual({ content });
    });

    it('should handle non-existent files gracefully', async () => {
      const fileName = "nonexistent.md";
      mockDb.getDocumentContent.mockReturnValue(null);
      const result = await server.readMemoryBankFile({ file_name: fileName });
      expect(JSON.parse(result.content[0].text).status).toBe("error");
      expect(JSON.parse(result.content[0].text).message).toContain("Document not found");
    });

    it('should validate missing file_name input', async () => {
      const result = await server.readMemoryBankFile({});
      expect(result.isError).toBe(true);
      expect(JSON.parse(result.content[0].text).message).toBe("Missing or invalid 'file_name' parameter.");
    });
  });

  describe('appendMemoryBankEntry', () => {
    it('should call appendEntry with correct parameters', async () => {
      const input = {
        file_name: "decisionLog.md",
        entry: "New decision made.",
        section_header: "## Decisions"
      };
      await server.appendMemoryBankEntry(input);
      expect(mockDb.appendEntry).toHaveBeenCalledWith(input.file_name, input.section_header, input.entry);
    });

    it('should use a default header if none is provided', async () => {
        const input = {
          file_name: "decisionLog.md",
          entry: "New decision made.",
        };
        await server.appendMemoryBankEntry(input);
        expect(mockDb.appendEntry).toHaveBeenCalledWith(input.file_name, '## General', input.entry);
      });

    it('should validate missing file_name input', async () => {
      const result = await server.appendMemoryBankEntry({ entry: "test" });
      expect(result.isError).toBe(true);
      expect(JSON.parse(result.content[0].text).message).toBe("Missing or invalid 'file_name' parameter.");
    });

    it('should validate missing entry input', async () => {
      const result = await server.appendMemoryBankEntry({ file_name: "test.md" });
      expect(result.isError).toBe(true);
      expect(JSON.parse(result.content[0].text).message).toBe("Missing or invalid 'entry' parameter.");
    });
  });
});