// 加載環境變數
require('dotenv').config({ path: '.env.test' });

// 設置測試環境
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/taiwanstay_test';

// 導入必要的模塊
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

// 在全局範圍內保存MongoDB內存服務器實例
let mongoServer;

// 在所有測試運行前設置MongoDB內存服務器
module.exports.setupTestDatabase = async () => {
  try {
    // 創建MongoDB內存服務器
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // 連接到MongoDB內存服務器
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`Connected to in-memory MongoDB at ${mongoUri}`);
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  }
};

// 在所有測試運行後清理MongoDB內存服務器
module.exports.teardownTestDatabase = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('Disconnected from in-memory MongoDB');
    }

    if (mongoServer) {
      await mongoServer.stop();
      console.log('Stopped in-memory MongoDB server');
    }
  } catch (error) {
    console.error('Error tearing down test database:', error);
    throw error;
  }
};

// 在每次測試運行前清理數據庫集合
module.exports.clearDatabase = async () => {
  try {
    const collections = mongoose.connection.collections;

    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }

    console.log('Cleared all test collections');
  } catch (error) {
    console.error('Error clearing database:', error);
    throw error;
  }
};