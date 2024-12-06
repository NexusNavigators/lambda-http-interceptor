// @ts-check
import globals from 'globals'
import tslint from 'typescript-eslint'
import stylistic from '@stylistic/eslint-plugin'
import importX from 'eslint-plugin-import-x'
import vitest from '@vitest/eslint-plugin'

export default [
  {
    files: ['**/*.{mjs,ts}'],
  },
  {
    languageOptions: {
      globals: {
        ...globals.es2023,
        ...globals.node,
      },
    },
  },
  ...tslint.configs.strict,
  stylistic.configs['recommended-flat'],
  {
    plugins: {
      'import-x': importX,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@stylistic/brace-style': ['error', '1tbs'],
      '@stylistic/arrow-parens': ['error', 'always'],
      '@stylistic/comma-dangle': ['error', 'always-multiline'],
      'import-x/extensions': ['error', 'never'],
      'import-x/no-named-as-default': 'error',
      'import-x/no-named-as-default-member': 'error',
      'import-x/no-duplicates': 'error',
    },
  },
  {
    files: ['tests/**'], // or any other pattern
    plugins: {
      vitest,
    },
    settings: {
      vitest: {
        typecheck: true,
      },
    },
    rules: {
      ...vitest.configs.recommended.rules, // you can also use vitest.configs.all.rules to enable all rules
      'vitest/max-nested-describe': ['error', { max: 3 }], // you can also modify rules' behavior using option like this
    },
  },
]
