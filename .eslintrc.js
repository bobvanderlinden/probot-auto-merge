module.exports = {
  env: {
    es6: true,
    node: true,
    'jest/globals': true
  },
  extends: [
    'standard'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module'
  },
  plugins: [
    '@typescript-eslint',
    'jest'
  ],
  overrides: [
    {
      files: ['src/**/*.ts', 'test/**/*.ts'],
      rules: {
        'no-unused-vars': ['off'],
        'no-undef': ['off'],
        'no-mixed-operators': ['off'],
        'no-useless-constructor': ['off']
      }
    }
  ]
}
