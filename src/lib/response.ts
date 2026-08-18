import type { Compression } from '@versatiles/container';
import type { ServerResponse } from 'http';
import { brotli, gzip, unbrotli, ungzip } from './compressors.js';
import type { ResponseConfig, ResponseContent } from './types.js';
import { logImportant } from './log.js';

export class Response {
	readonly #response: ServerResponse;

	public constructor(response: ServerResponse) {
		this.#response = response;
	}

	public sendJSONString(json: string, config: ResponseConfig): Promise<void> {
		return this.sendContent(
			{
				buffer: Buffer.from(json),
				compression: 'raw',
				mime: 'application/json; charset=utf-8',
			},
			config,
		);
	}

	public async sendContent(response: ResponseContent, config: ResponseConfig): Promise<void> {
		const mime: string = response.mime ?? 'application/octet-stream';
		let compression: Compression = response.compression ?? 'raw';

		const { acceptGzip, acceptBr, optimalCompression } = config;

		let data = response.buffer;

		switch (compression) {
			case 'br':
				if (acceptBr) break;
				if (optimalCompression && acceptGzip) {
					data = await gzip(await unbrotli(data));
					compression = 'gzip';
					break;
				}
				data = await unbrotli(data);
				compression = 'raw';
				break;
			case 'gzip':
				if (acceptGzip) break;
				if (optimalCompression && acceptBr) {
					data = await brotli(await ungzip(data));
					compression = 'br';
					break;
				}
				data = await ungzip(data);
				compression = 'raw';
				break;
			default: // raw
				if (optimalCompression && acceptBr) {
					data = await brotli(data);
					compression = 'br';
					break;
				}
				if (optimalCompression && acceptGzip) {
					data = await gzip(data);
					compression = 'gzip';
					break;
				}
				compression = 'raw';
				break;
		}

		if (compression !== 'raw') this.#response.setHeader('content-encoding', compression);

		this.#response.statusCode = 200;
		this.#response.setHeader('content-type', mime);
		this.#response.end(data);
	}

	/**
	 * Sends a plain-text error message that the caller has explicitly chosen.
	 * Never pass a caught exception here - use {@link sendInternalError} instead,
	 * so that no exception details (message, stack trace) can reach the client.
	 */
	public sendError(message: string, code = 500): void {
		logImportant(message);
		this.#response.statusCode = code;
		this.#response.setHeader('content-type', 'text/plain');
		this.#response.end(message);
	}

	/**
	 * Handles an unexpected exception: the details are logged on the server only,
	 * while the client receives a generic message.
	 */
	public sendInternalError(err: unknown, code = 500): void {
		logImportant(String(err));
		this.#response.statusCode = code;
		this.#response.setHeader('content-type', 'text/plain');
		this.#response.end('internal error');
	}
}
