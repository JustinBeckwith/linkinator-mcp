import { describe, expect, it, vi } from 'vitest';

// Mock the MCP SDK to prevent actual server startup
vi.mock('@modelcontextprotocol/sdk/server/mcp.js', () => ({
	McpServer: vi.fn().mockImplementation(function (config) {
		return {
			name: config.name,
			version: config.version,
			tool: vi.fn(),
			connect: vi.fn().mockResolvedValue(undefined),
		};
	}),
}));

vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
	StdioServerTransport: vi.fn(),
}));

describe('index module', () => {
	it('should export the scanPage function', async () => {
		// Import scanner module to verify it's properly set up
		const { scanPage } = await import('../src/scanner.js');
		expect(scanPage).toBeDefined();
		expect(typeof scanPage).toBe('function');
	});

	it('should have valid package.json configuration', async () => {
		// This ensures the MCP server entry point is correctly configured
		const pkg = await import('../package.json', { assert: { type: 'json' } });
		expect(pkg.default.bin['linkinator-mcp']).toBe('build/index.js');
		expect(pkg.default.name).toBe('linkinator-mcp');
		expect(pkg.default.mcpName).toBe('io.github.JustinBeckwith/linkinator-mcp');
	});
});
