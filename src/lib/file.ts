import { existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { resolve } from 'node:path';

export async function findFile(staticFolder: string, path: string): Promise<string | undefined> {
	let filename = resolve(staticFolder, path.replace(/^\/+/, ''));

	if (!filename.startsWith(staticFolder)) return;

	if (!existsSync(filename)) return;

	if ((await stat(filename)).isDirectory()) {
		filename = resolve(filename, 'index.html');
		if (!existsSync(filename)) return;
	}
	
	return filename;
}
