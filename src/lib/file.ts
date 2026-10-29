import { existsSync } from 'fs';
import { readFile, stat } from 'fs/promises';
import { isAbsolute, relative, resolve, sep } from 'path';
import type { ResponseContent } from './types.js';
import { getMimeByFilename } from './mime_types.js';

export async function getFileContent(staticFolder: string, path: string): Promise<ResponseContent | undefined> {
	// Backslashes would act as path separators on Windows, null bytes are never valid.
	if (/[\\\0]/.test(path)) return;

	// Never expose hidden files or folders such as ".env" or ".git".
	if (/(^|\/)\./.test(path)) return;

	let filename = resolve(staticFolder, path.replace(/^\/+/, ''));

	// Must stay inside the folder: a plain prefix check would also accept siblings like "<folder>-secret".
	const rel = relative(staticFolder, filename);
	if (rel === '..' || rel.startsWith('..' + sep) || isAbsolute(rel)) return;

	if (!existsSync(filename)) return;

	if ((await stat(filename)).isDirectory()) {
		filename = resolve(filename, 'index.html');
		if (!existsSync(filename)) return;
	}

	return {
		buffer: await readFile(filename),
		compression: 'raw',
		mime: getMimeByFilename(filename),
	};
}
