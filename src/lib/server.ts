import { createServer } from 'node:http';
import { Layer } from './layer.js';
import { Response } from './response.js';
import type { Reader } from '@versatiles/container';
import type { ResponseConfig, ServerOptions } from './types.js';
import type { Server as httpServer } from 'node:http';
import { getFileContent } from './file.js';
import { logDebug, logImportant, logInfo } from './log.js';

const STATIC_DIRNAME = new URL('../../static', import.meta.url).pathname;

export class Server {
	readonly #options: ServerOptions;

	readonly #layer: Layer;

	#server?: httpServer;

	public constructor(source: Reader | string, options: Partial<ServerOptions>) {
		if (source == null) throw Error('source not defined');

		const port = options.port ?? 8080;
		const baseUrl = options.baseUrl ?? `http://localhost:${port}/`;
		const tilesUrl = urlJoin(options.tilesUrl ?? '/tiles/default/{z}/{x}/{y}');
		const sprites = urlJoin(options.sprites ?? [{ id: 'basics', url: '/assets/sprites/basics/sprites' }]);
		const glyphs = urlJoin(options.glyphs ?? 'assets/glyphs/{fontstack}/{range}.pbf');
		const compress = options.compress ?? true;
		const host = options.host ?? '0.0.0.0';
		this.#options = { ...options, port, baseUrl, tilesUrl, sprites, glyphs, compress, host };

		this.#layer = new Layer(source, this.#options);

		function urlJoin<T extends string | { id: string; url: string; }[]>(url: T): T {
			if (typeof url === 'string') {
				return new URL(url, baseUrl).href.replace(/%7B/g, '{').replace(/%7D/g, '}') as T;
			}
			if (Array.isArray(url)) {
				return url.map(({ id, url }) => ({ id, url: urlJoin(url) })) as T;
			}
			throw Error('invalid url');
		}
	}

	public getUrl(): string {
		return this.#options.baseUrl ?? `http://localhost:${this.#options.port}/`;
	}

	public async start(): Promise<void> {
		const getTile = await this.#layer.getTileFunction();
		const recompress = this.#options.compress ?? false;

		const server = createServer((req, res) => {
			void (async (): Promise<void> => {
				const response = new Response(res);

				try {
					if (req.method !== 'GET') {
						logImportant(`Error 405: Method "${req.method}" not allowed`);
						response.sendError('Method not allowed', 405);
						return;
					}

					if (!(req.url ?? '')) {
						logImportant('Error 404: URL not found');
						response.sendError('URL not found', 404);
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
					logInfo('new request: ' + path);

					// check if tile request
					const match = /^\/tiles\/default\/([0-9]+)\/([0-9]+)\/([0-9]+).*/.exec(path);

					if (match) {
						const [_, z, x, y] = match;
						const coords: [number, number, number] = [parseInt(z, 10), parseInt(x, 10), parseInt(y, 10)];
						const tileResponse = await getTile(...coords);
						if (!tileResponse) {
							logImportant('Error 404: tile not found: ' + path);
							response.sendError('tile not found: ' + path, 404);
							return;
						}
						logInfo('send tile: ' + coords.join('/'));
						await response.sendContent(tileResponse, responseConfig);
						return;
					}

					if (path == '/tiles/default/tiles.json') {
						return await response.sendJSONString(await this.#layer.getMetadata() ?? '', responseConfig);
					}

					if (path == '/tiles/default/style.json') {
						return await response.sendJSONString(await this.#layer.getStyle(), responseConfig);
					}

					if (path == '/tiles/index.json') {
						return await response.sendJSONString('["default"]', responseConfig);
					}

					// check if request for user defined static content
					if (this.#options.static != null) {
						const content = await getFileContent(this.#options.static, path);

						if (content != null) {
							logDebug('send user defined static file');
							return await response.sendContent(content, responseConfig);
						}
					}

					// check if request for standard static content
					const content = await getFileContent(STATIC_DIRNAME, path);
					if (content != null) {
						logDebug('send standard static file');
						return await response.sendContent(content, responseConfig);
					}

					// error 404
					logImportant('Error 404: file not found: ' + path);
					response.sendError('file not found: ' + path, 404);
					return;

				} catch (err) {
					logImportant('Error 500: internal error: ' + String(err));
					response.sendError(err, 500);
					return;
				}
			})();
		});

		this.#server = server;

		const { host, port } = this.#options;

		await new Promise<void>(r => server.listen(port, host, () => {
			r();
		}));

		logImportant(`listening on port ${port}`);
	}

	public async stop(): Promise<void> {
		if (this.#server === undefined) return;

		await new Promise<void>((res, rej) => {
			logInfo('stop server');
			this.#server?.close(err => {
				if (err) rej(err);
				else res();
			});
		});

		this.#server = undefined;
	}
}