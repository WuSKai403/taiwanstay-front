#!/usr/bin/env node

/**
 * 簡化的測試運行腳本
 *
 * 這個腳本用於運行基本測試
 *
 * 使用方法:
 * node scripts/run-tests.js
 */

const { execSync } = require('child_process');

// 設置環境變數
process.env.NODE_ENV = 'test';

// 顯示測試開始信息
console.log('\n🧪 開始運行測試...\n');

// 運行測試函數
function runTests() {
  try {
    // 使用 Jest 運行測試
    execSync('npx jest', { stdio: 'inherit' });
    console.log('\n✅ 測試通過!\n');
    return true;
  } catch (error) {
    console.log('\n❌ 測試失敗!\n');
    return false;
  }
}

// 運行測試
const success = runTests();

// 顯示測試結果
if (success) {
  console.log('🎉 所有測試通過!');
  process.exit(0);
} else {
  console.error('💥 測試失敗!');
  process.exit(1);
}