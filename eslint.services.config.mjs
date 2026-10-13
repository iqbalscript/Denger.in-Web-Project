// ESLint flat config for the non-Next workspaces: services/* and packages/*.
//
// Deliberately NOT named eslint.config.* : ESLint 8.57 (apps/web's linter)
// walks up from apps/web and would switch to flat mode if it found an
// eslint.config.{js,mjs,cjs} at the repo root, breaking `npm run lint`
// (apps/web/.eslintrc.json). Run it explicitly:
//   eslint --config eslint.services.config.mjs services packages
// Uses only @typescript-eslint/{parser,eslint-plugin} already declared in
// apps/web devDependencies (hoisted to the root node_modules).
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/.next/**'],
  },
  ...tsPlugin.configs['flat/recommended'].map((config) => ({
    ...config,
    files: ['services/**/*.ts', 'packages/**/*.ts'],
  })),
  {
    files: ['services/**/*.ts', 'packages/**/*.ts'],
    linterOptions: { reportUnusedDisableDirectives: 'error' },
    rules: {
      // Core correctness rules (eslint:recommended subset; @eslint/js is not a declared dependency).
      'no-debugger': 'error',
      'no-dupe-keys': 'error',
      'no-duplicate-case': 'error',
      'no-unreachable': 'error',
      'no-self-assign': 'error',
      'no-fallthrough': 'error',
      'no-constant-condition': ['error', { checkLoops: false }],
      'prefer-const': 'error',
      eqeqeq: ['error', 'smart'],
      // Same convention as apps/web/.eslintrc.json.
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' }],
    },
  },
];
