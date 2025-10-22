module.exports = {
  root: true,
  env: {
    node: true,
  },
  parser: '@babel/eslint-parser',
  parserOptions: {
    requireConfigFile: false,
    babelOptions: {
      presets: ['@babel/preset-env'],
    },
  },
  extends: [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
  ],
}
