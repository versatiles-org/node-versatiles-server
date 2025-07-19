import { existsSync } from 'fs';
import { readFile, stat } from 'fs/promises';
import { resolve } from 'path';
import type { ResponseContent } from './types.js';
import { getMimeByFilename } from './mime_types.js';

export async function getFileContent(staticFolder: string, path: string): Promise<ResponseContent | undefined> {
	let filename = resolve(staticFolder, path.replace(/^\/+/, ''));

	if (!filename.startsWith(staticFolder)) return;

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
