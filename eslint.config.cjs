const wordpress = require('@wordpress/eslint-plugin');
const eslintComments = require('@eslint-community/eslint-plugin-eslint-comments');
const prettierRecommended = require('eslint-plugin-prettier/recommended');
const globals = require('globals');

module.exports = [
	{
		ignores: [
			'**/build/**',
			'**/node_modules/**',
			'**/vendor/**',
			'src/**/*.test.ts',
			'src/frontend/generated/*',
		],
	},
	...wordpress.configs.recommended,
	prettierRecommended,
	{
		languageOptions: {
			globals: {
				...globals.es2021,
				...globals.jest,
				...globals.node,
			},
		},
		plugins: {
			'@eslint-community/eslint-comments': eslintComments,
		},
		settings: {
			'import/resolver': {
				node: {
					extensions: ['.js', '.jsx', '.json'],
				},
			},
			'import/core-modules': [
				'@wordpress/block-editor',
				'@wordpress/blocks',
				'@wordpress/components',
				'@wordpress/a11y',
				'@wordpress/api-fetch',
				'@wordpress/url',
				'@wordpress/compose',
				'@wordpress/core-data',
				'@wordpress/data',
				'@wordpress/date',
				'@wordpress/editor',
				'@wordpress/element',
				'@wordpress/i18n',
				'@wordpress/icons',
				'@wordpress/notices',
				'@wordpress/rich-text',
			],
		},
		rules: {
			'@eslint-community/eslint-comments/disable-enable-pair': 'error',
			'@eslint-community/eslint-comments/no-aggregating-enable': 'error',
			'@eslint-community/eslint-comments/no-duplicate-disable': 'error',
			'@eslint-community/eslint-comments/no-unlimited-disable': 'error',
			'@eslint-community/eslint-comments/no-unused-enable': 'error',
			'no-console': 'off',
			'no-shadow': 'off',
			'object-shorthand': 'off',
			camelcase: 'off',
			eqeqeq: 'off',
			'@wordpress/no-unsafe-wp-apis': 'off',
			'import/no-unresolved': ['error', { ignore: ['\\.(css|scss)$'] }],
			'jsx-a11y/no-static-element-interactions': 'off',
			'jsx-a11y/no-noninteractive-element-interactions': 'off',
			'react-hooks/exhaustive-deps': 'off',
			'react/jsx-key': 'off',
			'prettier/prettier': 'error',
		},
	},
];
