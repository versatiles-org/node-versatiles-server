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
		this.#serverOptions = serverOptions
		this.#container = new Container(source, { tms: serverOptions?.tms ?? false });
	}

	public async init(): Promise<void> {
		if (this.#header) return;

		this.#header = await this.#container.getHeader();
		this.#metadata = await this.#container.getMetadata() ?? '{}';
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

	public async getStyle(): Promise<string> {
		await this.init();
		if (!this.#metadata) throw Error();
		return generateStyle(this.#metadata, this.#serverOptions);
	}

	public async getMetadata(): Promise<string | undefined> {
		await this.init();
		return this.#metadata;
	}
}