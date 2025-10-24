import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';
import type {
	ServerNotification,
	ServerRequest,
} from '@modelcontextprotocol/sdk/types.js';
import { LinkState } from 'linkinator';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import {
	buildCheckOptions,
	formatScanResults,
	type ScanParams,
	type ScanResult,
	scanPage,
} from '../src/scanner.js';

// Type for mocked linkinator module
interface MockedLinkinator {
	LinkChecker: Mock;
	LinkState: {
		OK: string;
		BROKEN: string;
		SKIPPED: string;
	};
}

// Mock linkinator module
vi.mock('linkinator', (): MockedLinkinator => {
	const mockCheck = vi.fn();
	return {
		// biome-ignore lint/complexity/useArrowFunction: vitest mock constructor requires function
		LinkChecker: vi.fn(function () {
			return {
				check: mockCheck,
				on: vi.fn(), // Mock event emitter
			};
		}),
		LinkState: {
			OK: 'OK',
			BROKEN: 'BROKEN',
			SKIPPED: 'SKIPPED',
		},
	};
});

describe('buildCheckOptions', () => {
	it('should build basic options with only path', () => {
		const params: ScanParams = {
			path: 'https://example.com',
		};

		const options = buildCheckOptions(params);

		expect(options).toEqual({
			path: 'https://example.com',
		});
	});

	it('should include all optional parameters when provided', () => {
		const params: ScanParams = {
			path: 'https://example.com',
			concurrency: 50,
			port: 8080,
			timeout: 5000,
			recurse: true,
			markdown: true,
			checkCss: true,
			checkFragments: true,
			linksToSkip: ['google.com', 'facebook.com'],
			userAgent: 'Custom Agent',
			retry: true,
			retryErrors: true,
			retryErrorsCount: 3,
			retryErrorsJitter: 100,
			allowInsecureCerts: true,
		};

		const options = buildCheckOptions(params);

		expect(options).toEqual({
			path: 'https://example.com',
			concurrency: 50,
			port: 8080,
			timeout: 5000,
			recurse: true,
			markdown: true,
			checkCss: true,
			checkFragments: true,
			linksToSkip: ['google.com', 'facebook.com'],
			userAgent: 'Custom Agent',
			retry: true,
			retryErrors: true,
			retryErrorsCount: 3,
			retryErrorsJitter: 100,
			allowInsecureCerts: true,
		});
	});

	it('should not include linksToSkip if empty array', () => {
		const params: ScanParams = {
			path: 'https://example.com',
			linksToSkip: [],
		};

		const options = buildCheckOptions(params);

		expect(options).toEqual({
			path: 'https://example.com',
		});
	});
});

describe('formatScanResults', () => {
	it('should format results with all links passing', () => {
		const result: ScanResult = {
			passed: true,
			links: [
				{
					url: 'https://example.com/page1',
					status: 200,
					state: LinkState.OK,
				},
				{
					url: 'https://example.com/page2',
					status: 200,
					state: LinkState.OK,
				},
			],
		};

		const params: ScanParams = {
			path: 'https://example.com',
		};

		const output = formatScanResults(result, params);

		expect(output).toContain('Scan complete: https://example.com');
		expect(output).toContain('Status: PASSED');
		expect(output).toContain('checked 2 links');
		expect(output).toContain('OK: 2');
		expect(output).toContain('Broken: 0');
		expect(output).not.toContain('Broken links:');
	});

	it('should format results with broken links', () => {
		const result: ScanResult = {
			passed: false,
			links: [
				{
					url: 'https://example.com/page1',
					status: 200,
					state: LinkState.OK,
				},
				{
					url: 'https://example.com/broken',
					status: 404,
					state: LinkState.BROKEN,
					parent: 'https://example.com/page1',
				},
				{
					url: 'https://example.com/server-error',
					status: 500,
					state: LinkState.BROKEN,
					parent: 'https://example.com/page1',
				},
			],
		};

		const params: ScanParams = {
			path: 'https://example.com',
		};

		const output = formatScanResults(result, params);

		expect(output).toContain('Status: FAILED');
		expect(output).toContain('checked 3 links');
		expect(output).toContain('OK: 1');
		expect(output).toContain('Broken: 2');
		expect(output).toContain('Broken links:');
		expect(output).toContain('[404] https://example.com/broken');
		expect(output).toContain('[500] https://example.com/server-error');
		expect(output).toContain('found on https://example.com/page1');
	});

	it('should format results with skipped links', () => {
		const result: ScanResult = {
			passed: true,
			links: [
				{
					url: 'https://example.com/page1',
					status: 200,
					state: LinkState.OK,
				},
				{
					url: 'https://google.com',
					state: LinkState.SKIPPED,
				},
			],
		};

		const params: ScanParams = {
			path: 'https://example.com',
		};

		const output = formatScanResults(result, params);

		expect(output).toContain('OK: 1');
		expect(output).toContain('Skipped: 1');
	});

	it('should handle broken links without status code', () => {
		const result: ScanResult = {
			passed: false,
			links: [
				{
					url: 'https://example.com/broken',
					state: LinkState.BROKEN,
				},
			],
		};

		const params: ScanParams = {
			path: 'https://example.com',
		};

		const output = formatScanResults(result, params);

		expect(output).toContain('[???]');
		expect(output).toContain('https://example.com/broken');
	});

	it('should count unique pages scanned', () => {
		const result: ScanResult = {
			passed: true,
			links: [
				{
					url: 'https://example.com/page1',
					status: 200,
					state: LinkState.OK,
					parent: 'https://example.com',
				},
				{
					url: 'https://example.com/page2',
					status: 200,
					state: LinkState.OK,
					parent: 'https://example.com/page1',
				},
			],
		};

		const params: ScanParams = {
			path: 'https://example.com',
			recurse: true,
		};

		const output = formatScanResults(result, params);

		expect(output).toContain('Scanned 2 pages');
	});
});

