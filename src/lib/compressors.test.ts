import { gzip, ungzip, brotli, unbrotli } from './compressors.js';

describe('Compression Module', () => {
	const testString = 'The quick brown fox jumps over the lazy dog';
	const testData = Buffer.from(testString);

	// Test gzip compression and decompression
	test('gzip and ungzip functions', async () => {
		const gzipped = await gzip(testData);
		expect(gzipped).toBeInstanceOf(Buffer);

		const gunzipped = await ungzip(gzipped);
		expect(gunzipped).toBeInstanceOf(Buffer);
		expect(gunzipped.toString()).toEqual(testString);
	});

	// Test brotli compression and decompression
	test('brotli and unbrotli functions', async () => {
		const brotlified = await brotli(testData);
		expect(brotlified).toBeInstanceOf(Buffer);

		const unbrotlified = await unbrotli(brotlified);
		expect(unbrotlified).toBeInstanceOf(Buffer);
		expect(unbrotlified.toString()).toEqual(testString);
	});
});
