// Import the function to test
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { resolve } from 'path';

// Mock the `fs` and `fs/promises` modules
vi.mock('fs', () => ({
	existsSync: vi.fn(),
}));
vi.mock('fs/promises', () => ({
	readFile: vi.fn().mockImplementation(async (filename: string) => Promise.resolve(`readFile(${filename})`)),
	stat: vi.fn(),
}));

// Get the mocked functions
const { getFileContent } = await import('./file.js');
const { existsSync } = await import('fs');
const { readFile, stat } = await import('fs/promises');

describe('getFileContent', () => {
	// Expected paths are platform-specific, e.g. "C:\\static\\test" on Windows.
	const path = (...segments: string[]): string => resolve('/static', ...segments);

	beforeEach(() => {
		// Clear all mocks before each test
		vi.clearAllMocks();
	});

	it('returns undefined for paths not starting with static folder', async () => {
		const result = await getFileContent('/static', '../outside/path');
		expect(vi.mocked(existsSync).mock.calls).toStrictEqual([]);
		expect(vi.mocked(stat).mock.calls).toStrictEqual([]);
		expect(vi.mocked(readFile).mock.calls).toStrictEqual([]);
		expect(result).toBeUndefined();
	});

	it('returns undefined for sibling folders sharing the static folder prefix', async () => {
		const result = await getFileContent('/static', '/../static-secret/file.txt');
		expect(vi.mocked(existsSync).mock.calls).toStrictEqual([]);
		expect(result).toBeUndefined();
	});

	it('returns undefined for paths containing backslashes or null bytes', async () => {
		expect(await getFileContent('/static', '/..\\static-secret\\file.txt')).toBeUndefined();
		expect(await getFileContent('/static', '/file.txt\0')).toBeUndefined();
		expect(vi.mocked(existsSync).mock.calls).toStrictEqual([]);
	});

	it('returns undefined for hidden files and folders', async () => {
		expect(await getFileContent('/static', '/.env')).toBeUndefined();
		expect(await getFileContent('/static', '/.git/config')).toBeUndefined();
		expect(await getFileContent('/static', '/sub/.DS_Store')).toBeUndefined();
		expect(vi.mocked(existsSync).mock.calls).toStrictEqual([]);
	});

	it('returns undefined if the file does not exist', async () => {
		vi.mocked(existsSync).mockReturnValue(false);
		const result = await getFileContent('/static', '/test/file.txt');
		expect(vi.mocked(existsSync).mock.calls).toStrictEqual([[path('test/file.txt')]]);
		expect(vi.mocked(stat).mock.calls).toStrictEqual([]);
		expect(vi.mocked(readFile).mock.calls).toStrictEqual([]);
		expect(result).toBeUndefined();
	});

	it('returns the file path if the file exists and is not a directory', async () => {
		vi.mocked(existsSync).mockReturnValue(true);
		// @ts-expect-error: too lazy to fix this
		vi.mocked(stat).mockResolvedValue({ isDirectory: () => false });
		const result = await getFileContent('/static', '/test/file.txt');
		expect(vi.mocked(existsSync).mock.calls).toStrictEqual([[path('test/file.txt')]]);
		expect(vi.mocked(stat).mock.calls).toStrictEqual([[path('test/file.txt')]]);
		expect(vi.mocked(readFile).mock.calls).toStrictEqual([[path('test/file.txt')]]);
		expect(result).toStrictEqual({
			buffer: `readFile(${path('test/file.txt')})`,
			compression: 'raw',
			mime: 'application/octet-stream',
		});
	});

	it('returns index.html path for directories', async () => {
		// @ts-expect-error: too lazy to fix this
		vi.mocked(stat).mockResolvedValue({ isDirectory: () => true });

		vi.mocked(existsSync)
			.mockReturnValueOnce(true) // True for directory existence
			.mockReturnValueOnce(true); // False for index.html existence

		const result = await getFileContent('/static', '/test/directory');
		expect(vi.mocked(existsSync).mock.calls).toStrictEqual([
			[path('test/directory')],
			[path('test/directory/index.html')],
		]);
		expect(vi.mocked(stat).mock.calls).toStrictEqual([[path('test/directory')]]);
		expect(vi.mocked(readFile).mock.calls).toStrictEqual([[path('test/directory/index.html')]]);
		expect(result).toStrictEqual({
			buffer: `readFile(${path('test/directory/index.html')})`,
			compression: 'raw',
			mime: 'text/html; charset=utf-8',
		});
	});

	it('returns undefined for directories without an index.html', async () => {
		vi.mocked(existsSync)
			.mockReturnValueOnce(true) // True for directory existence
			.mockReturnValueOnce(false); // False for index.html existence
		// @ts-expect-error: too lazy to fix this
		vi.mocked(stat).mockResolvedValue({ isDirectory: () => true });
		const result = await getFileContent('/static', '/test/directory');
		expect(vi.mocked(existsSync).mock.calls).toStrictEqual([
			[path('test/directory')],
			[path('test/directory/index.html')],
		]);
		expect(vi.mocked(stat).mock.calls).toStrictEqual([[path('test/directory')]]);
		expect(vi.mocked(readFile).mock.calls).toStrictEqual([]);
		expect(result).toBeUndefined();
	});
});
