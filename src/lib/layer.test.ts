import { Layer } from './layer.js';
import { ServerOptions } from './types.js';
import { describe, it, expect } from 'vitest';


describe('Layer class', () => {
	const filename = new URL('../../testdata/island.versatiles', import.meta.url).pathname;
	const baseUrl = 'http://example.org:1234';
	const serverOptions: ServerOptions = {
		baseUrl,
		glyphs: baseUrl + '/assets/glyphs/{fontstack}/{range}.pbf',
		sprites: [{ id: 'basics', url: baseUrl + '/assets/sprites/basics/sprites' }],
		tilesUrl: baseUrl + '/tiles/test/{z}/{x}/{y}.pbf',
	};

	describe('constructor', () => {
		it('should initialize the Layer instance correctly', () => {
			const layer = new Layer(filename, serverOptions);
			expect(layer).toBeDefined();
		});
	});

	describe('getTileFunction', () => {
		it('should return a function that fetches tiles correctly', async () => {
			const layer = new Layer(filename, serverOptions);
			const tileFunc = await layer.getTileFunction();
			expect(typeof tileFunc).toBe('function');

			const tileResponse = await tileFunc(8, 55, 67);
			expect(tileResponse).toBeDefined();
			expect(tileResponse?.buffer.length).toBe(3548);
			expect(tileResponse?.mime).toBe('application/x-protobuf');
			expect(tileResponse?.compression).toBe('br');
		});

		it('should handle null response for non-existent tiles', async () => {
			const layer = new Layer(filename, serverOptions);
			const tileFunc = await layer.getTileFunction();
			expect(await tileFunc(1, 2, 3)).toBeNull();
		});
	});

	describe('getStyle', () => {
		it('should generate the correct style string', async () => {
			const layer = new Layer(filename, serverOptions);
			const style: unknown = JSON.parse(await layer.getStyle());
			expect(style).toMatchObject({
				glyphs: 'http://example.org:1234/assets/glyphs/{fontstack}/{range}.pbf',
				sprite: [
					{ id: 'basics', url: 'http://example.org:1234/assets/sprites/basics/sprites' },
				]
			});
		});
	});

	describe('getMetadata', () => {
		it('should return the correct metadata', async () => {
			const layer = new Layer(filename, serverOptions);
			const metadata = JSON.parse(await layer.getMetadata() ?? '');
			expect(metadata?.vector_layers?.length).toBe(26);
		});
	});
});
