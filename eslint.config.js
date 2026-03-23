// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: ['node_modules/', 'dist/', 'build/', '*.config.js', '*.config.ts', 'vite.config.ts'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      // TypeScript правила
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-empty-function': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',

      // Общие правила
      'no-console': [
        'warn',
        {
          allow: ['log', 'warn', 'error'],
        },
      ],
      'no-debugger': 'warn',
      'no-var': 'error',
      'prefer-const': 'error',
      'no-multiple-empty-lines': [
        'error',
        {
          max: 1,
          maxEOF: 0,
        },
      ],

      // Prettier
      'prettier/prettier': [
        'error',
        {
          semi: true,
          trailingComma: 'es5',
          singleQuote: true,
          printWidth: 100,
          arrowParens: 'always',
        },
      ],
    },
  },
  {
    files: ['**/*.css'],
    ...prettierConfig,
    rules: {
      'prettier/prettier': [
        'error',
        {
          singleQuote: true,
        },
      ],
    },
  },
);
