import { readFileSync } from 'fs';
import { jest } from '@jest/globals';
import { createHash } from 'crypto';
import { resolve } from 'path';
import type { Server } from './server.js';

const DIRNAME = new URL('../../', import.meta.url).pathname;


jest.unstable_mockModule('./log.js', () => ({
	logDebug: jest.fn(),
	logImportant: jest.fn(),
	logInfo: jest.fn(),
}));
const { logImportant } = await import('./log.js');
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
		const response = await fetch(`${baseUrl}/tiles/default/8/55/67`);

		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toBe('application/x-protobuf');
		expect(await getResponseHash(response)).toBe('ISZuz4Nvv0yCNnZQpLxATu6lYTB5conusgV42FIYBm4=');
	});

	it('should serve tile data correctly 2/2', async () => {
		const response = await fetch(`${baseUrl}/tiles/default/14/3740/4505`);

		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toBe('application/x-protobuf');
		expect(await getResponseHash(response)).toBe('yubXQj2G+xYXgIDaUXzPHqnhghRnjAUgFMe8mSQEE2A=');
	});

	it('should throw error on missing tiles 1/2', async () => {
		const response = await fetch(`${baseUrl}/tiles/default/0/0/0`);

		expect(response.status).toBe(404);
		expect(response.headers.get('content-type')).toBe('text/plain');
		expect(await response.text()).toBe('tile not found: /tiles/default/0/0/0');
		expect(logImportant).toHaveBeenCalledWith('tile not found: /tiles/default/0/0/0');
	});

	it('should throw error on missing tiles 2/2', async () => {
		const response = await fetch(`${baseUrl}/tiles/default/12/34/56`);

		expect(response.status).toBe(404);
		expect(response.headers.get('content-type')).toBe('text/plain');
		expect(await response.text()).toBe('tile not found: /tiles/default/12/34/56');
		expect(logImportant).toHaveBeenCalledWith('tile not found: /tiles/default/12/34/56');
	});

	it('should handle unsupported HTTP methods with 405', async () => {
		const response = await fetch(`${baseUrl}/index.html`, { method: 'POST' });

		expect(response.status).toBe(405);
		expect(logImportant).toHaveBeenCalledWith('Method not allowed');
	});
});

describe('static files', () => {
	let server: Server;
	const port = 56789;
	const baseUrl = `http://localhost:${port}`;

	beforeAll(async () => {
		server = new ServerClass(
			resolve(DIRNAME, 'testdata/island.versatiles'),
			{ port, static: resolve(DIRNAME) },
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
		const response = await fetch(`${baseUrl}/static/`);

		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toBe('text/html; charset=utf-8');

		const text = await response.text() as string;
		expect(text).toBe(readFileSync(resolve(DIRNAME, 'static/index.html'), 'utf8'));
	});
});

async function getResponseHash(response: Response): Promise<string> {
	const hasher = createHash('sha256');
	hasher.update(Buffer.from(await response.arrayBuffer()));
	return hasher.digest('base64');
}
