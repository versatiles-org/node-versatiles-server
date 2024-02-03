import { resolve } from 'node:path';
import { StaticContent } from './static_content.js';
import { readFileSync } from 'node:fs';

describe('StaticContent', () => {
	let staticContent: StaticContent;

	beforeEach(() => {
		staticContent = new StaticContent();
	});

	describe('constructor', () => {
		it('should create an instance', () => {
			expect(staticContent).toBeInstanceOf(StaticContent);
		});
	});

	describe('add method', () => {
		it('should add text content', () => {
			const path = '/text';
			const content = Buffer.from('Hello World');
			const mime = 'text/plain';
			staticContent.addFile(path, content, mime);
			expect(staticContent.get(path)).toEqual({ content, mime, compression: 'raw' });
		});

		it('should serve "/index.html" under "/"', () => {
			const path = '/index.html';
			const content = Buffer.from('Hello World');
			const mime = 'text/plain';
			staticContent.addFile(path, content, mime);
			expect(staticContent.get('/')).toEqual({ content, mime, compression: 'raw' });
		});

		it('should serve "/data/index.html" under "/data/" and "/data"', () => {
			const path = '/data/index.html';
			const content = Buffer.from('Hello World');
			const mime = 'text/plain';
			staticContent.addFile(path, content, mime);
			expect(staticContent.get('/data')).toEqual({ content, mime, compression: 'raw' });
			expect(staticContent.get('/data/')).toEqual({ content, mime, compression: 'raw' });
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
					content: readFileSync(resolve(dir, file)),
					mime: mimeTypes.get(file.replace(/.*\./, '')),
					compression: 'raw',
				});
			});
		});
	});
});
