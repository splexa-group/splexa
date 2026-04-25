module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  ignorePatterns: ['dist', 'node_modules'],

  overrides: [
    {
      files: ['apps/server/**/*.ts'],
      env: {
        node: true,
      },
    },

    {
      files: ['apps/frontend/**/*.{ts,tsx}'],
      env: {
        browser: true,
      },
    },

    {
      files: ['packages/shared/**/*.ts'],
      env: {
        node: false,
        browser: false,
      },
    },
  ],
};
