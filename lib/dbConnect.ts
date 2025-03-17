import { connectToDatabase } from './mongodb';

/**
 * 資料庫連接函數
 * 這是一個簡單的包裝器，用於保持與現有代碼的兼容性
 * 它調用 mongodb.ts 中的 connectToDatabase 函數
 */
async function dbConnect() {
  return await connectToDatabase();
}

export default dbConnect;