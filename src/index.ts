#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { scanPage } from './scanner.js';

// Create server instance
const server = new McpServer({
	name: 'linkinator',
	version: '1.0.0',
	capabilities: {
		resources: {},
		tools: {},
	},
});

// Zod schema for linkinator options
const scanPageSchema = {
	path: z.string().describe('URL or local file path to scan'),

	// Connection settings
	concurrency: z
		.number()
		.optional()
		.describe('Number of simultaneous connections (default: 100)'),
	port: z
		.number()
		.optional()
		.describe('Server port for local scanning (random port by default)'),
	timeout: z
		.number()
		.optional()
		.describe('Request timeout in milliseconds (0 = no timeout)'),

	// Crawling behavior
	recurse: z
		.boolean()
		.optional()
		.describe('Follow links recursively on the same domain'),
	serverRoot: z
		.string()
		.optional()
		.describe('Custom disk location where the server starts'),
	directoryListing: z
		.boolean()
		.optional()
		.describe('Auto-serve directory index files'),
	cleanUrls: z
		.boolean()
		.optional()
		.describe(
			'Enable extensionless link resolution (e.g., /about → /about.html)',
		),

	// Content parsing
	markdown: z.boolean().optional().describe('Parse and scan markdown files'),
	checkCss: z
		.boolean()
		.optional()
		.describe('Extract and validate URLs in CSS properties'),
	checkFragments: z
		.boolean()
		.optional()
		.describe('Validate URL anchor identifiers'),

	// Filtering & customization
	linksToSkip: z
		.array(z.string())
		.optional()
		.describe('URL patterns to exclude (regex strings)'),
	userAgent: z.string().optional().describe('Custom user agent header'),

	// Retry logic
	retry: z
		.boolean()
		.optional()
		.describe('Retry HTTP 429 responses with retry-after header'),
	retryErrors: z.boolean().optional().describe('Retry 5xx errors'),
	retryErrorsCount: z.number().optional().describe('Retry attempt limit'),
	retryErrorsJitter: z
		.number()
		.optional()
		.describe('Random delay between retries in milliseconds'),

	// Link validation
	allowInsecureCerts: z
		.boolean()
		.optional()
		.describe('Accept invalid SSL certificates'),
};

server.tool(
	'scan_page',
	'Scan links in a webpage or local file path using linkinator. Checks for broken links, validates anchors, and can crawl recursively. Supports progress notifications for long-running scans.',
	scanPageSchema,
	async (params, extra) => scanPage(params, extra),
);

// Start the server using top-level await
const transport = new StdioServerTransport();
await server.connect(transport);
console.error('Linkinator MCP Server running on stdio');
