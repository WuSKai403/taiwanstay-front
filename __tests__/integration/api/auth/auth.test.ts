import { createMocks } from 'node-mocks-http';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import registerHandler from '../../../../pages/api/auth/register';
import loginHandler from '../../../../pages/api/auth/login';
import { User } from '../../../../models/index';
import { UserRole } from '../../../../models/enums/UserRole';

// 測試用戶數據
const testUser = {
  name: '測試用戶',
  email: 'test@example.com',
  password: 'Password123',
  profile: {
    // 確保location字段有正確的格式
    location: undefined
  }
};

// 設置MongoDB內存服務器
let mongoServer: MongoMemoryServer;

// 保存原始環境變數
const originalEnv = process.env;

beforeAll(async () => {
  // 創建MongoDB內存服務器
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // 連接到MongoDB內存服務器
  await mongoose.connect(uri);

  // 設置環境變數
  process.env.ENABLE_AUTH = 'true';
});

afterAll(async () => {
  // 斷開連接並停止MongoDB內存服務器
  await mongoose.disconnect();
  await mongoServer.stop();

  // 恢復原始環境變數
  process.env = originalEnv;
});

beforeEach(async () => {
  // 清空集合
  await User.deleteMany({});
});

describe('認證API', () => {
  describe('POST /api/auth/register', () => {
    it('應該註冊新用戶', async () => {
      // 模擬POST請求
      const { req, res } = createMocks({
        method: 'POST',
        body: testUser
      });

      // 調用API處理程序
      await registerHandler(req, res);

      // 驗證響應
      expect(res._getStatusCode()).toBe(201);

      const data = JSON.parse(res._getData());
      expect(data.message).toBe('用戶註冊成功');
      expect(data.user).toBeDefined();
      expect(data.user.name).toBe(testUser.name);
      expect(data.user.email).toBe(testUser.email);
      expect(data.user.role).toBe(UserRole.USER);

      // 驗證用戶已保存到數據庫
      const savedUser = await User.findOne({ email: testUser.email });
      expect(savedUser).not.toBeNull();
      expect(savedUser?.name).toBe(testUser.name);
    });

    it('應該驗證必要欄位', async () => {
      // 模擬缺少必要欄位的POST請求
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          name: '測試用戶'
          // 缺少email和password
        }
      });

      // 調用API處理程序
      await registerHandler(req, res);

      // 驗證響應
      expect(res._getStatusCode()).toBe(400);

      const data = JSON.parse(res._getData());
      expect(data.message).toBe('缺少必要欄位');
    });

    it('應該驗證電子郵件格式', async () => {
      // 模擬無效電子郵件的POST請求
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          name: '測試用戶',
          email: 'invalid-email',
          password: 'Password123'
        }
      });

      // 調用API處理程序
      await registerHandler(req, res);

      // 驗證響應
      expect(res._getStatusCode()).toBe(400);

      const data = JSON.parse(res._getData());
      expect(data.message).toBe('無效的電子郵件格式');
    });

    it('應該驗證密碼強度', async () => {
      // 模擬弱密碼的POST請求
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          name: '測試用戶',
          email: 'test@example.com',
          password: 'weak'
        }
      });

      // 調用API處理程序
      await registerHandler(req, res);

      // 驗證響應
      expect(res._getStatusCode()).toBe(400);

      const data = JSON.parse(res._getData());
      expect(data.message).toBe('密碼必須至少8個字符，且包含字母和數字');
    });

    it('應該檢查電子郵件是否已被註冊', async () => {
      // 創建測試用戶
      await User.create({
        ...testUser,
        role: UserRole.USER
      });

      // 模擬使用相同電子郵件的POST請求
      const { req, res } = createMocks({
        method: 'POST',
        body: testUser
      });

      // 調用API處理程序
      await registerHandler(req, res);

      // 驗證響應
      expect(res._getStatusCode()).toBe(409);

      const data = JSON.parse(res._getData());
      expect(data.message).toBe('該電子郵件已被註冊');
    });

    it('應該在認證禁用時返回測試帳戶', async () => {
      // 臨時禁用認證
      process.env.ENABLE_AUTH = 'false';

      // 模擬POST請求
      const { req, res } = createMocks({
        method: 'POST',
        body: testUser
      });

      // 調用API處理程序
      await registerHandler(req, res);

      // 驗證響應
      expect(res._getStatusCode()).toBe(201);

      const data = JSON.parse(res._getData());
      expect(data.message).toBe('用戶註冊成功');
      expect(data.user).toBeDefined();

      // 恢復認證
      process.env.ENABLE_AUTH = 'true';
    });
  });

  describe('POST /api/auth/login', () => {
    it('應該登入已註冊用戶', async () => {
      // 創建測試用戶
      await User.create({
        ...testUser,
        role: UserRole.USER
      });

      // 模擬POST請求
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: testUser.email,
          password: testUser.password
        }
      });

      // 調用API處理程序
      await loginHandler(req, res);

      // 驗證響應
      expect(res._getStatusCode()).toBe(200);

      const data = JSON.parse(res._getData());
      expect(data.message).toBe('登入成功');
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(testUser.email);
      expect(data.token).toBeDefined();
    });

    it('應該驗證必要欄位', async () => {
      // 模擬缺少必要欄位的POST請求
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: testUser.email
          // 缺少password
        }
      });

      // 調用API處理程序
      await loginHandler(req, res);

      // 驗證響應
      expect(res._getStatusCode()).toBe(400);

      const data = JSON.parse(res._getData());
      expect(data.message).toBe('缺少電子郵件或密碼');
    });

    it('應該驗證用戶存在', async () => {
      // 模擬使用不存在用戶的POST請求
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: 'nonexistent@example.com',
          password: 'Password123'
        }
      });

      // 調用API處理程序
      await loginHandler(req, res);

      // 驗證響應
      expect(res._getStatusCode()).toBe(401);

      const data = JSON.parse(res._getData());
      expect(data.message).toBe('無效的電子郵件或密碼');
    });

    it('應該驗證密碼正確', async () => {
      // 創建測試用戶
      await User.create({
        ...testUser,
        role: UserRole.USER
      });

      // 模擬使用錯誤密碼的POST請求
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: testUser.email,
          password: 'WrongPassword123'
        }
      });

      // 調用API處理程序
      await loginHandler(req, res);

      // 驗證響應
      expect(res._getStatusCode()).toBe(401);

      const data = JSON.parse(res._getData());
      expect(data.message).toBe('無效的電子郵件或密碼');
    });

    it('應該在認證禁用時返回測試帳戶', async () => {
      // 臨時禁用認證
      process.env.ENABLE_AUTH = 'false';

      // 模擬POST請求
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: 'any@example.com',
          password: 'AnyPassword123'
        }
      });

      // 調用API處理程序
      await loginHandler(req, res);

      // 驗證響應
      expect(res._getStatusCode()).toBe(401);

      // 恢復認證
      process.env.ENABLE_AUTH = 'true';
    });
  });
});