/**
 * Smoke test of the published package: packs it, installs the tarball into a temporary folder whose path
 * contains a space, starts the installed CLI and checks that the frontend, a style and a tile are served.
 *
 * Usage: npm run test-smoke (after npm run build-node)
 */
import { spawn, spawnSync } from 'child_process';
import type { SpawnSyncOptions } from 'child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { createServer } from 'net';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const IS_WINDOWS = process.platform === 'win32';

const tempDir = mkdtempSync(join(tmpdir(), 'versatiles smoke '));
let exitCode = 0;

try {
	console.log(`installing package into "${tempDir}"`);
	const packed = run('npm pack --ignore-scripts --json --pack-destination', [tempDir], { cwd: ROOT });
	// npm < 12 prints an array, newer versions an object keyed by package name.
	const [{ filename }] = Object.values(JSON.parse(packed) as Record<string, { filename: string }>);
	const tarball = join(tempDir, filename);
	writeFileSync(join(tempDir, 'package.json'), '{ "private": true }');
	run('npm install --no-audit --no-fund', [tarball], { cwd: tempDir });

	console.log('checking the installed bin');
	const bin = join(tempDir, 'node_modules', '.bin', IS_WINDOWS ? 'versatiles-server.cmd' : 'versatiles-server');
	if (!run('', [bin, '--help'], { cwd: tempDir }).includes('Usage: versatiles-server')) {
		throw Error('unexpected --help output');
	}

	console.log('starting the installed server');
	const port = await getFreePort();
	const entry = join(tempDir, 'node_modules', '@versatiles', 'server', 'dist', 'index.js');
	const server = spawn(process.execPath, [entry, '-p', String(port), resolve(ROOT, 'testdata/island.versatiles')], {
		cwd: tempDir,
		stdio: ['ignore', 'pipe', 'inherit'],
	});

	try {
		await waitForOutput(server, 'listening on port', 20000);

		const baseUrl = `http://127.0.0.1:${port}`;
		await check(`${baseUrl}/`, 'text/html', (body) => body.includes('<html'));
		await check(`${baseUrl}/tiles/index.json`, 'application/json', (body) => body === '["default"]');
		await check(`${baseUrl}/tiles/default/style.json`, 'application/json', (body) => 'sources' in JSON.parse(body));
		await check(`${baseUrl}/tiles/default/8/55/67`, 'application/vnd.mapbox-vector-tile', (body) => body.length > 0);
		await check(`${baseUrl}/assets/glyphs/index.json`, 'application/json', (body) => body.length > 0);
	} finally {
		server.kill();
	}

	console.log('smoke test passed');
} catch (error) {
	console.error('smoke test failed:', error);
	exitCode = 1;
} finally {
	rmSync(tempDir, { recursive: true, force: true });
}

process.exit(exitCode);

/**
 * Runs a command and returns its stdout. The arguments are quoted, because temporary paths contain spaces.
 * A shell is needed on Windows to run npm and .cmd files.
 */
function run(command: string, args: string[], options: SpawnSyncOptions): string {
	const line = [command, ...args.map((arg) => `"${arg}"`)].filter(Boolean).join(' ');
	const result = spawnSync(line, { ...options, shell: true, encoding: 'utf8' });
	if (result.status !== 0) throw Error(`"${line}" failed:\n${String(result.stdout)}\n${String(result.stderr)}`);
	return String(result.stdout);
}

async function getFreePort(): Promise<number> {
	return new Promise((res, rej) => {
		const probe = createServer();
		probe.on('error', rej);
		probe.listen(0, '127.0.0.1', () => {
			const address = probe.address();
			probe.close(() => {
				if (address == null || typeof address === 'string') rej(Error('no port'));
				else res(address.port);
			});
		});
	});
}

async function waitForOutput(child: ReturnType<typeof spawn>, text: string, timeout: number): Promise<void> {
	return new Promise((res, rej) => {
		let output = '';
		const timer = setTimeout(() => rej(Error(`timeout waiting for "${text}", got:\n${output}`)), timeout);
		child.stdout?.on('data', (chunk: Buffer) => {
			output += chunk.toString();
			if (output.includes(text)) {
				clearTimeout(timer);
				res();
			}
		});
		child.on('exit', (code) => {
			clearTimeout(timer);
			rej(Error(`server exited with code ${code}:\n${output}`));
		});
	});
}

async function check(url: string, mime: string, isValid: (body: string) => boolean): Promise<void> {
	const response = await fetch(url);
	const body = await response.text();
	const contentType = response.headers.get('content-type') ?? '';
	if (response.status !== 200 || !contentType.startsWith(mime) || !isValid(body)) {
		throw Error(`unexpected response for ${url}: ${response.status} ${contentType}\n${body.slice(0, 200)}`);
	}
	console.log(`  ok ${url}`);
}
