import mongoose from 'mongoose';
import { MongoClient, Db } from 'mongodb';

// 獲取環境變數
const NODE_ENV = process.env.NODE_ENV || 'development';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'taiwanstay';

// 根據環境變數設定資料庫名稱
const DB_NAME = NODE_ENV === 'production'
  ? MONGODB_DB
  : NODE_ENV === 'development'
    ? `${MONGODB_DB}_dev`
    : `${MONGODB_DB}_${NODE_ENV}`;

console.log('MongoDB 初始化設定:', {
  NODE_ENV,
  DB_NAME,
  MONGODB_URI: MONGODB_URI.replace(/:[^:@]*@/, ':****@'), // 隱藏密碼
});

// 連接選項
const options = {
  connectTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 60000,
  heartbeatFrequencyMS: 10000,
  maxPoolSize: 50,
  minPoolSize: 1,
  retryWrites: true,
  w: 1,
  dbName: DB_NAME, // 確保 Mongoose 使用正確的資料庫
  bufferCommands: false, // 禁用命令緩衝
  autoIndex: true, // 在開發環境中自動建立索引
  ...process.env.NODE_ENV === 'production'
    ? {
        ssl: true,
        tls: true,
        authSource: 'admin'
      }
    : {}
};

console.log('MongoDB 連線選項:', {
  ...options,
  connectTimeoutMS: options.connectTimeoutMS,
  socketTimeoutMS: options.socketTimeoutMS,
  serverSelectionTimeoutMS: options.serverSelectionTimeoutMS
});

// 連接狀態
let isConnected = false;

// 初始化 Mongoose 連線
mongoose.set('strictQuery', true);
mongoose.connect(MONGODB_URI, options).then(() => {
  console.log('Mongoose 連線成功');
  isConnected = true;
}).catch((error: Error) => {
  console.error('Mongoose 連線失敗:', {
    name: error.name,
    message: error.message,
    stack: error.stack
  });
});

// 監聽 Mongoose 連線事件
mongoose.connection.on('connected', () => {
  console.log('Mongoose 已連線');
});

mongoose.connection.on('error', (error: Error) => {
  console.error('Mongoose 連線錯誤:', {
    name: error.name,
    message: error.message,
    stack: error.stack
  });
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose 連線已斷開');
  isConnected = false;
});

// 創建一個MongoDB客戶端實例並返回Promise
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// 測試環境標誌
const isTestEnvironment = process.env.NODE_ENV === 'test';

if (process.env.NODE_ENV === 'development') {
  console.log('開發環境：使用全域變數連線');
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  };

  if (!globalWithMongo._mongoClientPromise) {
    console.log('建立新的 MongoDB 連線...');
    client = new MongoClient(MONGODB_URI, options);
    globalWithMongo._mongoClientPromise = client.connect()
      .then(client => {
        console.log('MongoDB 開發環境連線成功');
        return client;
      })
      .catch(error => {
        console.error('MongoDB 開發環境連線失敗:', {
          name: error.name,
          message: error.message,
          code: error.code,
          stack: error.stack
        });
        throw error;
      });
  } else {
    console.log('使用現有的 MongoDB 連線');
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  console.log('生產環境：建立新連線');
  client = new MongoClient(MONGODB_URI, options);
  clientPromise = client.connect()
    .then(client => {
      console.log('MongoDB 生產環境連線成功');
      return client;
    })
    .catch(error => {
      console.error('MongoDB 生產環境連線失敗:', {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      throw error;
    });
}

export interface DatabaseConnection {
  client: MongoClient;
  db: Db;
}

/**
 * 獲取數據庫實例
 */
export async function getDb() {
  console.log('嘗試獲取數據庫實例...');
  try {
    const client = await clientPromise;
    console.log('成功獲取數據庫客戶端');
    const db = client.db(DB_NAME);
    console.log(`成功獲取數據庫: ${DB_NAME}`);
    return db;
  } catch (error) {
    console.error('獲取數據庫實例失敗:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    throw error;
  }
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
export async function connectToDatabase(): Promise<DatabaseConnection> {
  try {
    console.log('正在連接到 MongoDB...');
    console.time('MongoDB連線時間');

    const client = await clientPromise;
    console.log('客戶端連線成功');

    const db = client.db(DB_NAME);
    console.log(`數據庫 ${DB_NAME} 連線成功`);

    // 測試數據庫連線
    await db.command({ ping: 1 });
    console.log('數據庫 ping 測試成功');

    console.timeEnd('MongoDB連線時間');
    return { client, db };
  } catch (error) {
    console.error('MongoDB連接失敗:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack,
      connectionState: client ? (client as any).topology?.state : 'unknown'
    });
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
