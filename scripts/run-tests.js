#!/usr/bin/env node

/**
 * 測試運行腳本
 *
 * 這個腳本用於運行所有測試，並生成覆蓋率報告
 * 可以通過命令行參數指定要運行的測試類型
 *
 * 使用方法:
 * node scripts/run-tests.js [--unit|--integration|--e2e|--all]
 *
 * 參數:
 * --unit: 只運行單元測試
 * --integration: 只運行集成測試
 * --e2e: 只運行端到端測試
 * --all: 運行所有測試 (默認)
 * --coverage: 生成覆蓋率報告
 */

const { execSync } = require('child_process');
const path = require('path');

// 解析命令行參數
const args = process.argv.slice(2);
const runUnit = args.includes('--unit') || args.includes('--all') || args.length === 0;
const runIntegration = args.includes('--integration') || args.includes('--all') || args.length === 0;
const runE2E = args.includes('--e2e') || args.includes('--all') || args.length === 0;
const coverage = args.includes('--coverage');

// 設置環境變數
process.env.NODE_ENV = 'test';

// 顯示測試開始信息
console.log('\n🧪 開始運行測試...\n');

// 運行測試的函數
function runTests(testType, pattern) {
  try {
    console.log(`\n🔍 運行${testType}測試...\n`);

    // 對於端到端測試，不檢查覆蓋率
    const isE2E = testType === '端到端';
    const coverageFlag = coverage && !isE2E ? '--coverage' : '';
    const additionalFlags = isE2E ? '--passWithNoTests --no-coverage' : '';
    const command = `npx jest ${pattern} ${coverageFlag} ${additionalFlags} --colors`;

    execSync(command, { stdio: 'inherit' });

    console.log(`\n✅ ${testType}測試通過!\n`);
    return true;
  } catch (error) {
    console.error(`\n❌ ${testType}測試失敗!\n`);
    return false;
  }
}

// 運行所有指定的測試
let success = true;

if (runUnit) {
  success = runTests('單元', '__tests__/unit') && success;
}

if (runIntegration) {
  success = runTests('集成', '__tests__/integration') && success;
}

if (runE2E) {
  success = runTests('端到端', '__tests__/e2e') && success;
}

// 顯示測試結果
if (success) {
  console.log('\n🎉 所有測試通過!\n');
  process.exit(0);
} else {
  console.error('\n💥 測試失敗!\n');
  process.exit(1);
}