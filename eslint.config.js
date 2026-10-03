import js from '@eslint/js';
import ts from 'typescript-eslint';

export default [
	js.configs.recommended,
	...ts.configs.recommended,
	{
		ignores: ['coverage/**/*.*', 'dist/**/*.*', 'static/assets/lib/**/*.*'],
	},
	{
		files: ['src/**/*.ts'],
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: {
				browser: false,
				es6: true,
				node: true,
			},
			parser: ts.parser,
			parserOptions: {
				sourceType: 'module',
				project: './tsconfig.json',
				tsconfigRootDir: import.meta.dirname,
			},
		},
		plugins: {
			'@typescript-eslint': ts.plugin,
		},
		linterOptions: {
			reportUnusedDisableDirectives: true,
		},
		rules: {
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_',
				},
			],
		},
	},
];
