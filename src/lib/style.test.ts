import { ServerOptions } from './types.js';
import { generateStyle } from './style.js';
import { describe, it, expect } from 'vitest';

describe('generateStyle', () => {
	const validTileJSON = JSON.stringify({
		tilejson: '3.0.0',
		tiles: ['https://example.com/{z}/{x}/{y}.png'],
	});

	function getServerOptions(baseUrl?: string): ServerOptions {
		baseUrl = baseUrl || 'http://localhost:8080';
		return {
			baseUrl,
			glyphs: baseUrl + '/assets/glyphs/{fontstack}/{range}.pbf',
			sprites: [{ id: 'basics', url: baseUrl + '/assets/sprites/basics/sprites' }],
			tilesUrl: baseUrl + '/tiles/test/{z}/{x}/{y}',
		};
	}

	it('should generate a valid style for given metadata and server options', async () => {
		const styleString = await generateStyle(validTileJSON, getServerOptions());
		expect(JSON.parse(styleString)).toEqual({
			version: 8,
			layers: [
				{ id: 'background', type: 'background', paint: { 'background-color': '#000' } },
				{ id: 'raster', source: 'raster', type: 'raster' },
			],
			sources: { raster: { tiles: ['http://localhost:8080/tiles/test/{z}/{x}/{y}'], type: 'raster', tileSize: 256 } },
		});
	});

	it('should use the default base URL if none is provided', async () => {
		const styleString = await generateStyle(validTileJSON, getServerOptions('http://example.org:2345'));
		expect(JSON.parse(styleString)).toEqual({
			version: 8,
			layers: [
				{ id: 'background', type: 'background', paint: { 'background-color': '#000' } },
				{ id: 'raster', source: 'raster', type: 'raster' },
			],
			sources: { raster: { tiles: ['http://example.org:2345/tiles/test/{z}/{x}/{y}'], type: 'raster', tileSize: 256 } },
		});
	});

	it('should throw an error if metadata is invalid JSON', async () => {
		await expect(generateStyle('invalid-json', getServerOptions())).rejects.toThrow('invalid metadata');
	});
});
