#!/usr/bin/env node

import { Command } from 'commander';
import type { ServerOptions } from './lib/types.js';
import open from 'open';
import { Server } from './lib/server.js';

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
	.option('-t, --tms', 'Use TMS tile order (flip y axis)')
	.argument('<source>', 'VersaTiles container, can be a URL or filename of a "*.versatiles" file')
	.action(async (source: string, cmdOptions: Record<string, unknown>) => {
		const srvOptions: ServerOptions = {
			baseUrl: cmdOptions.baseUrl as string | undefined,
			compress: Boolean(cmdOptions.compress),
			host: String(cmdOptions.host ?? '0.0.0.0'),
			port: Number(cmdOptions.port ?? 8080),
			tms: Boolean(cmdOptions.tms),
		};

		if (!source) throw Error('source not defined');

		try {
			const server = new Server(source, srvOptions);
			void server.start();

			if (Boolean(cmdOptions.open)) {
				await open(server.getUrl());
			}
		} catch (error: unknown) {
			const errorMessage = String((typeof error == 'object' && error != null && 'message' in error) ? error.message : error);
			console.error(`Error starting the server: ${errorMessage}`);
			process.exit(1);
		}
	});

if (process.env.NODE_ENV !== 'test') {
	program.parse();
}
