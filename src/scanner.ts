import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';
import type {
	ServerNotification,
	ServerRequest,
} from '@modelcontextprotocol/sdk/types.js';
import {
	type CheckOptions,
	LinkChecker,
	type LinkResult,
	LinkState,
} from 'linkinator';

export interface ScanParams {
	path: string;
	concurrency?: number;
	port?: number;
	timeout?: number;
	recurse?: boolean;
	serverRoot?: string;
	directoryListing?: boolean;
	cleanUrls?: boolean;
	markdown?: boolean;
	checkCss?: boolean;
	checkFragments?: boolean;
	linksToSkip?: string[];
	userAgent?: string;
	retry?: boolean;
	retryErrors?: boolean;
	retryErrorsCount?: number;
	retryErrorsJitter?: number;
	allowInsecureCerts?: boolean;
}

export interface ScanResult {
	passed: boolean;
	links: LinkResult[];
}

export interface FormattedScanResult {
	content: Array<{
		type: 'text';
		text: string;
	}>;
	[key: string]: unknown;
}

/**
 * Build CheckOptions from ScanParams
 */
export function buildCheckOptions(params: ScanParams): CheckOptions {
	const options: CheckOptions = {
		path: params.path,
	};

	// Add optional parameters if provided
	if (params.concurrency !== undefined)
		options.concurrency = params.concurrency;
	if (params.port !== undefined) options.port = params.port;
	if (params.timeout !== undefined) options.timeout = params.timeout;
	if (params.recurse !== undefined) options.recurse = params.recurse;
	if (params.serverRoot !== undefined) options.serverRoot = params.serverRoot;
	if (params.directoryListing !== undefined)
		options.directoryListing = params.directoryListing;
	if (params.cleanUrls !== undefined) options.cleanUrls = params.cleanUrls;
	if (params.markdown !== undefined) options.markdown = params.markdown;
	if (params.checkCss !== undefined) options.checkCss = params.checkCss;
	if (params.checkFragments !== undefined)
		options.checkFragments = params.checkFragments;
	if (params.userAgent !== undefined) options.userAgent = params.userAgent;
	if (params.retry !== undefined) options.retry = params.retry;
	if (params.retryErrors !== undefined)
		options.retryErrors = params.retryErrors;
	if (params.retryErrorsCount !== undefined)
		options.retryErrorsCount = params.retryErrorsCount;
	if (params.retryErrorsJitter !== undefined)
		options.retryErrorsJitter = params.retryErrorsJitter;
	if (params.allowInsecureCerts !== undefined)
		options.allowInsecureCerts = params.allowInsecureCerts;

	// Pass linksToSkip as-is (linkinator accepts string patterns)
	if (params.linksToSkip && params.linksToSkip.length > 0) {
		options.linksToSkip = params.linksToSkip;
	}

	return options;
}

/**
 * Format scan results into a simple text output
 */
export function formatScanResults(
	result: ScanResult,
	params: ScanParams,
): string {
	const summary = {
		passed: result.passed,
		totalLinks: result.links.length,
		okLinks: result.links.filter((l) => l.state === LinkState.OK).length,
		brokenLinks: result.links.filter((l) => l.state === LinkState.BROKEN)
			.length,
		skippedLinks: result.links.filter((l) => l.state === LinkState.SKIPPED)
			.length,
	};

	const uniqueParents = new Set<string>();
	for (const link of result.links) {
		if (link.parent) {
			uniqueParents.add(link.parent);
		}
	}

	const brokenLinks = result.links.filter((l) => l.state === LinkState.BROKEN);

	let output = `Scan complete: ${params.path}\n`;
	output += `Status: ${result.passed ? 'PASSED' : 'FAILED'}\n`;
	output += `Scanned ${uniqueParents.size} pages, checked ${summary.totalLinks} links\n`;
	output += `OK: ${summary.okLinks} | Broken: ${summary.brokenLinks} | Skipped: ${summary.skippedLinks}\n`;

	if (brokenLinks.length > 0) {
		const MAX_BROKEN_LINKS = 100;
		const linksToShow = brokenLinks.slice(0, MAX_BROKEN_LINKS);

		output += `\nBroken links:\n`;
		for (const link of linksToShow) {
			output += `[${link.status || '???'}] ${link.url}`;
			if (link.parent) {
				output += ` (found on ${link.parent})`;
			}
			output += `\n`;
		}

		if (brokenLinks.length > MAX_BROKEN_LINKS) {
			output += `\n... and ${brokenLinks.length - MAX_BROKEN_LINKS} more\n`;
		}
	}

	return output;
}

/**
 * Scan a page for broken links
 */
export async function scanPage(
	params: ScanParams,
	extra?: RequestHandlerExtra<ServerRequest, ServerNotification>,
): Promise<FormattedScanResult> {
	try {
		const checker = new LinkChecker();
		const options = buildCheckOptions(params);

		// Check if client requested progress notifications
		const progressToken = extra?._meta?.progressToken;

		// Log to stderr for debugging
		if (progressToken) {
			process.stderr.write(
				`Progress token provided: ${progressToken}, will send notifications\n`,
			);
		} else {
			process.stderr.write(
				'No progress token provided, using stderr for progress\n',
			);
		}

		// Track progress regardless of whether notifications are requested
		let linksChecked = 0;
		const pagesScanned = new Set<string>();
		let brokenCount = 0;

		// Listen to pagestart events
		checker.on('pagestart', (url: string) => {
			pagesScanned.add(url);
			const message = `📄 Page ${pagesScanned.size}: ${url}`;

			// Send to stderr for visibility
			process.stderr.write(`${message}\n`);

			// Also send MCP notification if token provided
			if (progressToken && extra) {
				extra
					.sendNotification({
						method: 'notifications/progress',
						params: {
							progressToken,
							progress: linksChecked,
							message,
						},
					})
					.catch(() => {
						// Ignore notification errors
					});
			}
		});

		// Listen to link events for progress
		checker.on('link', (result: LinkResult) => {
			linksChecked++;
			if (result.state === LinkState.BROKEN) {
				brokenCount++;
			}

			// Report progress every 10 links
			if (linksChecked % 10 === 0) {
				const message = `⏳ ${linksChecked} links | ${pagesScanned.size} pages | ${brokenCount} broken`;

				// Send to stderr for visibility
				process.stderr.write(`${message}\n`);

				// Also send MCP notification if token provided
				if (progressToken && extra) {
					extra
						.sendNotification({
							method: 'notifications/progress',
							params: {
								progressToken,
								progress: linksChecked,
								message,
							},
						})
						.catch(() => {
							// Ignore notification errors
						});
				}
			}
		});

		const result = await checker.check(options);
		const output = formatScanResults(result, params);

		return {
			content: [
				{
					type: 'text',
					text: output,
				},
			],
		};
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		return {
			content: [
				{
					type: 'text',
					text: `Error scanning links: ${errorMessage}`,
				},
			],
		};
	}
}
