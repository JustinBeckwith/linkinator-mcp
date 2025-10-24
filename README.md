# Linkinator MCP Server

[![npm version](https://img.shields.io/npm/v/linkinator-mcp.svg)](https://www.npmjs.com/package/linkinator-mcp)
[![CI](https://github.com/JustinBeckwith/linkinator-mcp/actions/workflows/ci.yaml/badge.svg)](https://github.com/JustinBeckwith/linkinator-mcp/actions/workflows/ci.yaml)
[![Biome](https://img.shields.io/badge/code%20style-biome-60a5fa?style=flat&logo=biome)](https://biomejs.dev/)
[![codecov](https://codecov.io/gh/JustinBeckwith/linkinator-mcp/branch/main/graph/badge.svg)](https://codecov.io/gh/JustinBeckwith/linkinator-mcp)

![linkinator-mcp](https://raw.githubusercontent.com/JustinBeckwith/linkinator-mcp/main/site/linkinator-mcp.webp)

A Model Context Protocol (MCP) server that provides link checking capabilities using [linkinator](https://github.com/JustinBeckwith/linkinator). This allows AI assistants like Claude to scan webpages and local files for broken links.

## Features

- **Comprehensive Link Checking**: Scan websites and local files for broken links
- **Recursive Crawling**: Follow links within the same domain
- **Multiple Content Types**: Check links in HTML, CSS, and Markdown files
- **Fragment Validation**: Verify anchor links and URL fragments
- **Flexible Configuration**: Extensive options for timeouts, retries, SSL, and more
- **Detailed Reporting**: Get status codes, broken links grouped by error type, and parent page information

## Quick Setup (Automatic)

The easiest way to get started is using the `install-mcp` tool, which automatically configures linkinator-mcp for Claude Desktop, Claude Code, Cursor, Cline, and other MCP clients:

```bash
npx install-mcp linkinator-mcp --client claude
```

This handles all configuration automatically. Restart your Claude client after installation.

## Manual Configuration

If you prefer to configure the server manually, you can edit your MCP client's configuration file directly.

### Claude Code

#### macOS/Linux

Edit `~/.config/claude-code/config.json`:

```json
{
  "mcpServers": {
    "linkinator": {
      "command": "npx",
      "args": ["linkinator-mcp"]
    }
  }
}
```

#### Windows

Edit `%APPDATA%\claude-code\config.json`:

```json
{
  "mcpServers": {
    "linkinator": {
      "command": "npx",
      "args": ["linkinator-mcp"]
    }
  }
}
```

#### Alternative: Global Installation

If you prefer to install the package globally first with `npm install -g linkinator-mcp`, you can simplify the configuration:

```json
{
  "mcpServers": {
    "linkinator": {
      "command": "linkinator-mcp"
    }
  }
}
```

### Claude Desktop

#### macOS/Linux

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "linkinator": {
      "command": "npx",
      "args": ["linkinator-mcp"]
    }
  }
}
```

#### Windows

Edit `%APPDATA%\Claude\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "linkinator": {
      "command": "npx",
      "args": ["linkinator-mcp"]
    }
  }
}
```

### Restart Your Client

After updating the configuration, restart your Claude client for the changes to take effect.

## Usage Examples

Once configured, you can ask Claude to check links on any webpage or local file. Here are some example prompts:

### Basic Link Checking

```text
Check all the links on https://example.com
```

### Recursive Scanning

```text
Scan https://example.com recursively and check all links on the same domain
```

### Local File Checking

```text
Check the links in /path/to/my/documentation/index.html
```

### Advanced Options

```text
Check https://example.com with the following options:
- Recurse through all pages
- Check CSS for URLs
- Validate anchor fragments
- Skip links to google.com and facebook.com
- Use a 10 second timeout
```

## Available Options

The `scan_page` tool supports all of linkinator's CLI options:

### Required

- **path** (string): URL or local file path to scan

### Connection Settings

- **concurrency** (number): Number of simultaneous connections (default: 100)
- **port** (number): Server port for local scanning (random port by default)
- **timeout** (number): Request timeout in milliseconds (0 = no timeout)

### Crawling Behavior

- **recurse** (boolean): Follow links recursively on the same domain
- **serverRoot** (string): Custom disk location where the server starts
- **directoryListing** (boolean): Auto-serve directory index files
- **cleanUrls** (boolean): Enable extensionless link resolution (e.g., /about → /about.html)

### Content Parsing

- **markdown** (boolean): Parse and scan markdown files
- **checkCss** (boolean): Extract and validate URLs in CSS properties
- **checkFragments** (boolean): Validate URL anchor identifiers

### Filtering & Customization

- **linksToSkip** (string[]): URL patterns to exclude (regex strings)
- **userAgent** (string): Custom user agent header

### Retry Logic

- **retry** (boolean): Retry HTTP 429 responses with retry-after header
- **retryErrors** (boolean): Retry 5xx errors
- **retryErrorsCount** (number): Retry attempt limit
- **retryErrorsJitter** (number): Random delay between retries in milliseconds

### SSL & Security

- **allowInsecureCerts** (boolean): Accept invalid SSL certificates

## Output Format

The tool returns a formatted report showing:

```text
Linkinator Scan Results for: https://example.com

Summary:
  Status: ✓ PASSED / ✗ FAILED
  Total Links: 150
  OK: 145
  Broken: 5
  Skipped: 0

Broken Links:

  Status 404:
    - https://example.com/missing-page
      Found on: https://example.com/index.html
    - https://example.com/old-blog-post
      Found on: https://example.com/blog.html

  Status 500:
    - https://api.example.com/endpoint
      Found on: https://example.com/docs.html
```

## Troubleshooting

### Server Not Appearing in Claude Code

1. Check that the path in `config.json` is absolute, not relative
2. Verify the build directory exists: `ls /path/to/linkinator-mcp/build/index.js`
3. Check Claude Code logs for errors
4. Ensure Node.js is in your PATH

### Permission Errors

If you get permission errors on macOS/Linux:

```bash
chmod +x /path/to/linkinator-mcp/build/index.js
```

### Port Already in Use

If scanning local files and getting port errors, try specifying a port:

```text
Check /path/to/files with port 9000
```

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to get started.

## License

MIT

## Related Projects

- [linkinator](https://github.com/JustinBeckwith/linkinator) - The underlying link checking library
- [MCP Servers](https://github.com/modelcontextprotocol/servers) - Collection of MCP server implementations
- [Claude Code](https://claude.ai/claude-code) - AI coding assistant that uses MCP

## Author

Justin Beckwith <justin.beckwith@gmail.com>

## Acknowledgments

Built with the [Model Context Protocol](https://modelcontextprotocol.io/) SDK.
