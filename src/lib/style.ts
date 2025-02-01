import { guessStyle, TileJSONSpecification } from '@versatiles/style';
import { ServerOptions } from './types.js';

/**
 * Asynchronously generates a style string based on the given container and options.
 * 
 * @param {VersaTiles} container - An instance of the VersaTiles container.
 * @param {Record<string, any>} serverOptions - An object containing options for style generation.
 * @returns {Promise<string>} A promise that resolves to a style string.
 */

export function generateStyle(metadata: string, serverOptions: ServerOptions): string {
	let tileJSON: TileJSONSpecification;
	try {
		tileJSON = JSON.parse(metadata)
	} catch (_) {
		throw Error('invalid metadata');
	}

	tileJSON.tiles = [serverOptions.tilesUrl];

	const style = guessStyle(tileJSON, {
		baseUrl: serverOptions.baseUrl,
		sprite: serverOptions.sprites,
		glyphs: serverOptions.glyphs,
	});

	return JSON.stringify(style);
}
