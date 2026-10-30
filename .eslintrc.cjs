module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['react-hooks', 'react-refresh', 'prettier'],
  extends: ['eslint:recommended', 'plugin:react-hooks/recommended', 'prettier'],
  ignorePatterns: ['dist/', 'node_modules/'],
  rules: {
    'no-control-regex': 'off',
    'no-alert': 'error',
    'no-unused-vars': 'off',
    'no-useless-escape': 'off',
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
  },
};
