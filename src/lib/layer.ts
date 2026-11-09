import type { Compression, Header, Reader } from '@versatiles/container';
import { Container } from '@versatiles/container';
import type { ResponseContent, ServerOptions } from './types.js';
import { generateStyle } from './style.js';

export class Layer {
	readonly #container: Container;

	#serverOptions: ServerOptions;
	#header?: Header;
	#metadata?: string;
	#mime?: string;
	#compression?: Compression;

	public constructor(source: Reader | string, serverOptions: ServerOptions) {
		this.#serverOptions = serverOptions;
		this.#container = new Container(source, { tms: serverOptions?.tms ?? false });
	}

	public async init(): Promise<void> {
		if (this.#header) return;

		this.#header = await this.#container.getHeader();
		this.#metadata = (await this.#container.getMetadata()) ?? '{}';
		this.#mime = this.#header.tileMime;
		this.#compression = this.#header.tileCompression;
	}

	public async getTileFunction(): Promise<(z: number, x: number, y: number) => Promise<ResponseContent | null>> {
		await this.init();

		const container = this.#container;
		const mime = this.#mime;
		const compression = this.#compression;

		return async (z: number, x: number, y: number): Promise<ResponseContent | null> => {
			const buffer = await container.getTile(z, x, y);
			if (!buffer) return null;
			return { buffer, mime, compression };
		};
	}

	/**
	 * Whether a tile the container lacks at zoom level `z` is an empty tile rather
	 * than a missing one. As in the Rust server, that is a vector tile within the
	 * container's zoom range: a client draws nothing there instead of reporting an error.
	 */
	public async isEmptyTile(z: number): Promise<boolean> {
		await this.init();
		if (!this.#header) return false;
		const { tileFormat, zoomMin, zoomMax } = this.#header;
		return (tileFormat === 'mvt' || tileFormat === 'mlt') && z >= zoomMin && z <= zoomMax;
	}

	public async getStyle(): Promise<string> {
		await this.init();
		if (!this.#metadata) throw Error();
		return generateStyle(this.#metadata, this.#serverOptions);
	}

	public async getMetadata(): Promise<string | undefined> {
		await this.init();
		return this.#metadata;
	}

	/**
	 * The container's metadata as TileJSON, with `tiles` set to the given tile URL
	 * so that clients know where to load the tiles from. As in the Rust server, the
	 * zoom range comes from the container header, and so do the bounds if the
	 * metadata has none, so that clients only ask for tiles the container can have.
	 */
	public async getTileJSON(tilesUrl: string): Promise<string> {
		await this.init();
		const metadata: unknown = JSON.parse(this.#metadata ?? '{}');
		if (typeof metadata !== 'object' || metadata === null || Array.isArray(metadata)) {
			throw Error('metadata is not a JSON object');
		}
		if (!this.#header) throw Error('header not loaded');
		const { zoomMin, zoomMax, bbox } = this.#header;
		return JSON.stringify({
			...metadata,
			bounds: 'bounds' in metadata ? metadata.bounds : bbox,
			minzoom: zoomMin,
			maxzoom: zoomMax,
			tiles: [tilesUrl],
		});
	}
}
