// @ts-check
import stylistic from '@stylistic/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import tsEslint from 'typescript-eslint'

export default [
  {
    ignores: ['**/dist/*', '**/node_modules/*'],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: [
          './tsconfig.json',
          './example/tsconfig.json',
        ],
      },
    },
    rules: {
      'no-console': 'warn',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'error',
    },
  },
  ...tsEslint.configs.recommended,
  stylistic.configs['recommended-flat'],
]
