import { createServer } from 'http';
import { Layer } from './layer.js';
import { Response } from './response.js';
import type { Reader } from '@versatiles/container';
import type { ResponseConfig, ServerOptions } from './types.js';
import type { Server as httpServer } from 'http';
import { getFileContent } from './file.js';
import { logDebug, logImportant, logInfo } from './log.js';

const STATIC_DIRNAME = new URL('../../static', import.meta.url).pathname;

/** A tile source together with the id it is served under (e.g. `/tiles/<id>/…`). */
export interface SourceSpec {
	id: string;
	source: Reader | string;
}

export class Server {
	readonly #options: ServerOptions;

	readonly #layers: Map<string, Layer>;

	#server?: httpServer;

	/**
	 * @param sources A single source (served as layer "default") or a list of
	 *   `{ id, source }` specs, each served under `/tiles/<id>/…`.
	 */
	public constructor(sources: Reader | string | SourceSpec[], options: Partial<ServerOptions>) {
		if (sources == null) throw Error('source not defined');

		const specs: SourceSpec[] = Array.isArray(sources) ? sources : [{ id: 'default', source: sources }];
		if (specs.length === 0) throw Error('source not defined');

		const port = options.port ?? 8080;
		const baseUrl = options.baseUrl ?? `http://localhost:${port}/`;
		const tilesUrl = urlJoin(options.tilesUrl ?? '/tiles/default/{z}/{x}/{y}');
		const sprites = urlJoin(options.sprites ?? [{ id: 'basics', url: '/assets/sprites/basics/sprites' }]);
		const glyphs = urlJoin(options.glyphs ?? 'assets/glyphs/{fontstack}/{range}.pbf');
		const compress = options.compress ?? true;
		const host = options.host ?? '0.0.0.0';
		this.#options = { ...options, port, baseUrl, tilesUrl, sprites, glyphs, compress, host };

		this.#layers = new Map();
		for (const { id, source } of specs) {
			if (source == null) throw Error('source not defined');
			if (this.#layers.has(id)) throw Error(`duplicate source id: "${id}"`);
			// Each layer points its style at its own tile endpoint. A lone source keeps
			// the historical "/tiles/default/…" url (and honours an explicit tilesUrl).
			const layerTilesUrl = specs.length === 1 ? this.#options.tilesUrl : urlJoin(`/tiles/${id}/{z}/{x}/{y}`);
			this.#layers.set(id, new Layer(source, { ...this.#options, tilesUrl: layerTilesUrl }));
		}

		function urlJoin<T extends string | { id: string; url: string }[]>(url: T): T {
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
		const getTiles = new Map<string, Awaited<ReturnType<Layer['getTileFunction']>>>();
		for (const [id, layer] of this.#layers) {
			getTiles.set(id, await layer.getTileFunction());
		}
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

					// check if tile request: /tiles/<id>/<z>/<x>/<y>
					const match = /^\/tiles\/([^/]+)\/([0-9]+)\/([0-9]+)\/([0-9]+)/.exec(path);

					if (match) {
						const [, id, z, x, y] = match;
						const coords: [number, number, number] = [parseInt(z, 10), parseInt(x, 10), parseInt(y, 10)];
						const getTile = getTiles.get(id);
						const tileResponse = getTile ? await getTile(...coords) : null;
						if (!tileResponse) {
							logImportant('Error 404: tile not found: ' + path);
							response.sendError('tile not found: ' + path, 404);
							return;
						}
						logInfo('send tile: ' + coords.join('/'));
						await response.sendContent(tileResponse, responseConfig);
						return;
					}

					if (path == '/tiles/index.json') {
						return await response.sendJSONString(JSON.stringify([...this.#layers.keys()]), responseConfig);
					}

					// per-layer metadata: /tiles/<id>/tiles.json
					const metaMatch = /^\/tiles\/([^/]+)\/tiles\.json$/.exec(path);
					if (metaMatch) {
						const layer = this.#layers.get(metaMatch[1]);
						if (layer) {
							return await response.sendJSONString((await layer.getMetadata()) ?? '', responseConfig);
						}
					}

					// per-layer style: /tiles/<id>/style.json
					const styleMatch = /^\/tiles\/([^/]+)\/style\.json$/.exec(path);
					if (styleMatch) {
						const layer = this.#layers.get(styleMatch[1]);
						if (layer) {
							return await response.sendJSONString(await layer.getStyle(), responseConfig);
						}
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

		await new Promise<void>((r) =>
			server.listen(port, host, () => {
				r();
			}),
		);

		logImportant(`listening on port ${port}`);
		for (const id of this.#layers.keys()) {
			logInfo(`serving layer "${id}" at ${this.#options.baseUrl}tiles/${id}/style.json`);
		}
	}

	public async stop(): Promise<void> {
		if (this.#server === undefined) return;

		await new Promise<void>((res, rej) => {
			logInfo('stop server');
			this.#server?.close((err) => {
				if (err) rej(err);
				else res();
			});
		});

		this.#server = undefined;
	}
}
