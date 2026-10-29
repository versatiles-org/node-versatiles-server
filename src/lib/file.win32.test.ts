import { vi, describe, it, expect, beforeEach } from 'vitest';

// Run getFileContent with Windows path semantics on every OS, where "\" separates folders and "C:" starts a path.
vi.mock('path', async () => {
	const { win32 } = await vi.importActual<typeof import('path')>('path');
	return { ...win32, default: win32 };
});
vi.mock('fs', () => ({
	existsSync: vi.fn(() => true),
}));
vi.mock('fs/promises', () => ({
	readFile: vi.fn(async (filename: string) => Promise.resolve(`readFile(${filename})`)),
	stat: vi.fn(async () => Promise.resolve({ isDirectory: () => false })),
}));

const { getFileContent } = await import('./file.js');
const { readFile } = await import('fs/promises');

describe('getFileContent with Windows paths', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('reads files inside the static folder', async () => {
		const result = await getFileContent('C:\\srv\\static', '/sub/file.txt');
		expect(result?.buffer).toBe('readFile(C:\\srv\\static\\sub\\file.txt)');
	});

	for (const path of [
		'/..\\static-secret\\file.txt',
		'/../static-secret/file.txt',
		'/C:/Windows/win.ini',
		'/D:/secret.txt',
		'/sub/..\\..\\file.txt',
	]) {
		it(`refuses ${path}`, async () => {
			expect(await getFileContent('C:\\srv\\static', path)).toBeUndefined();
			expect(vi.mocked(readFile).mock.calls).toStrictEqual([]);
		});
	}
});
