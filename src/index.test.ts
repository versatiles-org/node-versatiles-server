/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import type { Command } from 'commander';
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

jest.unstable_mockModule('open', () => ({ default: jest.fn<typeof open>() }));
const open = (await import('open')).default;

jest.spyOn(process.stdout, 'write').mockReturnValue(true);
jest.spyOn(process.stderr, 'write').mockReturnValue(true);

describe('index.ts', () => {
	const defaultSource = 'test.versatiles';
	const defaultResults: ServerOptions = {
		baseUrl: undefined,
		compress: false,
		host: '0.0.0.0',
		port: 8080,
		tms: false,
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	test('starts server with no arguments', async () => {
		await expect(async () => run('')).rejects.toThrow('source not defined');
	});

	test('starts server with source', async () => {
		await run(defaultSource);
		expect(open).toHaveBeenCalledTimes(0);
		expect(mockedServer).toHaveBeenCalledWith(defaultSource, { ...defaultResults });
	});

	test('starts server with baseurl', async () => {
		await run(defaultSource + ' -b https://example.org');
		expect(mockedServer).toHaveBeenCalledWith(defaultSource, { ...defaultResults, baseUrl: 'https://example.org' });
	});

	test('starts server with fast', async () => {
		await run(defaultSource + ' -c');
		expect(mockedServer).toHaveBeenCalledWith(defaultSource, { ...defaultResults, compress: true });
	});

	test('starts server with host', async () => {
		await run(defaultSource + ' -h 9.0.0.0');
		expect(mockedServer).toHaveBeenCalledWith(defaultSource, { ...defaultResults, host: '9.0.0.0' });
	});

	test('starts server with port', async () => {
		await run(defaultSource + ' -p 12345');
		expect(mockedServer).toHaveBeenCalledWith(defaultSource, { ...defaultResults, port: 12345 });
	});

	test('starts server with tms', async () => {
		await run(defaultSource + ' -t');
		expect(mockedServer).toHaveBeenCalledWith(defaultSource, { ...defaultResults, tms: true });
	});

	test('starts server with open', async () => {
		await run(defaultSource + ' -o');
		expect(mockedServer).toHaveBeenCalledWith(defaultSource, { ...defaultResults });
		expect(open).toHaveBeenCalledTimes(1);
		expect(open).toHaveBeenCalledWith('https:/dingdong');
	});

	async function run(args: string): Promise<void> {
		const moduleUrl = './index.js?t=' + Math.random();
		const module = await import(moduleUrl);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		const program = (module.program) as Command;
		await program.parseAsync(['./node', './index.ts', ...args.split(' ').filter(a => a)]);
	}
});
