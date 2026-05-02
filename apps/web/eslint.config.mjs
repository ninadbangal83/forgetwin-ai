import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ['.next/**', 'node_modules/**', 'eslint.config.mjs'],
    rules: {
      '@typescript-eslint/ban-ts-comment': 'off',
      'react/react-in-jsx-scope': 'off',
      'prefer-const': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_", "caughtErrorsIgnorePattern": "^_" }],
      'no-unused-vars': ['error', { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_", "caughtErrorsIgnorePattern": "^_" }]
    }
  }
);

