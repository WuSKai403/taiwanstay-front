const { TextEncoder, TextDecoder } = require('util');

// 設置全局 TextEncoder 和 TextDecoder
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// 設置其他全局變數
global.fetch = jest.fn();

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

// 設置環境變數
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000';
process.env.SUPPRESS_JEST_WARNINGS = 'true';
