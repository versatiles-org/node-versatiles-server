
import zlib from 'zlib';

/**
 * Compresses data using Gzip with maximum compression level.
 * @param dataIn - The input data as a Buffer to be compressed.
 * @returns A Promise that resolves to the Gzip-compressed Buffer.
 */
export async function gzip(dataIn: Buffer): Promise<Buffer> {
	return new Promise((res, rej) => {
		zlib.gzip(dataIn, { level: 9 }, (err, dataOut) => {
			if (err) {
				rej(err);
				return;
			}
			res(dataOut);
		});
	},
	);
}

/**
 * Decompresses Gzip-compressed data.
 * @param dataIn - The Gzip-compressed data as a Buffer to be decompressed.
 * @returns A Promise that resolves to the decompressed Buffer.
 */
export async function ungzip(dataIn: Buffer): Promise<Buffer> {
	return new Promise((res, rej) => {
		zlib.gunzip(dataIn, (err, dataOut) => {
			if (err) {
				rej(err);
				return;
			}
			res(dataOut);
		});
	},
	);
}

/**
 * Compresses data using Brotli with maximum quality parameter.
 * @param dataIn - The input data as a Buffer to be compressed.
 * @returns A Promise that resolves to the Brotli-compressed Buffer.
 */
export async function brotli(dataIn: Buffer): Promise<Buffer> {
	return new Promise((res, rej) => {
		zlib.brotliCompress(dataIn, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 } }, (err, dataOut) => {
			if (err) {
				rej(err);
				return;
			}
			res(dataOut);
		});
	},
	);
}

/**
 * Decompresses Brotli-compressed data.
 * @param dataIn - The Brotli-compressed data as a Buffer to be decompressed.
 * @returns A Promise that resolves to the decompressed Buffer.
 */
export async function unbrotli(dataIn: Buffer): Promise<Buffer> {
	return new Promise((res, rej) => {
		zlib.brotliDecompress(dataIn, (err, dataOut) => {
			if (err) {
				rej(err);
				return;
			}
			res(dataOut);
		});
	},
	);
}
