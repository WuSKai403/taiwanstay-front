// 加載環境變數
require('dotenv').config({ path: '.env.local' });

// 執行測試腳本
require('child_process').execSync('npx ts-node ./scripts/test-models.ts', { stdio: 'inherit' });