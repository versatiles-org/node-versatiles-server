import type { Compression } from '@versatiles/container';

export interface ResponseContent {
	buffer: Buffer;
	mime?: string;
	compression?: Compression;
}

export interface ResponseConfig {
	acceptGzip: boolean;
	acceptBr: boolean;
	optimalCompression: boolean;
}

export interface ServerOptions {
	baseUrl: string; // Base URL for the server (default: "http://localhost:<port>/")
	compress?: boolean; // Reduces traffic by recompressing data, but responses take longer. Perfect if behind CDN.
	glyphs: string;
	host?: string; // Hostname or IP to bind the server to', '0.0.0.0'
	port?: number; // Port to bind the server to (default: 8080)
	sprites: { id: string; url: string }[];
	static?: string; // Path to a folder with static files
	tilesUrl: string;
	tms?: boolean; // Use TMS tile order (flip y axis)
}
