import mongoose from 'mongoose';

// MongoDB連接URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/taiwanstay';

// 連接選項
const options = {
  // 使用新的URL解析器和統一的拓撲
  // 這些選項在新版本的mongoose中已經默認啟用
};

// 連接狀態
let isConnected = false;

/**
 * 連接到MongoDB數據庫
 */
export async function connectToDatabase() {
  // 如果已經連接，則直接返回
  if (isConnected) {
    return;
  }

  try {
    // 連接到MongoDB
    const db = await mongoose.connect(MONGODB_URI);

    // 更新連接狀態
    isConnected = db.connection.readyState === 1;

    console.log('MongoDB連接成功');
  } catch (error) {
    console.error('MongoDB連接失敗:', error);
    throw error;
  }
}

/**
 * 斷開與MongoDB數據庫的連接
 */
export async function disconnectFromDatabase() {
  // 如果未連接，則直接返回
  if (!isConnected) {
    return;
  }

  try {
    // 斷開連接
    await mongoose.disconnect();

    // 更新連接狀態
    isConnected = false;

    console.log('MongoDB連接已斷開');
  } catch (error) {
    console.error('MongoDB斷開連接失敗:', error);
    throw error;
  }
}

/**
 * 獲取MongoDB連接實例
 */
export function getConnection() {
  return mongoose.connection;
}
