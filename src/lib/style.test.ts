/* eslint-disable @typescript-eslint/naming-convention */

import type { ContainerInfo } from './types.js';
import { jest } from '@jest/globals';

// Mocking the external dependency '@versatiles/style'
jest.unstable_mockModule('@versatiles/style', () => ({
	guessStyle: jest.fn(),
}));

const { guessStyle } = await import('@versatiles/style');
const { generateStyle } = await import('./style.js');

// Describing the test suite
describe('generateStyle', () => {
	const options = {
		port: 3000,
		baseUrl: 'http://localhost:3000/',
		tilesUrl: 'http://example.com/tiles/{z}/{x}/{y}',
	};

	beforeEach(() => {
		jest.mocked(guessStyle).mockReset();
	});

	it('generates a style for png tiles', () => {
		generateStyle({
			header: { tileFormat: 'png', bbox: [0, 0, 10, 10] },
		}, options);

		// Verify that guessStyle was called with the correct arguments
		expect(guessStyle).toHaveBeenCalledWith({
			format: 'png',
			tiles: ['http://example.com/tiles/{z}/{x}/{y}'],
			baseUrl: 'http://localhost:3000/',
			bounds: [0, 0, 10, 10],
		});
	});

	it('generates a style for jpeg tiles', () => {
		generateStyle({
			header: { tileFormat: 'jpeg', bbox: [0, 0, 10, 10] },
		}, options);

		// Verify that guessStyle was called with the correct arguments
		expect(guessStyle).toHaveBeenCalledWith({
			format: 'jpg',
			tiles: ['http://example.com/tiles/{z}/{x}/{y}'],
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

	// Handling error for unsupported tile format
	it('throws an error for unknown tile formats', () => {
		const containerInfo: ContainerInfo = {
			// @ts-expect-error unknown format
			header: { tileFormat: 'unknown_format', bbox: [0, 0, 10, 10] },
			metadata: '{}',
		};

		expect(() => generateStyle(containerInfo, options)).toThrow('unknown tile format unknown_format');
	});

	// Handling error for unsupported tile format
	it('throws an error for geojson tile formats', () => {
		const containerInfo: ContainerInfo = {
			header: { tileFormat: 'geojson', bbox: [0, 0, 10, 10] },
			metadata: '{}',
		};

		expect(() => generateStyle(containerInfo, options)).toThrow('unsupported tile format geojson');
	});


	it('throws an error on invalid port number', () => {
		expect(() => generateStyle({
			header: { tileFormat: 'pbf', bbox: [0, 0, 10, 10] },
		}, { ...options, port: undefined })).toThrow('port must be defined');
	});
});
