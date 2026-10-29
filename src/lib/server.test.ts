import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { describe, it, expect, vi, beforeAll, afterEach, afterAll } from 'vitest';
import { createHash } from 'crypto';
import { connect } from 'net';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import type { Server } from './server.js';

const DIRNAME = fileURLToPath(new URL('../../', import.meta.url));

vi.mock('./log.js', () => ({
	logDebug: vi.fn(),
	logImportant: vi.fn(),
	logInfo: vi.fn(),
}));
const { logImportant } = await import('./log.js');
const { Server: ServerClass, parseAcceptEncoding } = await import('./server.js');

describe('parseAcceptEncoding', () => {
	const parse = (header: string): string[] => [...parseAcceptEncoding(header)].sort();

	it('parses plain lists', () => {
		expect(parse('gzip, deflate, br')).toStrictEqual(['br', 'deflate', 'gzip']);
		expect(parse('')).toStrictEqual([]);
	});

	it('honours q-values', () => {
		expect(parse('gzip;q=0, br;q=0.5')).toStrictEqual(['br']);
		expect(parse('gzip; q=0.000, br')).toStrictEqual(['br']);
	});

	it('handles the wildcard', () => {
		expect(parse('*')).toStrictEqual(['br', 'gzip']);
		expect(parse('*, br;q=0')).toStrictEqual(['gzip']);
		expect(parse('*;q=0, gzip')).toStrictEqual(['gzip']);
	});
});

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
		vi.restoreAllMocks();
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
		expect(response.headers.get('content-type')).toBe('application/vnd.mapbox-vector-tile');
		expect(await getResponseHash(response)).toBe('ISZuz4Nvv0yCNnZQpLxATu6lYTB5conusgV42FIYBm4=');
	});

	it('should serve tile data correctly 2/2', async () => {
		const response = await fetch(`${baseUrl}/tiles/default/14/3740/4505`);

		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toBe('application/vnd.mapbox-vector-tile');
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
		server = new ServerClass(resolve(DIRNAME, 'testdata/island.versatiles'), { port, static: resolve(DIRNAME) });
		await server.start();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	afterAll(async () => {
		await server.stop();
	});

	it('should serve static files correctly', async () => {
		const response = await fetch(`${baseUrl}/static/`);

		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toBe('text/html; charset=utf-8');

		const text = (await response.text()) as string;
		expect(text).toBe(readFileSync(resolve(DIRNAME, 'static/index.html'), 'utf8'));
	});
});

describe('static folder containment', () => {
	let server: Server;
	let tempDir: string;
	const port = 56792;

	beforeAll(async () => {
		// A real folder layout: the static folder, a hidden file and a sibling folder sharing its name as prefix.
		tempDir = mkdtempSync(join(tmpdir(), 'versatiles-server-'));
		mkdirSync(join(tempDir, 'static'));
		mkdirSync(join(tempDir, 'static-secret'));
		writeFileSync(join(tempDir, 'static', 'public.txt'), 'public');
		writeFileSync(join(tempDir, 'static', '.env'), 'SECRET');
		writeFileSync(join(tempDir, 'static-secret', 'secret.txt'), 'SECRET');

		server = new ServerClass(resolve(DIRNAME, 'testdata/island.versatiles'), {
			port,
			static: join(tempDir, 'static'),
		});
		await server.start();
	});

	afterAll(async () => {
		await server.stop();
		rmSync(tempDir, { recursive: true, force: true });
	});

	it('serves files inside the static folder', async () => {
		expect(await rawGet(port, '/public.txt')).toStrictEqual({ status: 200, body: 'public' });
	});

	for (const path of [
		'/../static-secret/secret.txt',
		'/%2e%2e/static-secret/secret.txt',
		'/..\\static-secret\\secret.txt',
		'/..%5Cstatic-secret%5Csecret.txt',
		'/.env',
		'/%2Eenv',
	]) {
		it(`refuses ${path}`, async () => {
			const { status, body } = await rawGet(port, path);
			expect(status).toBe(404);
			expect(body).not.toContain('SECRET');
		});
	}
});

describe('multiple sources', () => {
	let server: Server;
	const port = 56790;
	const baseUrl = `http://localhost:${port}`;
	const island = resolve(DIRNAME, 'testdata/island.versatiles');

	beforeAll(async () => {
		server = new ServerClass(
			[
				{ id: 'osm', source: island },
				{ id: 'satellite', source: island },
			],
			{ port, compress: true },
		);
		await server.start();
	});

	afterAll(async () => {
		await server.stop();
	});

	it('lists all layers in the index', async () => {
		const response = await fetch(`${baseUrl}/tiles/index.json`);
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual(['osm', 'satellite']);
	});

	it('serves tiles for each layer', async () => {
		for (const id of ['osm', 'satellite']) {
			const response = await fetch(`${baseUrl}/tiles/${id}/8/55/67`);
			expect(response.status).toBe(200);
			expect(response.headers.get('content-type')).toBe('application/vnd.mapbox-vector-tile');
		}
	});

	it('points each layer style at its own tile endpoint', async () => {
		const response = await fetch(`${baseUrl}/tiles/satellite/style.json`);
		expect(response.status).toBe(200);
		const style = (await response.json()) as { sources: Record<string, { tiles?: string[] }> };
		const tiles = Object.values(style.sources)[0].tiles ?? [];
		expect(tiles).toEqual([`${baseUrl}/tiles/satellite/{z}/{x}/{y}`]);
	});

	it('serves per-layer metadata', async () => {
		const response = await fetch(`${baseUrl}/tiles/osm/tiles.json`);
		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toContain('application/json');
	});

	it('responds with 404 for an unknown layer', async () => {
		const response = await fetch(`${baseUrl}/tiles/unknown/8/55/67`);
		expect(response.status).toBe(404);
		expect(await response.text()).toBe('tile not found: /tiles/unknown/8/55/67');
	});

	it('rejects duplicate source ids', () => {
		expect(
			() =>
				new ServerClass(
					[
						{ id: 'osm', source: island },
						{ id: 'osm', source: island },
					],
					{ port: port + 1 },
				),
		).toThrow('duplicate source id: "osm"');
	});

	it('rejects an empty source list', () => {
		expect(() => new ServerClass([], { port: port + 1 })).toThrow('source not defined');
	});
});

/**
 * Sends the path verbatim: fetch() would normalize "..", "\\" and percent-encodings before sending.
 */
async function rawGet(port: number, path: string): Promise<{ status: number; body: string }> {
	return new Promise((res, rej) => {
		const socket = connect(port, '127.0.0.1', () => {
			socket.write(`GET ${path} HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n`);
		});
		const chunks: Buffer[] = [];
		socket.on('data', (chunk: Buffer) => chunks.push(chunk));
		socket.on('error', rej);
		socket.on('end', () => {
			const [head, ...body] = Buffer.concat(chunks).toString().split('\r\n\r\n');
			res({ status: parseInt(head.split(' ')[1], 10), body: body.join('\r\n\r\n') });
		});
	});
}

async function getResponseHash(response: Response): Promise<string> {
	const hasher = createHash('sha256');
	hasher.update(Buffer.from(await response.arrayBuffer()));
	return hasher.digest('base64');
}
