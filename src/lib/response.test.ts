/* eslint-disable @typescript-eslint/unbound-method */
import { IncomingMessage, ServerResponse } from 'http';
import { respondWithContent, respondWithError } from './response.js';
import { Socket } from 'net';
import { jest } from '@jest/globals';

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

	describe('respondWithContent', () => {
		it('should set correct headers and respond with content', async () => {
			const content = { buffer: 'test', mime: 'text/plain' };
			const config = { acceptGzip: true, acceptBr: false, recompress: false };

			await respondWithContent(mockRes, content, config);

			expect(mockRes.setHeader).toHaveBeenCalledWith('content-type', 'text/plain');
			expect(mockRes.statusCode).toBe(200);
			expect(mockRes.end).toHaveBeenCalledWith(Buffer.from('test'));
		});

		// Add more tests for different compression types and settings
	});

	describe('respondWithError', () => {
		it('should handle error responses', () => {
			const error = new Error('Test error');
			respondWithError(mockRes, error, 500);

			expect(console.error).toHaveBeenCalledWith(error);
			expect(mockRes.setHeader).toHaveBeenCalledWith('content-type', 'text/plain');
			expect(mockRes.statusCode).toBe(500);
			expect(mockRes.end).toHaveBeenCalledWith('Error: Test error');
		});

		// Add more tests for different error cases
	});
});