describe('scanPage', () => {
	let mockCheckFn: Mock;

	beforeEach(async () => {
		vi.clearAllMocks();
		const { LinkChecker } = await import('linkinator');
		// Get the mock function from the mocked LinkChecker instance
		mockCheckFn = vi.fn();
		// biome-ignore lint/complexity/useArrowFunction: vitest mock constructor requires function
		(LinkChecker as unknown as Mock).mockImplementation(function () {
			return {
				check: mockCheckFn,
				on: vi.fn(), // Mock event emitter
			};
		});
	});

	it('should scan a page successfully', async () => {
		mockCheckFn.mockResolvedValue({
			passed: true,
			links: [
				{
					url: 'https://example.com/page1',
					status: 200,
					state: LinkState.OK,
				},
			],
		});

		const params: ScanParams = {
			path: 'https://example.com',
		};

		const result = await scanPage(params);

		expect(result.content).toHaveLength(1);
		expect(result.content[0]?.type).toBe('text');
		expect(result.content[0]?.text).toContain('PASSED');
		expect(result.content[0]?.text).toContain('checked 1 links');
		expect(mockCheckFn).toHaveBeenCalledWith({
			path: 'https://example.com',
		});
	});

	it('should pass all options to linkinator', async () => {
		mockCheckFn.mockResolvedValue({
			passed: true,
			links: [],
		});

		const params: ScanParams = {
			path: 'https://example.com',
			concurrency: 50,
			recurse: true,
			linksToSkip: ['google.com'],
		};

		await scanPage(params);

		expect(mockCheckFn).toHaveBeenCalledWith({
			path: 'https://example.com',
			concurrency: 50,
			recurse: true,
			linksToSkip: ['google.com'],
		});
	});

	it('should handle errors gracefully', async () => {
		mockCheckFn.mockRejectedValue(new Error('Network error'));

		const params: ScanParams = {
			path: 'https://example.com',
		};

		const result = await scanPage(params);

		expect(result.content).toHaveLength(1);
		expect(result.content[0]?.type).toBe('text');
		expect(result.content[0]?.text).toContain(
			'Error scanning links: Network error',
		);
	});

	it('should handle non-Error exceptions', async () => {
		mockCheckFn.mockRejectedValue('Something went wrong');

		const params: ScanParams = {
			path: 'https://example.com',
		};

		const result = await scanPage(params);

		expect(result.content).toHaveLength(1);
		expect(result.content[0]?.type).toBe('text');
		expect(result.content[0]?.text).toContain(
			'Error scanning links: Something went wrong',
		);
	});

	it('should send progress notifications when progressToken is provided', async () => {
		const sendNotification = vi.fn().mockResolvedValue(undefined);

		const pageStartListeners: Array<(url: string) => void> = [];
		const linkListeners: Array<
			(result: { url: string; status: number; state: string }) => void
		> = [];

		const { LinkChecker } = await import('linkinator');
		// biome-ignore lint/complexity/useArrowFunction: vitest mock constructor requires function
		(LinkChecker as unknown as Mock).mockImplementation(function () {
			return {
				// biome-ignore lint/complexity/useArrowFunction: needs to capture listeners
				on: function (event: string, listener: unknown) {
					if (event === 'pagestart') {
						pageStartListeners.push(listener as (url: string) => void);
					} else if (event === 'link') {
						linkListeners.push(
							listener as (result: {
								url: string;
								status: number;
								state: string;
							}) => void,
						);
					}
				},
				check: async () => {
					// Simulate events
					for (const listener of pageStartListeners) {
						listener('https://example.com/page1');
					}

					for (let i = 0; i < 25; i++) {
						for (const listener of linkListeners) {
							listener({
								url: `https://example.com/link${i}`,
								status: 200,
								state: LinkState.OK,
							});
						}
					}

					return {
						passed: true,
						links: [],
					};
				},
			};
		});

		const params: ScanParams = {
			path: 'https://example.com',
		};

		const extra = {
			_meta: {
				progressToken: 'test-token-123',
			},
			sendNotification,
			signal: new AbortController().signal,
			requestId: 'test-request',
		};

		await scanPage(
			params,
			extra as unknown as RequestHandlerExtra<
				ServerRequest,
				ServerNotification
			>,
		);

		// Should have sent notifications for pagestart and progress updates
		expect(sendNotification).toHaveBeenCalled();

		// Check that notifications include the progress token
		const calls = sendNotification.mock.calls;
		for (const call of calls) {
			const notification = call[0] as {
				method: string;
				params: { progressToken: string };
			};
			expect(notification.method).toBe('notifications/progress');
			expect(notification.params.progressToken).toBe('test-token-123');
		}
	});
});
