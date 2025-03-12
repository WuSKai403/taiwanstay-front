import { MongoClient, Db } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('請在環境變數中設定 MONGODB_URI');
}

const uri = process.env.MONGODB_URI;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;
let db: Db;

if (process.env.NODE_ENV === 'development') {
  // 在開發環境中，使用全局變數來保持連接
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
    _mongoClient?: MongoClient;
    _mongoDb?: Db;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
    globalWithMongo._mongoClient = client;
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // 在生產環境中，為每個請求創建新的連接
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// 導出連接客戶端
export { clientPromise };

// 獲取數據庫實例
export async function getDb() {
  if (!db) {
    client = await clientPromise;
    db = client.db(process.env.MONGODB_DB || 'taiwanstay');
  }
  return db;
}

// 獲取集合
export async function getCollection(collectionName: string) {
  const db = await getDb();
  return db.collection(collectionName);
}

// 關閉連接
export async function closeConnection() {
  if (client) {
    await client.close();
  }
}
