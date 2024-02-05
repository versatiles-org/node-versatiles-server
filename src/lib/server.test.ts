/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/naming-convention */
import { readFileSync } from 'node:fs';
import { jest } from '@jest/globals';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import type { Server } from './server.js';
import type { ResponseContent } from './types.js';

const DIRNAME = new URL('../../', import.meta.url).pathname;


jest.unstable_mockModule('./log.js', () => ({
	logDebug: jest.fn(),
	logImportant: jest.fn(),
	logInfo: jest.fn(),
}));
jest.unstable_mockModule('./file.js', () => ({
	getFileContent: jest.fn(),
}));
const { logImportant } = await import('./log.js');
const { getFileContent } = await import('./file.js');
const { Server: ServerClass } = await import('./server.js');


describe('Server', () => {
	let server: Server;
	const port = 56788;
	const baseUrl = `http://localhost:${port}`;
	const indexContent = readFileSync(resolve(DIRNAME, 'static/index.html'), 'utf8');

	beforeAll(async () => {
		server = new ServerClass(resolve(DIRNAME, 'testdata/island.versatiles'), { port, compress: true });
		await server.start();
		expect(logImportant).toHaveBeenCalledWith('listening on port ' + port);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	afterAll(async () => {
		await server.stop();
	});

	it('getUrl', async () => {
		expect(server.getUrl()).toBe(baseUrl + '/');
	});


	it('should serve static content', async () => {
		const response = await fetch(`${baseUrl}/index.html`, {
			headers: { 'Accept-Encoding': 'deflate' },
		});

		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toBe('text/html; charset=utf-8');
		expect(response.headers.get('content-encoding')).toBe(null);

		expect(await response.text()).toBe(indexContent);
	});

	it('should serve Brotli compressed content', async () => {
		const response = await fetch(`${baseUrl}/index.html`, {
			headers: { 'Accept-Encoding': 'br' },
		});

		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toBe('text/html; charset=utf-8');
		expect(response.headers.get('content-encoding')).toBe('br');

		expect(await response.text()).toBe(indexContent);
	});

	it('should serve GZip compressed content', async () => {
		const response = await fetch(`${baseUrl}/index.html`, {
			headers: { 'Accept-Encoding': 'gzip' },
		});

		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toBe('text/html; charset=utf-8');
		expect(response.headers.get('content-encoding')).toBe('gzip');

		expect(await response.text()).toBe(indexContent);
	});

	it('should respond with 404 for unknown content', async () => {
		const response = await fetch(`${baseUrl}/nonexistent.file`);

		expect(response.status).toBe(404);
		expect(logImportant).toHaveBeenCalledWith('file not found: /nonexistent.file');
	});

	it('should serve tile data correctly 1/2', async () => {
		const response = await fetch(`${baseUrl}/tiles/8/55/67`);

		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toBe('application/x-protobuf');
		expect(await getResponseHash(response)).toBe('ISZuz4Nvv0yCNnZQpLxATu6lYTB5conusgV42FIYBm4=');
	});

	it('should serve tile data correctly 2/2', async () => {
		const response = await fetch(`${baseUrl}/tiles/14/3740/4505`);

		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toBe('application/x-protobuf');
		expect(await getResponseHash(response)).toBe('yubXQj2G+xYXgIDaUXzPHqnhghRnjAUgFMe8mSQEE2A=');
	});

	it('should throw error on missing tiles 1/2', async () => {
		const response = await fetch(`${baseUrl}/tiles/0/0/0`);

		expect(response.status).toBe(404);
		expect(response.headers.get('content-type')).toBe('text/plain');
		expect(await response.text()).toBe('tile not found: /tiles/0/0/0');
		expect(logImportant).toHaveBeenCalledWith('tile not found: /tiles/0/0/0');
	});

	it('should throw error on missing tiles 2/2', async () => {
		const response = await fetch(`${baseUrl}/tiles/12/34/56`);

		expect(response.status).toBe(404);
		expect(response.headers.get('content-type')).toBe('text/plain');
		expect(await response.text()).toBe('tile not found: /tiles/12/34/56');
		expect(logImportant).toHaveBeenCalledWith('tile not found: /tiles/12/34/56');
	});

	it('should handle unsupported HTTP methods with 405', async () => {
		const response = await fetch(`${baseUrl}/index.html`, { method: 'POST' });

		expect(response.status).toBe(405);
		expect(logImportant).toHaveBeenCalledWith('Method not allowed');
	});

	it('should serve dynamic JSON content correctly', async () => {
		const response = await fetch(`${baseUrl}/tiles/style.json`);

		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toBe('application/json; charset=utf-8');

		const style = await response.json();
		expect(style).toMatchObject({
			version: 8,
			sprite: `http://localhost:${port}/assets/sprites/sprites`,
			glyphs: `http://localhost:${port}/assets/fonts/{fontstack}/{range}.pbf`,
		});

		expect(style).toBeDefined();
		expect(style).toHaveProperty('layers');

		if (style == null) throw Error();
		if (!(typeof style === 'object')) throw Error();
		if (!('layers' in style)) throw Error();
		if (style.layers == null) throw Error();
		if (!Array.isArray(style.layers)) throw Error();

		expect(style.layers[0]).toMatchObject({
			id: 'background',
			paint: { 'background-color': '#f9f4ee' },
			type: 'background',
		});
	});
});

describe('static files', () => {
	let server: Server;
	const port = 56789;
	const baseUrl = `http://localhost:${port}`;

	beforeAll(async () => {
		server = new ServerClass(
			resolve(DIRNAME, 'testdata/island.versatiles'),
			{ port, cache: false, static: resolve(DIRNAME) },
		);
		await server.start();
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	afterAll(async () => {
		await server.stop();
	});

	it('should serve static files correctly', async () => {
		jest.mocked(getFileContent).mockImplementationOnce(async (staticFolder: string, path: string): Promise<ResponseContent> => ({
			buffer: Buffer.from(JSON.stringify({ staticFolder, path })),
			mime: 'text/html; charset=utf-8',
		}));
		const response = await fetch(`${baseUrl}/static`);

		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toBe('text/html; charset=utf-8');

		// @ts-expect-error: yes
		const { staticFolder, path } = await response.json();
		expect(staticFolder).toBe(resolve(DIRNAME));
		expect(path).toBe('/static');
	});
});

async function getResponseHash(response: Response): Promise<string> {
	const hasher = createHash('sha256');
	hasher.update(Buffer.from(await response.arrayBuffer()));
	return hasher.digest('base64');
}
