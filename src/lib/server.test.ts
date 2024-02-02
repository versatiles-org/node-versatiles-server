/* eslint-disable @typescript-eslint/naming-convention */
import { readFileSync } from 'fs';
import { Server } from './server.js';
import { jest } from '@jest/globals';
import { createHash } from 'node:crypto';
import { resolve } from 'path';

const DIRNAME = new URL('../../', import.meta.url).pathname;

describe('Server', () => {
	let server: Server;
	const port = 56789; // Ensure this port is free on the machine running the test
	const baseUrl = `http://localhost:${port}`;
	const indexContent = readFileSync(resolve(DIRNAME, 'static/index.html'), 'utf8');

	beforeAll(async () => {
		const log = jest.spyOn(console, 'log').mockReturnValue();
		server = new Server(resolve(DIRNAME, 'testdata/island.versatiles'), { port, compress: true });
		await server.start();
		expect(log).toHaveBeenCalledWith('listening on port ' + port);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	afterAll(async () => {
		await server.stop();
	});

	test('Server should serve static content', async () => {
		const response = await fetch(`${baseUrl}/index.html`, {
			headers: { 'Accept-Encoding': 'deflate' },
		});

		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toBe('text/html; charset=utf-8');
		expect(response.headers.get('content-encoding')).toBe(null);

		expect(await response.text()).toBe(indexContent);
	});

	test('Server should serve Brotli compressed content', async () => {
		const response = await fetch(`${baseUrl}/index.html`, {
			headers: { 'Accept-Encoding': 'br' },
		});

		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toBe('text/html; charset=utf-8');
		expect(response.headers.get('content-encoding')).toBe('br');

		expect(await response.text()).toBe(indexContent);
	});

	test('Server should serve GZip compressed content', async () => {
		const response = await fetch(`${baseUrl}/index.html`, {
			headers: { 'Accept-Encoding': 'gzip' },
		});

		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toBe('text/html; charset=utf-8');
		expect(response.headers.get('content-encoding')).toBe('gzip');

		expect(await response.text()).toBe(indexContent);
	});

	test('Server should respond with 404 for unknown content', async () => {
		const error = jest.spyOn(console, 'error').mockReturnValue();
		const response = await fetch(`${baseUrl}/nonexistent.file`);

		expect(response.status).toBe(404);
		expect(error).toHaveBeenCalledWith('file not found: /nonexistent.file');
	});

	test('Server should serve tile data correctly 1/2', async () => {
		const response = await fetch(`${baseUrl}/tiles/8/55/67`);

		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toBe('application/x-protobuf');
		expect(await getResponseHash(response)).toBe('ISZuz4Nvv0yCNnZQpLxATu6lYTB5conusgV42FIYBm4=');
	});

	test('Server should serve tile data correctly 2/2', async () => {
		const response = await fetch(`${baseUrl}/tiles/14/3740/4505`);

		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toBe('application/x-protobuf');
		expect(await getResponseHash(response)).toBe('yubXQj2G+xYXgIDaUXzPHqnhghRnjAUgFMe8mSQEE2A=');
	});

	test('Server should error on missing tiles 1/2', async () => {
		const error = jest.spyOn(console, 'error').mockReturnValue();
		const response = await fetch(`${baseUrl}/tiles/0/0/0`);

		expect(response.status).toBe(404);
		expect(response.headers.get('content-type')).toBe('text/plain');
		expect(await response.text()).toBe('tile not found: /tiles/0/0/0');
		expect(error).toHaveBeenCalledWith('tile not found: /tiles/0/0/0');
	});

	test('Server should error on missing tiles 2/2', async () => {
		const error = jest.spyOn(console, 'error').mockReturnValue();
		const response = await fetch(`${baseUrl}/tiles/12/34/56`);

		expect(response.status).toBe(404);
		expect(response.headers.get('content-type')).toBe('text/plain');
		expect(await response.text()).toBe('tile not found: /tiles/12/34/56');
		expect(error).toHaveBeenCalledWith('tile not found: /tiles/12/34/56');
	});

	test('Server should handle unsupported HTTP methods with 405', async () => {
		const error = jest.spyOn(console, 'error').mockReturnValue();
		const response = await fetch(`${baseUrl}/index.html`, { method: 'POST' });

		expect(response.status).toBe(405);
		expect(error).toHaveBeenCalledWith('Method not allowed');
	});

	test('Server should serve dynamic JSON content correctly', async () => {
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

async function getResponseHash(response: Response): Promise<string> {
	const hasher = createHash('sha256');
	hasher.update(Buffer.from(await response.arrayBuffer()));
	return hasher.digest('base64');
}
