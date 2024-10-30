import { createServer } from 'node:http';
import { Layer } from './layer.js';
import { resolve as resolvePath } from 'node:path';
import { Response } from './response.js';
import type { Reader } from '@versatiles/container';
import type { ResponseConfig, ServerOptions } from './types.js';
import type { Server as httpServer } from 'node:http';
import { getFileContent } from './file.js';
import { logDebug, logImportant, logInfo } from './log.js';

const DIRNAME = new URL('../../', import.meta.url).pathname;


export class Server {
	readonly #options: ServerOptions = {};

	readonly #layer: Layer;

	#server?: httpServer;

	public constructor(source: Reader | string, options: ServerOptions) {
		 
		if (source == null) throw Error('source not defined');

		Object.assign(this.#options, options);

		this.#options.port ??= 8080;
		this.#options.baseUrl ??= `http://localhost:${this.#options.port}/`;
		this.#options.compress ??= true;
		this.#options.host ??= '0.0.0.0';

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

					const match = /^\/tiles\/([0-9]+)\/([0-9]+)\/([0-9]+).*/.exec(path);
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

					if (this.#options.static != null) {
						const content = await getFileContent(this.#options.static, path);

						if (content != null) {
							logDebug('send static file');
							await response.sendContent(content, responseConfig);
							return;
						}
					}


					// check if request for cached static content

					const contentResponse = staticContent.get(path);
					if (contentResponse) {
						logDebug('send cached static file');
						await response.sendContent(contentResponse, responseConfig);
						return;
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

	async #buildStaticContent(): Promise<Cache> {
		const staticContent = new Cache();

		staticContent.addFolder('/', resolvePath(DIRNAME, 'static'));

		staticContent.addBuffer(
			'/tiles/style.json',
			Buffer.from(await this.#layer.getStyle(this.#options)),
			'application/json; charset=utf-8',
		);

		staticContent.addBuffer(
			'/tiles/meta.json',
			Buffer.from(await this.#layer.getMetadata() ?? ''),
			'application/json; charset=utf-8',
		);

		if ((this.#options.static != null) && (this.#options.cache == true)) {
			staticContent.addFolder('/', this.#options.static);
		}

		return staticContent;
	}
}
