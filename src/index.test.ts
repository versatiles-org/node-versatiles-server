 
 

import { Command } from 'commander';
import { jest } from '@jest/globals';
import type { ServerOptions } from './lib/types.js';
import type { Server } from './lib/server.js';

//const mockedServer = jest.fn<typeof Server>().mockReturnValue(null);
jest.unstable_mockModule('./lib/server.js', () => ({
	Server: jest.fn().mockImplementation(() => ({
		getUrl: jest.fn<() => string>().mockReturnValue('https:/dingdong'),
		start: jest.fn<() => Promise<void>>(),
		stop: jest.fn<() => Promise<void>>(),
	})),
}));
const mockedServer = (await import('./lib/server.js')).Server as unknown as jest.Mocked<Server>;

jest.mock('node:process');
jest.spyOn(process, 'exit').mockImplementation(jest.fn<typeof process.exit>());
jest.spyOn(process.stdout, 'write').mockReturnValue(true);
jest.spyOn(process.stderr, 'write').mockReturnValue(true);

jest.spyOn(Command.prototype, 'parse').mockReturnThis();

jest.unstable_mockModule('open', () => ({ default: jest.fn<typeof open>() }));
const open = (await import('open')).default;

jest.unstable_mockModule('./lib/log.js', () => ({
	logImportant: jest.fn(),
	setLogLevel: jest.fn(),
}));
const { setLogLevel } = await import('./lib/log.js');

describe('index.ts', () => {
	const defaultSource = 'test.versatiles';
	const defaultResults: ServerOptions = {
		baseUrl: undefined,
		cache: true,
		compress: false,
		host: '0.0.0.0',
		port: 8080,
		static: undefined,
		tms: false,
	};

	beforeEach(() => {
		jest.clearAllMocks();
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

	it('starts server without cache', async () => {
		await run(defaultSource + ' -n');
		expect(mockedServer).toHaveBeenCalledWith(defaultSource, { ...defaultResults, cache: false });
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
		const moduleUrl = './index.js?t=' + Math.random();
		const module = await import(moduleUrl);
		 
		const program = (module.program) as Command;
		await program.parseAsync(['./node', './index.ts', ...args.split(' ').filter(a => a)]);
	}
});
