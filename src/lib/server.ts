import { createServer } from 'node:http';
import { Layer } from './layer.js';
import { resolve, resolve as resolvePath } from 'node:path';
import { respondWithContent, respondWithError } from './response.js';
import { StaticContent } from './static_content.js';
import type { Reader } from '@versatiles/container';
import type { ResponseConfig, ServerOptions } from './types.js';
import type { Server as httpServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { getMimeByFilename } from './mime_types.js';

const DIRNAME = new URL('../../', import.meta.url).pathname;


export class Server {
	readonly #options: ServerOptions = {};

	readonly #layer: Layer;

	#server?: httpServer;

	public constructor(source: Reader | string, options: ServerOptions) {
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		if (source == null) throw Error('source not defined');

		Object.assign(this.#options, options);

		this.#options.compress ??= true;
		this.#options.port ??= 8080;
		this.#options.host ??= '0.0.0.0';
		this.#options.baseUrl ??= `http://localhost:${this.#options.port}/`;

		this.#layer = new Layer(source, options);
	}

	public getUrl(): string {
		return this.#options.baseUrl ?? `http://localhost:${this.#options.port}/`;
	}

	public async start(): Promise<void> {
		const getTile = await this.#layer.getTileFunction();

		const recompress = this.#options.compress ?? false;

		const staticContent = await this.#buildStaticContent();

		const server = createServer((req, res) => {
			void (async (): Promise<void> => {
				try {
					if (req.method !== 'GET') {
						respondWithError(res, 'Method not allowed', 405);
						return;
					}

					if (!(req.url ?? '')) {
						respondWithError(res, 'URL not found', 404);
						return;
					}

					// check request

					const acceptedEncoding = req.headers['accept-encoding'] ?? '';
					const responseConfig: ResponseConfig = {
						acceptBr: acceptedEncoding.includes('br'),
						acceptGzip: acceptedEncoding.includes('gzip'),
						optimalCompression: recompress,
					};

					const path = new URL(req.url ?? '', 'resolve://').pathname;

					// check if tile request

					const match = /^\/tiles\/([0-9]+)\/([0-9]+)\/([0-9]+).*/.exec(path);
					if (match) {
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						const [_, z, x, y] = match;
						const tileResponse = await getTile(parseInt(z, 10), parseInt(x, 10), parseInt(y, 10));
						if (!tileResponse) {
							respondWithError(res, 'tile not found: ' + path, 404);
							return;
						}
						await respondWithContent(res, tileResponse, responseConfig);
						return;
					}

					// check if request for static content

					if ((this.#options.noCache === true) && (this.#options.static != null)) {
						let filename = resolve(this.#options.static, path.replace(/^\/+/, ''));
						if (!filename.startsWith(this.#options.static)) {
							respondWithError(res, 'file not found: ' + path, 404);
							return;
						}
						if ((await stat(filename)).isDirectory()) {
							filename = resolve(filename, 'index.html');
						}
						if (existsSync(filename)) {
							await respondWithContent(
								res,
								{
									content: await readFile(filename),
									compression: 'raw',
									mime: getMimeByFilename(filename),
								},
								responseConfig,
							);
						} else {
							respondWithError(res, 'file not found: ' + path, 404);
							return;
						}
					}

					// check if request for cached static content

					const contentResponse = staticContent.get(path);
					if (contentResponse) {
						await respondWithContent(res, contentResponse, responseConfig);
						return;
					}

					// error 404

					respondWithError(res, 'file not found: ' + path, 404);
					return;

				} catch (err) {
					respondWithError(res, err, 500);
					return;
				}
			})();
		});

		this.#server = server;

		const { host, port } = this.#options;

		await new Promise<void>(r => server.listen(port, host, () => {
			r();
		}));

		console.log(`listening on port ${port}`);
	}

	public async stop(): Promise<void> {
		if (this.#server === undefined) return;
		await new Promise<void>((res, rej) => {
			this.#server?.close(err => {
				if (err) rej(err);
				else res();
			});
		});
		this.#server = undefined;
	}

	async #buildStaticContent(): Promise<StaticContent> {
		const staticContent = new StaticContent();

		staticContent.addFolder('/', resolvePath(DIRNAME, 'static'));

		staticContent.addFile(
			'/tiles/style.json',
			Buffer.from(await this.#layer.getStyle(this.#options)),
			'application/json; charset=utf-8',
		);

		staticContent.addFile(
			'/tiles/meta.json',
			Buffer.from(await this.#layer.getMetadata() ?? ''),
			'application/json; charset=utf-8',
		);

		if ((this.#options.static != null) && (this.#options.noCache !== true)) {
			staticContent.addFolder('/', this.#options.static);
		}

		return staticContent;
	}
}
