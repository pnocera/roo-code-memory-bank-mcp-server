#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import chalk from 'chalk';
import {
    appendEntry,
    createDocument,
    getDocumentContent,
    listDocuments,
} from "./database.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const DB_DIR = path.join(process.cwd(), 'db');
const DB_PATH = path.join(DB_DIR, 'memory-bank.db');

// --- Tool Definitions ---

const INITIALIZE_MEMORY_BANK_TOOL: Tool = {
  name: "initialize_memory_bank",
  description: "Initializes the SQLite database and schema. No-op if already initialized.",
  inputSchema: {
    type: "object",
    properties: {
        project_brief_content: {
            type: "string",
            description: "(Optional) Content from projectBrief.md to pre-fill productContext.md"
        }
    },
    required: []
  }
};

const CHECK_MEMORY_BANK_STATUS_TOOL: Tool = {
  name: "check_memory_bank_status",
  description: "Checks if the database exists and lists the documents within it.",
  inputSchema: { type: "object", properties: {} }
};

const READ_MEMORY_BANK_FILE_TOOL: Tool = {
  name: "read_memory_bank_file",
  description: "Reads the full content of a specified document from the database.",
  inputSchema: {
    type: "object",
    properties: {
      file_name: {
        type: "string",
        description: "The name of the document (e.g., 'productContext.md')"
      }
    },
    required: ["file_name"]
  }
};

const APPEND_MEMORY_BANK_ENTRY_TOOL: Tool = {
  name: "append_memory_bank_entry",
  description: "Appends a new, timestamped entry to a specified document, optionally under a specific header.",
  inputSchema: {
    type: "object",
    properties: {
      file_name: {
        type: "string",
        description: "The name of the document to append to."
      },
      entry: {
        type: "string",
        description: "The content of the entry to append."
      },
      section_header: {
        type: "string",
        description: "(Optional) The exact markdown header (e.g., '## Decision') to append under."
      }
    },
    required: ["file_name", "entry"]
  }
};

const ALL_TOOLS = [
  INITIALIZE_MEMORY_BANK_TOOL,
  CHECK_MEMORY_BANK_STATUS_TOOL,
  READ_MEMORY_BANK_FILE_TOOL,
  APPEND_MEMORY_BANK_ENTRY_TOOL
];

// --- Server Logic ---

export class RooMemoryBankServer {

  async initializeMemoryBank(input: any): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
    try {
      // The database is initialized when database.ts is imported.
      // We can create the initial documents here.
      const initialDocs = ["productContext.md", "activeContext.md", "progress.md", "decisionLog.md", "systemPatterns.md"];
      let messages: string[] = [];
      for (const doc of initialDocs) {
          try {
            createDocument(doc);
            messages.push(`Created document: ${doc}`);
          } catch (error: any) {
            if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                messages.push(`Document ${doc} already exists.`);
            } else {
                throw error;
            }
          }
      }
      if (input?.project_brief_content) {
        appendEntry("productContext.md", "# Product Context", `Based on project brief:\n\n${input.project_brief_content}`);
        messages.push("Added project brief to productContext.md");
      }
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", messages }, null, 2) }] };
    } catch (error: any) {
      console.error(chalk.red("Error initializing memory bank:"), error);
      return { content: [{ type: "text", text: JSON.stringify({ status: "error", message: error.message }, null, 2) }], isError: true };
    }
  }

  async checkMemoryBankStatus(): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
     try {
        const dbExists = fs.existsSync(DB_PATH);
        if (dbExists) {
            const docs = listDocuments();
            return { content: [{ type: "text", text: JSON.stringify({ exists: true, files: docs }, null, 2) }] };
        } else {
            return { content: [{ type: "text", text: JSON.stringify({ exists: false, files: [] }, null, 2) }] };
        }
     } catch (error: any) {
        return { content: [{ type: "text", text: JSON.stringify({ exists: false, files: [], error: error.message }, null, 2) }] };
     }
  }

  async readMemoryBankFile(input: any): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
    const fileName = input?.file_name;
    if (!fileName || typeof fileName !== 'string') {
      return { content: [{ type: "text", text: JSON.stringify({ status: "error", message: "Missing or invalid 'file_name' parameter." }, null, 2) }], isError: true };
    }
    try {
      const fileContent = getDocumentContent(fileName);
      if (fileContent === null) {
        return { content: [{ type: "text", text: JSON.stringify({ status: "error", message: `Document not found: ${fileName}` }, null, 2) }], isError: true };
      }
      return { content: [{ type: "text", text: JSON.stringify({ content: fileContent }, null, 2) }] };
    } catch (error: any) {
      console.error(chalk.red(`Error reading document ${fileName}:`), error);
      return { content: [{ type: "text", text: JSON.stringify({ status: "error", message: `Failed to read document ${fileName}: ${error.message}` }, null, 2) }], isError: true };
    }
  }

  async appendMemoryBankEntry(input: any): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
     const { file_name: fileName, entry, section_header: sectionHeader } = input;

     if (!fileName || typeof fileName !== 'string') {
       return { content: [{ type: "text", text: JSON.stringify({ status: "error", message: "Missing or invalid 'file_name' parameter." }, null, 2) }], isError: true };
     }
     if (!entry || typeof entry !== 'string') {
       return { content: [{ type: "text", text: JSON.stringify({ status: "error", message: "Missing or invalid 'entry' parameter." }, null, 2) }], isError: true };
     }

     try {
       const header = sectionHeader || '## General';
       appendEntry(fileName, header, entry);
       return { content: [{ type: "text", text: JSON.stringify({ status: "success", message: `Appended entry to ${fileName}` }, null, 2) }] };
     } catch (error: any) {
       console.error(chalk.red(`Error appending to document ${fileName}:`), error);
       return { content: [{ type: "text", text: JSON.stringify({ status: "error", message: `Failed to append to document ${fileName}: ${error.message}` }, null, 2) }], isError: true };
     }
   }
}


// --- Server Setup ---
const server = new Server(
  {
    name: "roo-memorybank-mcp",
    version: "1.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const memoryBankServer = new RooMemoryBankServer();

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: ALL_TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const toolName = request.params.name;
  const args = request.params.arguments;

  console.error(chalk.blue(`Received call for tool: ${toolName}`));

  switch (toolName) {
    case "initialize_memory_bank":
      return memoryBankServer.initializeMemoryBank(args);
    case "check_memory_bank_status":
      return memoryBankServer.checkMemoryBankStatus();
    case "read_memory_bank_file":
      return memoryBankServer.readMemoryBankFile(args);
    case "append_memory_bank_entry":
      return memoryBankServer.appendMemoryBankEntry(args);
    default:
      console.error(chalk.red(`Unknown tool requested: ${toolName}`));
      return {
        content: [{ type: "text", text: JSON.stringify({ status: "error", message: `Unknown tool: ${toolName}` }, null, 2) }],
        isError: true
      };
  }
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(chalk.green("Roo Memory Bank MCP Server running on stdio"));
}

if (import.meta.url.startsWith('file:') && fileURLToPath(import.meta.url) === process.argv[1]) {
    runServer().catch((error) => {
        console.error(chalk.red("Fatal error running server:"), error);
        process.exit(1);
    });
}
