/* eslint-disable @typescript-eslint/unbound-method */
import { IncomingMessage, ServerResponse } from 'http';
import { respondWithContent, respondWithError } from './response.js';
import { Socket } from 'net';
import { jest } from '@jest/globals';
import type { ContentResponse } from './types.js';
import { brotliCompressSync, gzipSync } from 'zlib';

type Compression = 'br' | 'gzip' | 'raw';

describe('Response Tests', () => {
	let mockRes: ServerResponse;

	beforeEach(() => {
		const mockSocket = new Socket();
		const mockReq = new IncomingMessage(mockSocket);
		mockRes = jest.mocked(new ServerResponse(mockReq));
		jest.spyOn(mockRes, 'setHeader');
		jest.spyOn(mockRes, 'end');
		jest.spyOn(console, 'error').mockImplementation(() => {
			return;
		});
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	describe('respond with content', () => {
		it('should set correct headers and respond with content', async () => {
			const content = { buffer: 'test', mime: 'text/plain' };
			const config = { acceptGzip: true, acceptBr: false, optimalCompression: false };

			await respondWithContent(mockRes, content, config);

			expect(mockRes.setHeader).toHaveBeenCalledWith('content-type', 'text/plain');
			expect(mockRes.statusCode).toBe(200);
			expect(mockRes.end).toHaveBeenCalledWith(Buffer.from('test'));
		});
		
		it('should set correct mime if missing', async () => {
			const content = { buffer: 'test' };
			const config = { acceptGzip: true, acceptBr: false, optimalCompression: false };

			await respondWithContent(mockRes, content, config);

			expect(mockRes.setHeader).toHaveBeenCalledWith('content-type', 'application/octet-stream');
			expect(mockRes.statusCode).toBe(200);
			expect(mockRes.end).toHaveBeenCalledWith(Buffer.from('test'));
		});
	});

	describe('respond using different compressions', () => {
		const testBuffer = Buffer.from('Governments of the Industrial World, you weary giants of flesh and steel, I come from Cyberspace, the new home of Mind.');
		const buffers: Record<Compression, Buffer> = {
			raw: Buffer.from(testBuffer),
			gzip: gzipSync(testBuffer),
			br: brotliCompressSync(testBuffer),
		};

		const cases: { buffer: Compression; accept: Compression | 'gzip+br'; optimal: boolean; result: Compression }[] = [
			// Optimal
			{ buffer: 'raw', accept: 'raw', optimal: true, result: 'raw' },
			{ buffer: 'raw', accept: 'gzip', optimal: true, result: 'gzip' },
			{ buffer: 'raw', accept: 'br', optimal: true, result: 'br' },
			{ buffer: 'raw', accept: 'gzip+br', optimal: true, result: 'br' },

			{ buffer: 'gzip', accept: 'raw', optimal: true, result: 'raw' },
			{ buffer: 'gzip', accept: 'gzip', optimal: true, result: 'gzip' },
			{ buffer: 'gzip', accept: 'br', optimal: true, result: 'br' },
			{ buffer: 'gzip', accept: 'gzip+br', optimal: true, result: 'gzip' },

			{ buffer: 'br', accept: 'raw', optimal: true, result: 'raw' },
			{ buffer: 'br', accept: 'gzip', optimal: true, result: 'gzip' },
			{ buffer: 'br', accept: 'br', optimal: true, result: 'br' },
			{ buffer: 'br', accept: 'gzip+br', optimal: true, result: 'br' },

			// Fast
			{ buffer: 'raw', accept: 'raw', optimal: false, result: 'raw' },
			{ buffer: 'raw', accept: 'gzip', optimal: false, result: 'raw' },
			{ buffer: 'raw', accept: 'br', optimal: false, result: 'raw' },
			{ buffer: 'raw', accept: 'gzip+br', optimal: false, result: 'raw' },

			{ buffer: 'gzip', accept: 'raw', optimal: false, result: 'raw' },
			{ buffer: 'gzip', accept: 'gzip', optimal: false, result: 'gzip' },
			{ buffer: 'gzip', accept: 'br', optimal: false, result: 'raw' },
			{ buffer: 'gzip', accept: 'gzip+br', optimal: false, result: 'gzip' },

			{ buffer: 'br', accept: 'raw', optimal: false, result: 'raw' },
			{ buffer: 'br', accept: 'gzip', optimal: false, result: 'raw' },
			{ buffer: 'br', accept: 'br', optimal: false, result: 'br' },
			{ buffer: 'br', accept: 'gzip+br', optimal: false, result: 'br' },
		];

		for (const { buffer, accept, optimal, result } of cases) {
			// eslint-disable-next-line @typescript-eslint/no-loop-func
			it(`${buffer} -> ${accept} (${optimal ? 'optimal' : 'fast'})`, async () => {
				const content: ContentResponse = {
					buffer: buffers[buffer],
					mime: 'text/plain',
					compression: buffer,
				};
				const config = {
					acceptGzip: (accept === 'gzip') || (accept === 'gzip+br'),
					acceptBr: (accept === 'br') || (accept === 'gzip+br'),
					optimalCompression: optimal,
				};

				await respondWithContent(mockRes, content, config);

				switch (result) {
					case 'raw':
						expect(jest.mocked(mockRes.setHeader).mock.calls).toStrictEqual([
							['content-type', 'text/plain'],
						]);
						break;
					case 'gzip':
						expect(jest.mocked(mockRes.setHeader).mock.calls).toStrictEqual([
							['content-encoding', 'gzip'],
							['content-type', 'text/plain'],
						]);
						break;
					case 'br':
						expect(jest.mocked(mockRes.setHeader).mock.calls).toStrictEqual([
							['content-encoding', 'br'],
							['content-type', 'text/plain'],
						]);
						break;
				}

				expect(mockRes.statusCode).toBe(200);
				expect(mockRes.end).toHaveBeenCalledTimes(1);
			});

		}
	});

	describe('respond with error', () => {
		it('should handle error responses', () => {
			const error = new Error('Test error');
			respondWithError(mockRes, error, 500);

			expect(console.error).toHaveBeenCalledWith(error);
			expect(mockRes.setHeader).toHaveBeenCalledWith('content-type', 'text/plain');
			expect(mockRes.statusCode).toBe(500);
			expect(mockRes.end).toHaveBeenCalledWith('Error: Test error');
		});
	});
});
