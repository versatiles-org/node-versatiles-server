import type { Compression } from '@versatiles/container';
import type { ServerResponse } from 'http';
import { brotli, gzip, unbrotli, ungzip } from './compressors.js';
import type { ResponseConfig, ContentResponse } from './types.js';

export async function respondWithContent(res: ServerResponse, response: ContentResponse, config: ResponseConfig): Promise<void> {
	const mime: string = response.mime ?? 'application/octet-stream';
	let compression: Compression = response.compression ?? 'raw';

	const { acceptGzip, acceptBr, optimalCompression } = config;

	let data = response.content;

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

	if (compression !== 'raw') res.setHeader('content-encoding', compression);

	res.statusCode = 200;
	res.setHeader('content-type', mime);
	res.end(data);
}

export function respondWithError(res: ServerResponse, err: unknown, code = 500): void {
	console.error(err);
	res.statusCode = code;
	res.setHeader('content-type', 'text/plain');
	res.end(String(err));
}
