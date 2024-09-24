export default {
	verbose: true,
	testEnvironment: 'node',
	transform: {
		'^.+\\.ts$': ['ts-jest', { useESM: true }]
	},
	testMatch: [
		'**/src/**/*.test.ts',
		'!**/src/**/*.mock.test.ts',
	],
	extensionsToTreatAsEsm: ['.ts'],
	moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
	coveragePathIgnorePatterns: [
		'/dist/'
	],
	collectCoverageFrom: [
		'**/*.ts',
		'!**/*.mock.test.ts',
		'!**/node_modules/**',
		'!jest*.ts',
	]
}
