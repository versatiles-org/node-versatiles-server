import { Layer } from './layer.js';


describe('Layer class', () => {
	const filename = new URL('../../testdata/island.versatiles', import.meta.url).pathname;
	const layer: Layer = new Layer(filename);
	const expectedHeader = {
		tileFormat: 'pbf',
		tileCompression: 'br',
		magic: 'versatiles_v02',
		version: 'v02',
		zoomMax: 14,
		zoomMin: 8,
	};

	describe('constructor', () => {
		it('should initialize the Layer instance correctly', () => {
			const tempLayer = new Layer(filename);
			expect(tempLayer).toBeDefined();
		});
	});

	describe('getTileFunction', () => {
		it('should return a function that fetches tiles correctly', async () => {
			const tileFunc = await layer.getTileFunction();
			expect(typeof tileFunc).toBe('function');

			const tileResponse = await tileFunc(8, 55, 67);
			expect(tileResponse).toBeDefined();
			expect(tileResponse?.content.length).toBe(3548);
			expect(tileResponse?.mime).toBe('application/x-protobuf');
			expect(tileResponse?.compression).toBe('br');
		});

		it('should handle null response for non-existent tiles', async () => {
			const tileFunc = await layer.getTileFunction();
			expect(await tileFunc(1, 2, 3)).toBeNull();
		});
	});

	describe('getInfo', () => {
		it('should return the correct container info', async () => {
			const info = await layer.getInfo();
			expect(info).toBeDefined();
			expect(info.header).toMatchObject(expectedHeader);

			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const metadata = JSON.parse(info.metadata ?? '');
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			expect(metadata?.vector_layers?.length).toBe(26);
		});
	});

	describe('getStyle', () => {
		it('should generate the correct style string', async () => {
			const style: unknown = JSON.parse(await layer.getStyle({ port: 1234 }));
			expect(style).toMatchObject({
				glyphs: 'http://localhost:1234/assets/fonts/{fontstack}/{range}.pbf',
				sprite: 'http://localhost:1234/assets/sprites/sprites',
			});
		});
	});

	describe('getMetadata', () => {
		it('should return the correct metadata', async () => {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const metadata = JSON.parse(await layer.getMetadata() ?? '');
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			expect(metadata?.vector_layers?.length).toBe(26);
		});
	});
});
