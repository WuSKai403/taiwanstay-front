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
