import mongoose from 'mongoose';
import { MongoClient } from 'mongodb';

// MongoDB連接URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/taiwanstay';

// 連接選項
const options = {
  // 使用新的URL解析器和統一的拓撲
  // 這些選項在新版本的mongoose中已經默認啟用
};

// 連接狀態
let isConnected = false;

// 創建一個MongoDB客戶端實例並返回Promise
let client: MongoClient;
let clientPromiseInternal: Promise<MongoClient>;

// 測試環境標誌
const isTestEnvironment = process.env.NODE_ENV === 'test';

if (process.env.NODE_ENV === 'development') {
  // 在開發環境中，使用全局變量來保持連接
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(MONGODB_URI);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromiseInternal = globalWithMongo._mongoClientPromise;
} else {
  // 在生產環境中，為每個請求創建新的連接
  client = new MongoClient(MONGODB_URI);
  clientPromiseInternal = client.connect();
}

// 導出 clientPromise
export const clientPromise = clientPromiseInternal;

/**
 * 獲取數據庫實例
 */
export async function getDb() {
  const client = await clientPromise;
  return client.db();
}

/**
 * 獲取集合實例
 */
export async function getCollection(collectionName: string) {
  const db = await getDb();
  return db.collection(collectionName);
}

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
  try {
    // 斷開 Mongoose 連接
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      isConnected = false;
      console.log('Mongoose 連接已斷開');
    }

    // 在測試環境中，也關閉 MongoClient 連接
    if (isTestEnvironment && client) {
      await client.close();
      console.log('MongoClient 連接已關閉');
    }
  } catch (error) {
    console.error('MongoDB斷開連接失敗:', error);
    throw error;
  }
}

/**
 * 關閉所有數據庫連接（用於測試環境）
 */
export async function closeAllConnections() {
  try {
    // 關閉 Mongoose 連接
    if (mongoose.connection && mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('Mongoose 連接已關閉');
    }

    // 關閉 MongoClient 連接 - 使用更安全的方式
    if (client) {
      try {
        // 檢查連接是否已經關閉
        const topology = (client as any).topology;
        if (topology && !topology.isClosed()) {
          await client.close(false); // 使用 false 進行更溫和的關閉
          console.log('MongoClient 連接已關閉');
        }
      } catch (err) {
        // 忽略關閉錯誤，避免測試中斷
        console.log('關閉 MongoClient 時出現錯誤，但測試將繼續');
      }
    }
  } catch (error) {
    console.error('關閉數據庫連接失敗:', error);
    // 不拋出錯誤，讓測試可以繼續
  } finally {
    isConnected = false;
  }
}

/**
 * 獲取MongoDB連接實例
 */
export function getConnection() {
  return mongoose.connection;
}
