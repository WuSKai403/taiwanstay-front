const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // 指向Next.js應用的路徑
  dir: './',
});

// 自定義Jest配置
const customJestConfig = {
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.simple.setup.js'],
  moduleDirectories: ['node_modules', '<rootDir>/'],
  // Use jsdom for React component testing
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    // Handle CSS imports (with CSS modules)
    '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
    // Handle CSS imports (without CSS modules)
    '^.+\\.(css|sass|scss)$': '<rootDir>/__mocks__/styleMock.js',
    // Handle image imports
    '^.+\\.(png|jpg|jpeg|gif|webp|avif|ico|bmp|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
  ],
  transformIgnorePatterns: [
    '/node_modules/(?!nanoid)/'
  ],
  testTimeout: 10000,
};

// createJestConfig會自動處理將next.js需要的配置應用到Jest
module.exports = createJestConfig(customJestConfig);