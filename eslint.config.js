import js from '@eslint/js';
import ts from 'typescript-eslint';
import parser from '@typescript-eslint/parser';
import eslint_plugin from '@typescript-eslint/eslint-plugin';

export default [
	js.configs.recommended,
	...ts.configs.recommended,
	{
		ignores: [
			'**/dist/**/*.*',
			'**/coverage/**/*.*',
		]
	},
	{
		files: [
			'**/src/**/*.ts',
		],
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: {
				browser: false,
				es6: true,
				node: true
			},
			parser,
			parserOptions: {
				sourceType: 'module',
				project: './tsconfig.json',
				tsconfigRootDir: import.meta.dirname,
			},
		},
		plugins: {
			'@typescript-eslint': eslint_plugin,
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
					caughtErrorsIgnorePattern: '^_'
				}
			]
		}
	}
]
