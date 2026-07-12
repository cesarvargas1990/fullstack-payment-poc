module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/checkout/application/**/*.ts',
    'src/checkout/infrastructure/payments/**/*.ts',
    'src/checkout/presentation/http/**/*.ts',
    '!src/checkout/presentation/http/dto/**/*.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'json-summary'],
  coverageThreshold: {
    global: {
      statements: 80,
      lines: 80,
      functions: 80,
    },
  },
  testEnvironment: 'node',
};
