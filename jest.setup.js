// 導入測試庫
import '@testing-library/jest-dom';

// 添加TextEncoder和TextDecoder的polyfill
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// 模擬Next.js的路由
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
  }),
}));

// 模擬next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(() => null),
}));

// 設置環境變數
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000';

// 全局超時設置
jest.setTimeout(30000);

// 清理所有模擬
afterEach(() => {
  jest.clearAllMocks();
});

// 全局設置
global.fetch = jest.fn();

// 禁用控制台警告和錯誤
global.console = {
  ...console,
  // 保留這些用於調試
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

// 模擬localStorage
class LocalStorageMock {
  constructor() {
    this.store = {};
  }

  clear() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = String(value);
  }

  removeItem(key) {
    delete this.store[key];
  }
}

global.localStorage = new LocalStorageMock();