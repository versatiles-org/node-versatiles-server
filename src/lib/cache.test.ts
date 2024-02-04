import { resolve } from 'node:path';
import { Cache } from './cache.js';
import { readFileSync } from 'node:fs';

describe('Cache', () => {
	let staticContent: Cache;

	beforeEach(() => {
		staticContent = new Cache();
	});

	describe('constructor', () => {
		it('should create an instance', () => {
			expect(staticContent).toBeInstanceOf(Cache);
		});
	});

	describe('add method', () => {
		it('should add text content', () => {
			const path = '/text';
			const buffer = Buffer.from('Hello World');
			const mime = 'text/plain';
			staticContent.addBuffer(path, buffer, mime);
			expect(staticContent.get(path)).toEqual({ buffer, mime, compression: 'raw' });
		});

		it('should serve "/index.html" under "/"', () => {
			const path = '/index.html';
			const buffer = Buffer.from('Hello World');
			const mime = 'text/plain';
			staticContent.addBuffer(path, buffer, mime);
			expect(staticContent.get('/')).toEqual({ buffer, mime, compression: 'raw' });
		});

		it('should serve "/data/index.html" under "/data/" and "/data"', () => {
			const path = '/data/index.html';
			const buffer = Buffer.from('Hello World');
			const mime = 'text/plain';
			staticContent.addBuffer(path, buffer, mime);
			expect(staticContent.get('/data')).toEqual({ buffer, mime, compression: 'raw' });
			expect(staticContent.get('/data/')).toEqual({ buffer, mime, compression: 'raw' });
		});
	});

	describe('addFolder method', () => {
		it('should add files from a folder', () => {
			const url = '/';
			const dir = new URL('../../static', import.meta.url).pathname;
			const files = [
				'index.html',
				'assets/sprites/sprites.png',
				'assets/sprites/sprites@2x.png',
				'assets/sprites/sprites.json',
				'assets/sprites/sprites@2x.json',
			];

			const mimeTypes = new Map([
				['css', 'text/css; charset=utf-8'],
				['html', 'text/html; charset=utf-8'],
				['json', 'application/json; charset=utf-8'],
				['png', 'image/png'],
			]);

			staticContent.addFolder(url, dir);

			files.forEach((file: string) => {
				const expectedPath = url + file;
				expect(staticContent.get(expectedPath)).toEqual({
					buffer: readFileSync(resolve(dir, file)),
					mime: mimeTypes.get(file.replace(/.*\./, '')),
					compression: 'raw',
				});
			});
		});
	});
});
