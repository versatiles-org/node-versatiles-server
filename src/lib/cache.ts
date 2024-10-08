import type { Compression } from '@versatiles/container';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ResponseContent } from './types.js';
import { getMimeByFilename } from './mime_types.js';
import { logDebug } from './log.js';


/**
 * The `StaticContent` class provides a way to store and retrieve static content.
 * It allows adding content as a Buffer, object, or string, and retrieving it via a path.
 * It also supports adding the contents of an entire directory, automatically handling MIME types
 * and optional compression. This class is useful for serving static files in a web server context.
 */
export class Cache {
	readonly #map: Map<string, ResponseContent>;

	/**
	 * Constructs a new instance of the StaticContent class.
	 */
	public constructor() {
		this.#map = new Map();
	}

	/**
	 * Helper function to resolve a URL from a base URL and a relative path.
	 * @private
	 * @param from - The base URL.
	 * @param to - The relative path to resolve against the base URL.
	 * @returns The resolved URL path.
	 */
	private static urlResolve(from: string, to: string): string {
		if (!from.endsWith('/')) from += '/';
		const resolvedUrl = new URL(to, new URL(from, 'resolve://'));
		return resolvedUrl.pathname;
	}

	/**
	 * Retrieves the static response associated with the given path.
	 * @param path - The path to retrieve the static response for.
	 * @returns The static response or undefined if not found.
	 */
	public get(path: string): ResponseContent | undefined {
		return this.#map.get(path);
	}

	/**
	 * Adds a new static response to the map.
	 * @param path - The path where the static response will be accessible.
	 * @param buffer - The content to serve as a Buffer.
	 * @param mime - The MIME type of the content.
	 * @param compression - The compression method used, if any.
	 * @throws Will throw an error if the path already exists in the map.
	 */
	 
	public addBuffer(path: string, buffer: Buffer, mime: string, compression: Compression = 'raw'): void {
		logDebug('add to cache: ' + path);
		this.#map.set(path, { buffer, mime, compression });

		if (path.endsWith('/index.html')) {
			path = path.replace(/index\.html$/, '');
			this.#map.set(path, { buffer, mime, compression });
			if (path.length > 2) {
				path = path.replace(/\/$/, '');
				this.#map.set(path, { buffer, mime, compression });
			}
		}
	}

	/**
	 * Adds the contents of a directory to the map, recursively adding any subdirectories.
	 * @param url - The base URL that the directory contents will be accessible under.
	 * @param dir - The directory whose contents should be added.
	 */
	public addFolder(url: string, dir: string): void {
		logDebug('cache static files from folder: ' + dir);
		if (!existsSync(dir)) return;

		readdirSync(dir).forEach(name => {
			if (name.startsWith('.')) return;

			const subDir = resolve(dir, name);
			let subUrl = Cache.urlResolve(url, name);

			if (statSync(subDir).isDirectory()) {
				this.addFolder(subUrl, subDir);
			} else {
				let compression: Compression = 'raw';

				if (name.endsWith('.br')) {
					compression = 'br';
				} else if (name.endsWith('.gz')) {
					compression = 'gzip';
				}

				if (compression !== 'raw') {
					// remove last extension
					name = name.replace(/\.[^.]+$/, '');
					subUrl = subUrl.replace(/\.[^.]+$/, '');
				}

				this.addBuffer(subUrl, readFileSync(subDir), getMimeByFilename(name, true), compression);
			}
		});
	}
}
