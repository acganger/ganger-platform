module.exports = {
  extends: ['../../packages/config/eslint/next.js'],
  rules: {
    'no-console': 'off', // Allow console.log for development
    '@typescript-eslint/no-explicit-any': 'off', // Allow any type for rapid development
    '@typescript-eslint/no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      ignoreRestSiblings: true
    }]
  }
}