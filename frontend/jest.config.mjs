const config = {
  // The root of your source code, typically /src
  rootDir: '.',

  // Test environment
  testEnvironment: 'jsdom',

  // Test file patterns
  testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],

  // Module file extensions for importing
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Transform files with ts-jest
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          module: 'esnext',
          moduleResolution: 'node',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
      },
    ],
  },

  // Extensions to look for
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.tsx'],

  // Collect coverage
  collectCoverageFrom: [
    'utils/**/*.ts',
    'components/**/*.tsx',
    '!**/*.test.ts',
    '!**/*.test.tsx',
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },

  // Ignore node_modules
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/__tests__/setup.tsx'],

  // Coverage directory
  coverageDirectory: 'coverage',

  // Reporters
  reporters: ['default'],

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Reset modules between tests
  resetModules: true,

  // Mock file patterns
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};

export default config;
