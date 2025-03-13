const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // 指向Next.js應用的路徑
  dir: './',
});

// 自定義Jest配置
const customJestConfig = {
  // 簡化的測試配置
  setupFilesAfterEnv: ['<rootDir>/jest.simple.setup.js'],
  moduleDirectories: ['node_modules', '<rootDir>/'],
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: [
    '**/__tests__/basic/utils.test.[jt]s?(x)',
  ],
  // 忽略所有複雜的測試
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/__tests__/unit/',
    '<rootDir>/__tests__/integration/',
    '<rootDir>/__tests__/e2e/',
  ],
  // 添加 transformIgnorePatterns 來處理 nanoid 模塊
  transformIgnorePatterns: [
    '/node_modules/(?!nanoid)/'
  ],
  // 設置測試超時時間
  testTimeout: 10000,
  // 設置最大並行工作數
  maxWorkers: '50%',
};

// createJestConfig會自動處理將next.js需要的配置應用到Jest
module.exports = createJestConfig(customJestConfig);