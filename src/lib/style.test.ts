import { ServerOptions } from './types.js';
import { generateStyle } from './style.js';
import { describe, it, expect } from 'vitest';

describe('generateStyle', () => {
	const validTileJSON = JSON.stringify({
		tilejson: '2.2.0',
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

	it('should generate a valid style for given metadata and server options', () => {
		const styleString = generateStyle(validTileJSON, getServerOptions());
		expect(JSON.parse(styleString)).toEqual({
			version: 8,
			layers: [{ id: 'raster', source: 'rasterSource', type: 'raster', },],
			sources: { rasterSource: { tiles: ['http://localhost:8080/tiles/test/{z}/{x}/{y}'], type: 'raster', }, },
		});
	});

	it('should use the default base URL if none is provided', () => {
		const styleString = generateStyle(validTileJSON, getServerOptions('http://example.org:2345'));
		expect(JSON.parse(styleString)).toEqual({
			version: 8,
			layers: [{ id: 'raster', source: 'rasterSource', type: 'raster', },],
			sources: { rasterSource: { tiles: ['http://example.org:2345/tiles/test/{z}/{x}/{y}'], type: 'raster', }, },
		});
	});

	it('should throw an error if metadata is invalid JSON', () => {
		expect(() => generateStyle('invalid-json', getServerOptions())).toThrow('invalid metadata');
	});
});