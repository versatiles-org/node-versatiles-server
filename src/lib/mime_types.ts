import { logImportant } from './log.js';

const MIMETYPES = new Map([
	['avif', 'image/avif'],
	['bin', 'application/octet-stream'],
	['css', 'text/css; charset=utf-8'],
	['geojson', 'application/geo+json; charset=utf-8'],
	['htm', 'text/html; charset=utf-8'],
	['html', 'text/html; charset=utf-8'],
	['ico', 'image/x-icon'],
	['jpeg', 'image/jpeg'],
	['jpg', 'image/jpeg'],
	['js', 'text/javascript; charset=utf-8'],
	['json', 'application/json; charset=utf-8'],
	['map', 'application/json; charset=utf-8'],
	['mjs', 'text/javascript; charset=utf-8'],
	['pbf', 'application/x-protobuf'],
	['png', 'image/png'],
	['svg', 'image/svg+xml; charset=utf-8'],
	['topojson', 'application/topo+json; charset=utf-8'],
	['txt', 'text/plain; charset=utf-8'],
	['webp', 'image/webp'],
]);

export function getMimeByFilename(filename: string, warn?: boolean): string {
	const format = filename.replace(/.*\./, '').toLowerCase();

	if (warn === true && !MIMETYPES.has(format)) {
		logImportant('Error: can not guess MIME for file: ' + filename);
	}

	return MIMETYPES.get(format) ?? 'application/octet-stream';
}
