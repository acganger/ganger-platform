module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: [
    '<rootDir>/__tests__/**/*.test.{js,jsx}',
  ],
  collectCoverageFrom: [
    'pages/api/**/*.{js,jsx}',
    '__tests__/**/*.{js,jsx}',
    '!**/*.test.{js,jsx}',
  ],
  testTimeout: 10000,
  moduleFileExtensions: ['js', 'jsx', 'json'],
};