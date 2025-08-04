module.exports = {
  extends: ['@ganger/config/eslint/react'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
};