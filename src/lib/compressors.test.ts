import { gzip, ungzip, brotli, unbrotli } from './compressors.js';
import { describe, it, expect } from 'vitest';

describe('Compression Module', () => {
	const testString = 'The quick brown fox jumps over the lazy dog';
	const testData = Buffer.from(testString);

	// Test gzip compression and decompression
	it('gzip and ungzip', async () => {
		const gzipped = await gzip(testData);
		expect(gzipped).toBeInstanceOf(Buffer);

		const gunzipped = await ungzip(gzipped);
		expect(gunzipped).toBeInstanceOf(Buffer);
		expect(gunzipped.toString()).toEqual(testString);
	});

	// Test brotli compression and decompression
	it('brotli and unbrotli', async () => {
		const brotlified = await brotli(testData);
		expect(brotlified).toBeInstanceOf(Buffer);

		const unbrotlified = await unbrotli(brotlified);
		expect(unbrotlified).toBeInstanceOf(Buffer);
		expect(unbrotlified.toString()).toEqual(testString);
	});

	it('throws error on corrupt gzip data', async () => {
		await expect(ungzip(testData)).rejects.toThrow('incorrect header check');
	});

	it('throws error on corrupt brotli data', async () => {
		await expect(unbrotli(testData)).rejects.toThrow('Decompression failed');
	});
});
