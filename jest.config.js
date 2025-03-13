const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // 指向Next.js應用的路徑
  dir: './',
});

// 自定義Jest配置
const customJestConfig = {
  // 添加更多自定義配置
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleDirectories: ['node_modules', '<rootDir>/'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    // 處理模塊別名
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    'pages/**/*.{js,jsx,ts,tsx}',
    'models/**/*.{js,ts}',
    'utils/**/*.{js,ts}',
    'hooks/**/*.{js,ts}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 10,
      functions: 5,
      lines: 10,
      statements: 10,
    },
  },
  // 忽略特定路徑
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
  ],
};

// createJestConfig會自動處理將next.js需要的配置應用到Jest
module.exports = createJestConfig(customJestConfig);