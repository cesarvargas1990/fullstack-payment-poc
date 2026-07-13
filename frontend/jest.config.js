module.exports = {
  preset: '@react-native/jest-preset',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native|@react-native-community|@reduxjs|immer|redux|react-redux)/)',
  ],
  collectCoverageFrom: [
    'src/features/**/*.ts',
    'src/shared/**/*.ts',
    '!src/**/*.d.ts',
    '!src/features/products/domain/Product.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'json-summary'],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      lines: 80,
      functions: 80,
    },
  },
};
