#!/usr/bin/env node

import { Command } from 'commander';
import type { ServerOptions } from './lib/types.js';
import open from 'open';
import { Server } from './lib/server.js';
import { resolve } from 'path';
import { logImportant, setLogLevel } from './lib/log.js';

/**
 * Entry script for the VersaTiles server command-line application.
 * Utilizes the commander.js library to parse command-line arguments and options,
 * sets up the server based on these options, and optionally opens the server URL in a web browser.
 */
export const program = new Command();

program
	.showHelpAfterError()
	.name('versatiles-server')
	.description('Simple VersaTiles server')
	.option('-b, --base-url <url>', 'Base URL for the server (default: "http://localhost:<port>/")')
	.option('-c, --compress', 'Reduces traffic by recompressing data, but responses take longer. Perfect if behind CDN.')
	.option('-h, --host <hostnameip>', 'Hostname or IP to bind the server to', '0.0.0.0')
	.option('-o, --open', 'Open map in web browser')
	.option('-p, --port <port>', 'Port to bind the server to (default: 8080)')
	.option('-q, --quiet', 'be quiet')
	.option('-s, --static <folder>', 'Path to a folder with static files')
	.option('-t, --tms', 'Use TMS tile order (flip y axis)')
	.option('-v, --verbose', 'be verbose', (_, previous) => previous + 1, 0)
	.argument('<source>', 'VersaTiles container, can be a URL or filename of a "*.versatiles" file')
	.action(async (source: string, cmdOptions: Record<string, unknown>) => {
		const srvOptions: Partial<ServerOptions> = {
			baseUrl: cmdOptions.baseUrl as string | undefined,
			compress: Boolean(cmdOptions.compress),
			host: String(cmdOptions.host ?? '0.0.0.0'),
			port: Number(cmdOptions.port ?? 8080),
			static: cmdOptions.static != null ? resolve(process.cwd(), cmdOptions.static as string) : undefined,
			tms: Boolean(cmdOptions.tms),
		};

		setLogLevel(cmdOptions.quiet ? 0 : Number(cmdOptions.verbose ?? 0) + 1);

		if (!source) throw Error('source not defined');

		try {
			const server = new Server(source, srvOptions);
			void server.start();

			if (cmdOptions.open) {
				console.log('Opening web browser...');
				await open(server.getUrl());
			}
		} catch (error: unknown) {
			const errorMessage = String((typeof error == 'object' && error != null && 'message' in error) ? error.message : error);
			logImportant(`Error starting the server: ${errorMessage}`);
			process.exit(1);
		}
	});

program.parse();
