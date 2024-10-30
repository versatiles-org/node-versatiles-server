import { guessStyle, GuessStyleOptions } from '@versatiles/style';
import type { ContainerInfo, ServerOptions } from './types.js';

/**
 * Asynchronously generates a style string based on the given container and options.
 * 
 * @param {VersaTiles} container - An instance of the VersaTiles container.
 * @param {Record<string, any>} options - An object containing options for style generation.
 * @returns {Promise<string>} A promise that resolves to a style string.
 */

export function generateStyle(containerInfo: ContainerInfo, options: ServerOptions): string {
	if (typeof options.port !== 'number') throw Error('port must be defined');

	const { tileFormat } = containerInfo.header;
	let format: 'avif' | 'jpg' | 'pbf' | 'png' | 'webp';
	switch (tileFormat) {
		// @ts-expect-error: check for wrong tile format
		case 'jpeg': format = 'jpg'; break;
		case 'jpg':
		case 'avif':
		case 'png':
		case 'webp':
		case 'pbf': format = tileFormat; break;
		case 'bin':
		case 'geojson':
		case 'json':
		case 'svg':
		case 'topojson':
			throw new Error('unsupported tile format ' + tileFormat);
		default:
			throw new Error('unknown tile format ' + String(tileFormat));
	}

	const baseUrl = options.baseUrl ?? `http://localhost:${options.port}/`;
	const { header, metadata } = containerInfo;


	const input: GuessStyleOptions = {
		format,
		tiles: [options.tilesUrl ?? '/tiles/default/{z}/{x}/{y}'],
		baseUrl,
		bounds: header.bbox,
	};
	try {
		if (metadata != null) {

			input.vectorLayers = JSON.parse(metadata)?.vector_layers;
		}
	} catch (_) {
		throw Error('invalid metadata');
	}

	if (input.vectorLayers == null) delete input.vectorLayers;

	const style = guessStyle(input);

	return JSON.stringify(style);
}
