import { jest } from '@jest/globals';

jest.unstable_mockModule('./log.js', () => ({
	logImportant: jest.fn(),
}));
const { logImportant } = await import('./log.js');
const { getMimeByFilename } = await import('./mime_types.js');

describe('MIME Type Tests', () => {
	describe('getMimeByFilename', () => {
		it('should return the correct MIME type for valid filenames', () => {
			expect(getMimeByFilename('image.avif')).toBe('image/avif');
			expect(getMimeByFilename('data.bin')).toBe('application/octet-stream');
			expect(getMimeByFilename('style.css')).toBe('text/css; charset=utf-8');
			expect(getMimeByFilename('data.geojson')).toBe('application/geo+json; charset=utf-8');
			expect(getMimeByFilename('index.htm')).toBe('text/html; charset=utf-8');
			expect(getMimeByFilename('index.html')).toBe('text/html; charset=utf-8');
			expect(getMimeByFilename('image.jpeg')).toBe('image/jpeg');
			expect(getMimeByFilename('image.jpg')).toBe('image/jpeg');
			expect(getMimeByFilename('script.js')).toBe('text/javascript; charset=utf-8');
			expect(getMimeByFilename('data.json')).toBe('application/json; charset=utf-8');
			expect(getMimeByFilename('data.pbf')).toBe('application/x-protobuf');
			expect(getMimeByFilename('image.png')).toBe('image/png');
			expect(getMimeByFilename('image.svg')).toBe('image/svg+xml; charset=utf-8');
			expect(getMimeByFilename('data.topojson')).toBe('application/topo+json; charset=utf-8');
			expect(getMimeByFilename('image.webp')).toBe('image/webp');
		});

		it('should return default MIME type for filenames with invalid extensions', () => {
			jest.mocked(logImportant).mockClear();
			expect(getMimeByFilename('file.unknown', true)).toBe('application/octet-stream');
			expect(logImportant).toHaveBeenCalledWith('Error: can not guess MIME for file: file.unknown');
		});

		it('should handle filenames with no extension', () => {
			expect(getMimeByFilename('file')).toBe('application/octet-stream');
		});

		it('should be case insensitive for extensions', () => {
			expect(getMimeByFilename('IMAGE.toPOjSOn')).toBe('application/topo+json; charset=utf-8');
		});
	});
});
