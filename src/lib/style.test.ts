/* eslint-disable @typescript-eslint/naming-convention */

import type { TileJSONOption } from '@versatiles/style/dist/lib/types.js';
import type { ContainerInfo } from './types.js';
import { jest } from '@jest/globals';

// Mocking the external dependency '@versatiles/style'
jest.unstable_mockModule('@versatiles/style', () => ({
	guessStyle: jest.fn(),
}));

const { guessStyle } = await import('@versatiles/style');
const { generateStyle } = await import('./style.js');

const options = {
	port: 3000,
	baseUrl: 'http://localhost:3000/',
	tilesUrl: 'http://example.com/tiles/{z}/{x}/{y}',
};

describe('generateStyle for some formats', () => {
	beforeEach(() => {
		jest.mocked(guessStyle).mockReset();
	});

	it('generates a style for avif tiles', () => {
		generateStyle(getContainerInfo('avif'), options);
		expect(guessStyle).toHaveBeenCalledWith(getTileJSONOptions('avif'));
	});

	it('generates a style for jpeg tiles', () => {
		generateStyle(getContainerInfo('jpeg'), options);
		expect(guessStyle).toHaveBeenCalledWith(getTileJSONOptions('jpg'));
	});

	it('generates a style for png tiles', () => {
		generateStyle(getContainerInfo('png'), options);
		expect(guessStyle).toHaveBeenCalledWith(getTileJSONOptions('png'));
	});

	it('generates a style for webp tiles', () => {
		generateStyle(getContainerInfo('webp'), options);
		expect(guessStyle).toHaveBeenCalledWith(getTileJSONOptions('webp'));
	});


	it('throws an error for bin tile formats', () => {
		expect(() => generateStyle(getContainerInfo('bin'), options))
			.toThrow('unsupported tile format bin');
	});

	it('throws an error for geojson tile formats', () => {
		expect(() => generateStyle(getContainerInfo('geojson'), options))
			.toThrow('unsupported tile format geojson');
	});

	it('throws an error for json tile formats', () => {
		expect(() => generateStyle(getContainerInfo('json'), options))
			.toThrow('unsupported tile format json');
	});

	it('throws an error for svg tile formats', () => {
		expect(() => generateStyle(getContainerInfo('svg'), options))
			.toThrow('unsupported tile format svg');
	});

	it('throws an error for topojson tile formats', () => {
		expect(() => generateStyle(getContainerInfo('topojson'), options))
			.toThrow('unsupported tile format topojson');
	});

	it('throws an error for unknown tile formats', () => {
		expect(() => generateStyle(getContainerInfo('unknown_format'), options))
			.toThrow('unknown tile format unknown_format');
	});


	function getContainerInfo(tileFormat: string): ContainerInfo {
		// @ts-expect-error allow any tileFormat
		return { header: { tileFormat, bbox: [0, 0, 10, 10] } };
	}

	function getTileJSONOptions(format: 'avif' | 'jpg' | 'pbf' | 'png' | 'webp'): TileJSONOption {
		return {
			format,
			tiles: ['http://example.com/tiles/{z}/{x}/{y}'],
			baseUrl: 'http://localhost:3000/',
			bounds: [0, 0, 10, 10],
		};
	}
});

describe('generateStyle for vector tiles', () => {
	beforeEach(() => {
		jest.mocked(guessStyle).mockReset();
	});

	it('generates a style for pbf tiles', () => {
		generateStyle({
			header: { tileFormat: 'pbf', bbox: [0, 0, 10, 10] },
			metadata: JSON.stringify({ vector_layers: ['layer1', 'layer2'] }),
		}, options);

		// Verify that guessStyle was called with the correct arguments
		expect(jest.mocked(guessStyle)).toHaveBeenCalledWith({
			format: 'pbf',
			tiles: ['http://example.com/tiles/{z}/{x}/{y}'],
			vectorLayers: ['layer1', 'layer2'],
			baseUrl: 'http://localhost:3000/',
			bounds: [0, 0, 10, 10],
		});
	});

	it('throws an error on invalid metadata', () => {
		expect(() => generateStyle({
			header: { tileFormat: 'pbf', bbox: [0, 0, 10, 10] },
			metadata: '#',
		}, options)).toThrow('invalid metadata');
	});
});

describe('error handling of generateStyle', () => {
	it('throws an error on invalid port number', () => {
		expect(() => generateStyle({
			header: { tileFormat: 'pbf', bbox: [0, 0, 10, 10] },
		}, { ...options, port: undefined })).toThrow('port must be defined');
	});
});
