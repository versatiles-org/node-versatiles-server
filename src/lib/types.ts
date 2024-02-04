import type { Compression, Format } from '@versatiles/container';

export interface ContentResponse {
	content: Buffer;
	mime?: string;
	compression?: Compression;
}

export interface ResponseConfig {
	acceptGzip: boolean;
	acceptBr: boolean;
	optimalCompression: boolean;
}

export interface ServerOptions {
	baseUrl?: string; // Base URL for the server (default: "http://localhost:<port>/")
	compress?: boolean; // Reduces traffic by recompressing data, but responses take longer. Perfect if behind CDN.
	glyphsUrl?: string;
	host?: string; // Hostname or IP to bind the server to', '0.0.0.0'
	cache?: boolean; // enable cache, otherwise serve static files directly from disc
	port?: number; // Port to bind the server to (default: 8080)
	spriteUrl?: string;
	static?: string; // Path to a folder with static files
	tilesUrl?: string;
	tms?: boolean; // Use TMS tile order (flip y axis)
}

export interface ContainerInfo {
	header: {
		tileFormat: Format;
		bbox: [number, number, number, number];
	};
	metadata?: string;
}
