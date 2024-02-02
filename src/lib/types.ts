import type { Compression, Format } from '@versatiles/container';

export interface ContentResponse {
	buffer: Buffer | string;
	mime?: string;
	compression?: Compression;
}

export interface ResponseConfig {
	acceptGzip: boolean;
	acceptBr: boolean;
	optimalCompression: boolean;
}

export interface ServerOptions {
	compress?: boolean;
	baseUrl?: string;
	glyphsUrl?: string;
	spriteUrl?: string;
	tilesUrl?: string;
	host?: string;
	port?: number;
	tms?: boolean;
}

export interface ContainerInfo {
	header: {
		tileFormat: Format;
		bbox: [number, number, number, number];
	};
	metadata?: string;
}
