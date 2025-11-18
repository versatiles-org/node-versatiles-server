import { Command } from 'commander';
import { describe, it, expect, vi, beforeEach, Mocked } from 'vitest';
import type { ServerOptions } from './lib/types.js';
import type { Server } from './lib/server.js';

//const mockedServer = vi.fn<typeof Server>().mockReturnValue(null);
vi.mock('./lib/server.js', () => ({
	Server: vi.fn(class {
		getUrl = vi.fn(() => 'https:/dingdong')
		start = vi.fn(() => Promise.resolve())
		stop = vi.fn(() => Promise.resolve())
	}),
}));
const mockedServer = (await import('./lib/server.js')).Server as unknown as Mocked<Server>;

vi.mock('process');
vi.spyOn(process, 'exit').mockImplementation(vi.fn(() => null as never));
vi.spyOn(process.stdout, 'write').mockReturnValue(true);
vi.spyOn(process.stderr, 'write').mockReturnValue(true);

vi.spyOn(Command.prototype, 'parse').mockReturnThis();

vi.mock('open', () => ({ default: vi.fn(() => null) }));
const open = (await import('open')).default;

vi.mock('./lib/log.js', () => ({
	logImportant: vi.fn(() => null),
	setLogLevel: vi.fn(() => null),
}));
const { setLogLevel } = await import('./lib/log.js');

describe('index.ts', () => {
	const defaultSource = 'test.versatiles';
	const defaultResults: Partial<ServerOptions> = {
		compress: false,
		host: '0.0.0.0',
		port: 8080,
		tms: false,
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('starts server with no arguments', async () => {
		await expect(async () => run('')).rejects.toThrow('source not defined');
	});

	it('starts server with source', async () => {
		await run(defaultSource);
		expect(open).toHaveBeenCalledTimes(0);
		expect(mockedServer).toHaveBeenCalledWith(defaultSource, { ...defaultResults });
	});

	it('starts server with baseurl', async () => {
		await run(defaultSource + ' -b https://example.org');
		expect(mockedServer).toHaveBeenCalledWith(defaultSource, { ...defaultResults, baseUrl: 'https://example.org' });
	});

	it('starts server with compress', async () => {
		await run(defaultSource + ' -c');
		expect(mockedServer).toHaveBeenCalledWith(defaultSource, { ...defaultResults, compress: true });
	});

	it('starts server with host', async () => {
		await run(defaultSource + ' -h 9.0.0.0');
		expect(mockedServer).toHaveBeenCalledWith(defaultSource, { ...defaultResults, host: '9.0.0.0' });
	});

	it('starts server with port', async () => {
		await run(defaultSource + ' -p 12345');
		expect(mockedServer).toHaveBeenCalledWith(defaultSource, { ...defaultResults, port: 12345 });
	});

	it('starts server with open', async () => {
		await run(defaultSource + ' -o');
		expect(mockedServer).toHaveBeenCalledWith(defaultSource, { ...defaultResults });
		expect(open).toHaveBeenCalledTimes(1);
		expect(open).toHaveBeenCalledWith('https:/dingdong');
	});

	it('starts server with static', async () => {
		await run(defaultSource + ' -s /folder');
		expect(mockedServer).toHaveBeenCalledWith(defaultSource, { ...defaultResults, static: '/folder' });
	});

	it('starts server with tms', async () => {
		await run(defaultSource + ' -t');
		expect(mockedServer).toHaveBeenCalledWith(defaultSource, { ...defaultResults, tms: true });
	});

	it('starts server with quiet logging 1/2', async () => {
		await run(defaultSource + ' -q');
		expect(setLogLevel).toHaveBeenCalledWith(0);
	});

	it('starts server with quiet logging 2/2', async () => {
		await run(defaultSource + ' -qv');
		expect(setLogLevel).toHaveBeenCalledWith(0);
	});

	it('starts server with normal logging', async () => {
		await run(defaultSource);
		expect(setLogLevel).toHaveBeenCalledWith(1);
	});

	it('starts server with verbose logging', async () => {
		await run(defaultSource + ' -v');
		expect(setLogLevel).toHaveBeenCalledWith(2);
	});

	it('starts server with very verbose logging', async () => {
		await run(defaultSource + ' -vv');
		expect(setLogLevel).toHaveBeenCalledWith(3);
	});

	async function run(args: string): Promise<void> {
		const moduleUrl = './index.js?t=' + Math.random().toString(16).slice(2);
		const module = await import(moduleUrl);

		const program = (module.program) as Command;
		await program.parseAsync(['./node', './index.ts', ...args.split(' ').filter(a => a)]);
	}
});
