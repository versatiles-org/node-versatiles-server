// Import the function to test
import { jest } from '@jest/globals';

// Mock the `node:fs` and `node:fs/promises` modules
jest.unstable_mockModule('node:fs', () => ({
	existsSync: jest.fn(),
}));
jest.unstable_mockModule('node:fs/promises', () => ({
	// @ts-expect-error: too lazy to fix this
	readFile: jest.fn().mockImplementation(async (filename: string) => Promise.resolve(`readFile(${filename})`)),
	stat: jest.fn(),
}));

// Get the mocked functions
const { getFileContent } = await import('./file.js');
const { existsSync } = await import('node:fs');
const { readFile, stat } = await import('node:fs/promises');

describe('getFileContent', () => {
	beforeEach(() => {
		// Clear all mocks before each test
		jest.clearAllMocks();
	});

	it('returns undefined for paths not starting with static folder', async () => {
		const result = await getFileContent('/static', '../outside/path');
		expect(jest.mocked(existsSync).mock.calls).toStrictEqual([]);
		expect(jest.mocked(stat).mock.calls).toStrictEqual([]);
		expect(jest.mocked(readFile).mock.calls).toStrictEqual([]);
		expect(result).toBeUndefined();
	});

	it('returns undefined if the file does not exist', async () => {
		jest.mocked(existsSync).mockReturnValue(false);
		const result = await getFileContent('/static', '/test/file.txt');
		expect(jest.mocked(existsSync).mock.calls).toStrictEqual([['/static/test/file.txt']]);
		expect(jest.mocked(stat).mock.calls).toStrictEqual([]);
		expect(jest.mocked(readFile).mock.calls).toStrictEqual([]);
		expect(result).toBeUndefined();
	});

	it('returns the file path if the file exists and is not a directory', async () => {
		jest.mocked(existsSync).mockReturnValue(true);
		// @ts-expect-error: too lazy to fix this
		jest.mocked(stat).mockResolvedValue({ isDirectory: () => false });
		const result = await getFileContent('/static', '/test/file.txt');
		expect(jest.mocked(existsSync).mock.calls).toStrictEqual([['/static/test/file.txt']]);
		expect(jest.mocked(stat).mock.calls).toStrictEqual([['/static/test/file.txt']]);
		expect(jest.mocked(readFile).mock.calls).toStrictEqual([['/static/test/file.txt']]);
		expect(result).toStrictEqual({ buffer: 'readFile(/static/test/file.txt)', compression: 'raw', mime: 'application/octet-stream' });
	});

	it('returns index.html path for directories', async () => {
		// @ts-expect-error: too lazy to fix this
		jest.mocked(stat).mockResolvedValue({ isDirectory: () => true });

		jest.mocked(existsSync)
			.mockReturnValueOnce(true) // True for directory existence
			.mockReturnValueOnce(true); // False for index.html existence

		const result = await getFileContent('/static', '/test/directory');
		expect(jest.mocked(existsSync).mock.calls).toStrictEqual([['/static/test/directory'], ['/static/test/directory/index.html']]);
		expect(jest.mocked(stat).mock.calls).toStrictEqual([['/static/test/directory']]);
		expect(jest.mocked(readFile).mock.calls).toStrictEqual([['/static/test/directory/index.html']]);
		expect(result).toStrictEqual({ buffer: 'readFile(/static/test/directory/index.html)', compression: 'raw', mime: 'text/html; charset=utf-8' });
	});

	it('returns undefined for directories without an index.html', async () => {
		jest.mocked(existsSync)
			.mockReturnValueOnce(true) // True for directory existence
			.mockReturnValueOnce(false); // False for index.html existence
		// @ts-expect-error: too lazy to fix this
		jest.mocked(stat).mockResolvedValue({ isDirectory: () => true });
		const result = await getFileContent('/static', '/test/directory');
		expect(jest.mocked(existsSync).mock.calls).toStrictEqual([['/static/test/directory'], ['/static/test/directory/index.html']]);
		expect(jest.mocked(stat).mock.calls).toStrictEqual([['/static/test/directory']]);
		expect(jest.mocked(readFile).mock.calls).toStrictEqual([]);
		expect(result).toBeUndefined();
	});
});
