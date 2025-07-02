# Roo Code Memory Bank MCP Server

This project implements the core functionality of the [Roo Code Memory Bank](https://github.com/GreatScottyMac/roo-code-memory-bank) system as a Model Context Protocol (MCP) server. It allows AI assistants to maintain project context across sessions by interacting with a **SQLite database** using structured MCP tools. All database operations are encapsulated within the `src/database.ts` module.

## Storage Architecture

The server uses a SQLite database (`db/memory-bank.db`) to store all project context. This provides a more robust and scalable solution compared to the previous file-based system.

### Database Schema

The database consists of three main tables:

*   **`documents`**: Stores the main context files (e.g., `productContext.md`).
    ```sql
    CREATE TABLE documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    ```
*   **`sections`**: Represents markdown headers within a document, allowing entries to be organized.
    ```sql
    CREATE TABLE sections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        document_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (document_id) REFERENCES documents(id)
    );
    ```
*   **`entries`**: Stores the individual, timestamped pieces of content.
    ```sql
    CREATE TABLE entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        section_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (section_id) REFERENCES sections(id)
    );
    ```

## Features

This MCP server provides the following tools:

*   **`initialize_memory_bank`**: Creates the initial database schema and pre-populates it with standard documents (`productContext.md`, `activeContext.md`, etc.).
    *   *Input*: (Optional) `{ "project_brief_content": string }`
    *   *Output*: `{ "status": "success" | "error", "messages"?: string[], "message"?: string }`
*   **`check_memory_bank_status`**: Checks if the `db/memory-bank.db` file exists and lists the documents within it.
    *   *Input*: `{}`
    *   *Output*: `{ "exists": boolean, "files": string[] }`
*   **`read_memory_bank_file`**: Reads the full, aggregated content of a specified document from the database.
    *   *Input*: `{ "file_name": string }`
    *   *Output*: `{ "content": string }` or error object.
*   **`append_memory_bank_entry`**: Appends a new, timestamped entry to a specified document, optionally under a specific markdown header.
    *   *Input*: `{ "file_name": string, "entry": string, "section_header"?: string }`
    *   *Output*: `{ "status": "success" | "error", "message": string }`

## Prerequisites

*   Node.js (v18 or later recommended)
*   npm or bun package manager
*   An MCP client environment (like Cline) capable of managing and launching MCP servers.

## Installation

Simply add this MCP server to your client configuration - no installation required! The server will be automatically downloaded and run via npx/bunx.

### Configuration

Add the following to your MCP client settings (e.g., `cline_mcp_settings.json`):

#### Using npx (recommended for npm users)
```json
{
  "mcpServers": {
    "roo-memorybank-mcp": {
      "command": "npx",
      "args": ["roo-memorybank-mcp"],
      "env": {},
      "transportType": "stdio",
      "autoApprove": [
        "initialize_memory_bank",
        "check_memory_bank_status",
        "read_memory_bank_file",
        "append_memory_bank_entry"
      ],
      "disabled": false,
      "timeout": 60
    }
  }
}
```

#### Using bunx (recommended for bun users)
```json
{
  "mcpServers": {
    "roo-memorybank-mcp": {
      "command": "bunx",
      "args": ["roo-memorybank-mcp"],
      "env": {},
      "transportType": "stdio",
      "autoApprove": [
        "initialize_memory_bank",
        "check_memory_bank_status",
        "read_memory_bank_file",
        "append_memory_bank_entry"
      ],
      "disabled": false,
      "timeout": 60
    }
  }
}
```

### Alternative: Global Installation

If you prefer to install globally first:

```bash
npm install -g roo-mcp-server
```

Then use this simpler configuration:
```json
{
  "mcpServers": {
    "roo-memorybank-mcp": {
      "command": "roo-memorybank-mcp",
      "args": [],
      "env": {},
      "transportType": "stdio",
      "autoApprove": [
        "initialize_memory_bank",
        "check_memory_bank_status",
        "read_memory_bank_file",
        "append_memory_bank_entry"
      ],
      "disabled": false,
      "timeout": 60
    }
  }
}
```

## Running the Server

You don't need to run the server manually. The MCP client (like Cline) will automatically start the server using npx/bunx when one of its tools is called for the first time. The package will be downloaded automatically on first use.

## Usage

The AI assistant interacts with the server using the defined tools. The typical workflow involves:

1.  Checking the memory bank status (`check_memory_bank_status`).
2.  Initializing if needed (`initialize_memory_bank`).
3.  Reading relevant documents (`read_memory_bank_file`) to gain context.
4.  Appending entries (`append_memory_bank_entry`) as decisions are made or progress occurs.

The `db/` directory containing the `memory-bank.db` file will be created in the current working directory where the server process is started.

## Development and Deployment

### For Contributors

This project uses automated CI/CD for releases. See our documentation:

- [📖 Deployment Guide](./docs/deployment-guide.md) - Complete setup instructions for automated deployments
- [🚀 Release Workflow](./docs/release-workflow.md) - Step-by-step release process documentation

### Quick Development Setup

```bash
# Clone and setup
git clone https://github.com/IncomeStreamSurfer/roo-memorybank-mcp-server.git
cd roo-memorybank-mcp-server
npm install

# Development commands
npm run build      # Build the project
npm run watch      # Watch for changes and rebuild
npm run clean      # Clean build artifacts
npm test          # Run tests (add tests for better CI/CD)
npm run lint      # Run linting (configure ESLint for better quality)
```

### Automated Releases

This project automatically publishes to NPM and creates GitHub releases when you push a git tag:

```bash
# Create and push a new release
git tag v1.0.1
git push origin v1.0.1
```

The automation handles:
- ✅ Running tests and builds
- ✅ Creating GitHub releases with changelog
- ✅ Publishing to NPM registry
- ✅ Uploading build artifacts

## Custom Instructions

Set these instructions inside Roo

You must use MCPs where needed

I have a specific MCP flow:

Use context7 to find any relevant documentation pieces you will need for this process, ensure to feed any relevant knoweldege to any relevant subtasks - use context7 at all times to do research on important documentation if you're unsure of something
Use google maps mcp in order to search for <niche> + <county> - this will allow us to find the basic businesses we need to accomplish our task
Use brave search mcp to find URLs to scrape
Use fetch mcp with fetch_txt and fetch_markdown to find text and images on pages in order to convert into JSON files and create something in-depth
Use openrouter search to find general sentiment of topics, reviews, etc.

**Utilize the `roo-memorybank-mcp` server to maintain project context:**
*   At the start of a task or significant subtask, use `check_memory_bank_status`.
*   If the memory bank exists (`exists: true`), use `read_memory_bank_file` for relevant files (e.g., `productContext.md`, `activeContext.md`) to load the current project context.
*   Incorporate this loaded context into your planning and execution.
*   When making significant decisions, progress updates, or architectural changes, use `append_memory_bank_entry` to record the information in the appropriate file (`decisionLog.md`, `progress.md`, etc.), ensuring context persistence.
*   If the memory bank doesn't exist, consider using `initialize_memory_bank` if appropriate for the project.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the Apache-2.0 License - see the [LICENSE](LICENSE) file for details.

## Support

- 📖 [Documentation](./docs/)
- 🐛 [Report Bug](https://github.com/IncomeStreamSurfer/roo-memorybank-mcp-server/issues)
- 💡 [Request Feature](https://github.com/IncomeStreamSurfer/roo-memorybank-mcp-server/issues)
- 📦 [NPM Package](https://www.npmjs.com/package/roo-memorybank-mcp)