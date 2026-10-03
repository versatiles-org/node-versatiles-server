import { guessStyle, TileJSONSpecification } from '@versatiles/style';
import { ServerOptions } from './types.js';

/**
 * Asynchronously generates a style string based on the given container and options.
 *
 * @param {VersaTiles} container - An instance of the VersaTiles container.
 * @param {Record<string, any>} serverOptions - An object containing options for style generation.
 * @returns {Promise<string>} A promise that resolves to a style string.
 */

export async function generateStyle(metadata: string, serverOptions: ServerOptions): Promise<string> {
	let tileJSON: TileJSONSpecification;
	try {
		tileJSON = JSON.parse(metadata);
	} catch (cause) {
		throw new Error('invalid metadata', { cause });
	}

	tileJSON.tiles = [serverOptions.tilesUrl];

	const style = await guessStyle(tileJSON, {
		urls: {
			base: serverOptions.baseUrl,
			sprite: serverOptions.sprites,
			glyphsPattern: serverOptions.glyphs,
		},
	});

	return JSON.stringify(style);
}
