import mongoose from 'mongoose';
import { createMocks } from 'node-mocks-http';
import opportunitiesHandler from '../../../pages/api/opportunities/index';
import opportunityHandler from '../../../pages/api/opportunities/[id]';
import searchHandler from '../../../pages/api/opportunities/search';
import { OpportunityStatus, OpportunityType, WorkType, UserRole } from '../../../models/enums';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Opportunity, Host, User } from '../../../models/index';

// 連接到測試數據庫
let mongoServer: MongoMemoryServer;
let isConnected = false;

async function connectToDatabase() {
  if (isConnected) {
    return;
  }

  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // 確保在連接前沒有活動連接
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  await mongoose.connect(uri);
  isConnected = true;
  console.log('Connected to test database for opportunities tests');
}

// 斷開測試數據庫連接
async function disconnectFromDatabase() {
  if (!isConnected) {
    return;
  }

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  if (mongoServer) {
    await mongoServer.stop();
  }

  isConnected = false;
  console.log('Disconnected from test database for opportunities tests');
}

// 在所有測試開始前連接數據庫
beforeAll(async () => {
  await connectToDatabase();

  // 創建測試用戶
  const user = await User.create({
    name: '測試用戶',
    email: 'test@example.com',
    password: 'password123',
    role: UserRole.HOST
  });

  // 創建測試主辦方
  const host = await Host.create({
    name: '測試主辦方',
    slug: 'test-host',
    description: '這是一個測試主辦方',
    type: 'FARM',
    category: 'AGRICULTURE',
    userId: user._id,
    contactInfo: {
      email: 'host@example.com',
      phone: '0912345678'
    },
    location: {
      address: '台北市信義區信義路五段7號',
      city: '台北市',
      country: '台灣',
      coordinates: {
        type: 'Point',
        coordinates: [121.5656, 25.0331]
      }
    }
  });

  // 創建一些測試數據
  await Opportunity.create({
    hostId: host._id,
    title: '測試工作機會',
    publicId: 'test123456',
    slug: 'test123456-test-opportunity',
    description: '這是一個測試工作機會',
    shortDescription: '測試工作機會簡介',
    status: OpportunityStatus.ACTIVE,
    type: OpportunityType.HOSPITALITY,
    workDetails: {
      tasks: ['接待客人', '整理房間', '協助餐飲服務'],
      skills: ['溝通能力', '組織能力'],
      learningOpportunities: ['學習接待技巧', '了解旅遊業運作'],
      workHoursPerWeek: 20,
      workDaysPerWeek: 5,
      minimumStay: 30,
      isOngoing: true,
      physicalDemand: 'medium',
      languages: ['中文', '英文']
    },
    location: {
      address: '台北市測試路123號',
      city: '台北市',
      region: '北部',
      country: '台灣',
      coordinates: {
        type: 'Point',
        coordinates: [121.5654, 25.0330]
      }
    },
    benefits: {
      accommodation: {
        provided: true,
        type: 'private_room',
        description: '提供獨立單人房'
      },
      meals: {
        provided: true,
        count: 3,
        description: '提供三餐'
      },
      stipend: {
        provided: false
      }
    },
    requirements: {
      minAge: 18,
      gender: 'any',
      acceptsCouples: false,
      acceptsFamilies: false,
      acceptsPets: false,
      drivingLicenseRequired: false
    },
    media: {
      coverImage: 'https://example.com/cover.jpg',
      gallery: ['https://example.com/image1.jpg']
    },
    applicationProcess: {
      instructions: '請提供您的履歷和自我介紹',
      questions: ['您有相關工作經驗嗎？'],
      currentApplications: 0
    },
    impact: {
      environmentalContribution: '我們致力於減少一次性塑料的使用',
      socialContribution: '我們為當地社區提供就業機會'
    },
    ratings: {
      overall: 0,
      workEnvironment: 0,
      accommodation: 0,
      food: 0,
      hostHospitality: 0,
      learningOpportunities: 0,
      reviewCount: 0
    },
    stats: {
      views: 0,
      applications: 0,
      bookmarks: 0,
      shares: 0
    }
  });
}, 30000);

// 在所有測試結束後斷開數據庫連接
afterAll(async () => {
  try {
    // 清理測試數據
    await Opportunity.deleteMany({});
    await Host.deleteMany({});
    await User.deleteMany({});
  } catch (error) {
    console.error('清理測試數據失敗:', error);
  } finally {
    await disconnectFromDatabase();
  }
}, 30000);

// 定義機會類型接口
interface Opportunity {
  id: string;
  title: string;
  description: string;
  workHours: number;
  type: OpportunityType;
  workType: WorkType;
  status: OpportunityStatus;
  location: {
    address: string;
    city: string;
    region: string;
    coordinates: [number, number];
  };
  [key: string]: any; // 允許其他屬性
}

describe('Opportunities API', () => {
  let testHostId: string;
  let testOpportunityId: string;
  let testOpportunityPublicId: string;

  beforeAll(async () => {
    const host = await Host.findOne({ slug: 'test-host' });
    if (host) {
      testHostId = host._id.toString();
    }

    const opportunity = await Opportunity.findOne({ publicId: 'test123456' });
    if (opportunity) {
      testOpportunityId = opportunity._id.toString();
      testOpportunityPublicId = opportunity.publicId;
    } else {
      console.error('找不到測試機會，測試可能會失敗');
    }
  });

  describe('GET /api/opportunities', () => {
    it('should return a list of opportunities', async () => {
      // 禁用API中的數據庫連接
      jest.spyOn(mongoose, 'connect').mockImplementation(() => Promise.resolve(mongoose));

      const { req, res } = createMocks({
        method: 'GET',
      });

      await opportunitiesHandler(req, res);

      expect(res._getStatusCode()).toBe(200);

      const data = JSON.parse(res._getData());
      expect(data.opportunities).toBeDefined();
      expect(Array.isArray(data.opportunities)).toBe(true);
      expect(data.pagination).toBeDefined();

      // 恢復原始的mongoose.connect
      jest.restoreAllMocks();
    }, 30000);

    it('should filter opportunities by query parameters', async () => {
      // 禁用API中的數據庫連接
      jest.spyOn(mongoose, 'connect').mockImplementation(() => Promise.resolve(mongoose));

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          type: OpportunityType.HOSPITALITY,
          region: '北部',
        },
      });

      await opportunitiesHandler(req, res);

      expect(res._getStatusCode()).toBe(200);

      const data = JSON.parse(res._getData());
      expect(data.opportunities).toBeDefined();

      // 驗證篩選結果
      if (data.opportunities.length > 0) {
        data.opportunities.forEach((opp: Opportunity) => {
          expect(opp.type).toBe(OpportunityType.HOSPITALITY);
          expect(opp.location.region).toBe('北部');
        });
      }

      // 恢復原始的mongoose.connect
      jest.restoreAllMocks();
    }, 30000);
  });

  describe('GET /api/opportunities/[id]', () => {
    it('should return a single opportunity by ID', async () => {
      // 禁用API中的數據庫連接
      jest.spyOn(mongoose, 'connect').mockImplementation(() => Promise.resolve(mongoose));

      // 確保 testOpportunityId 存在，否則使用 publicId
      const idToUse = testOpportunityId || testOpportunityPublicId;

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          id: idToUse,
        },
      });

      await opportunityHandler(req, res);

      expect(res._getStatusCode()).toBe(200);

      const data = JSON.parse(res._getData());
      expect(data.opportunity).toBeDefined();

      // 根據使用的 ID 類型調整驗證
      if (testOpportunityId) {
        expect(data.opportunity.id).toBe(testOpportunityId);
      } else {
        expect(data.opportunity.publicId).toBe(testOpportunityPublicId);
      }

      // 恢復原始的mongoose.connect
      jest.restoreAllMocks();
    }, 30000);

    it('should return 404 for non-existent opportunity', async () => {
      // 禁用API中的數據庫連接
      jest.spyOn(mongoose, 'connect').mockImplementation(() => Promise.resolve(mongoose));

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          id: new mongoose.Types.ObjectId().toString(), // 生成一個不存在的 ID
        },
      });

      await opportunityHandler(req, res);

      expect(res._getStatusCode()).toBe(404);

      // 恢復原始的mongoose.connect
      jest.restoreAllMocks();
    }, 30000);
  });

  describe('POST /api/opportunities', () => {
    it('should create a new opportunity', async () => {
      // 禁用API中的數據庫連接
      jest.spyOn(mongoose, 'connect').mockImplementation(() => Promise.resolve(mongoose));

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          hostId: testHostId,
          title: '測試工作機會',
          slug: 'test-opportunity-2',
          description: '這是一個測試工作機會',
          shortDescription: '測試工作機會簡介',
          status: OpportunityStatus.ACTIVE,
          type: OpportunityType.HOSPITALITY,
          workDetails: {
            tasks: ['接待客人', '整理房間', '協助餐飲服務'],
            skills: ['溝通能力', '組織能力'],
            learningOpportunities: ['學習接待技巧', '了解旅遊業運作'],
            workHoursPerWeek: 20,
            workDaysPerWeek: 5,
            minimumStay: 30,
            isOngoing: true,
            physicalDemand: 'medium',
            languages: ['中文', '英文']
          },
          location: {
            address: '測試地址',
            city: '台北市',
            region: '北部',
            country: '台灣',
            coordinates: {
              type: 'Point',
              coordinates: [121.5654, 25.0330]
            }
          },
          benefits: {
            accommodation: {
              provided: true,
              type: 'private_room',
              description: '提供獨立單人房'
            },
            meals: {
              provided: true,
              count: 3,
              description: '提供三餐'
            },
            stipend: {
              provided: false
            }
          },
          requirements: {
            minAge: 18,
            gender: 'any',
            acceptsCouples: false,
            acceptsFamilies: false,
            acceptsPets: false,
            drivingLicenseRequired: false
          }
        },
      });

      await opportunitiesHandler(req, res);

      expect(res._getStatusCode()).toBe(201);

      const data = JSON.parse(res._getData());
      expect(data.message).toBe('工作機會創建成功');
      expect(data.opportunity).toBeDefined();
      expect(data.opportunity.title).toBe('測試工作機會');
      expect(data.opportunity.publicId).toBeDefined();
      expect(data.opportunity.slug.startsWith(data.opportunity.publicId)).toBe(true);

      // 恢復原始的mongoose.connect
      jest.restoreAllMocks();
    }, 30000);

    it('should return 400 for missing required fields', async () => {
      // 禁用API中的數據庫連接
      jest.spyOn(mongoose, 'connect').mockImplementation(() => Promise.resolve(mongoose));

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          // 缺少必填字段
          title: '測試工作機會',
        },
      });

      await opportunitiesHandler(req, res);

      expect(res._getStatusCode()).toBe(400);

      // 恢復原始的mongoose.connect
      jest.restoreAllMocks();
    }, 30000);
  });

  describe('GET /api/opportunities/search', () => {
    it('should search opportunities with advanced filters', async () => {
      // 禁用API中的數據庫連接
      jest.spyOn(mongoose, 'connect').mockImplementation(() => Promise.resolve(mongoose));

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          q: '測試',
          minHours: '20',
          maxHours: '30',
          sort: 'newest',
        },
      });

      await searchHandler(req, res);

      expect(res._getStatusCode()).toBe(200);

      const data = JSON.parse(res._getData());
      expect(data.opportunities).toBeDefined();
      expect(data.filters).toBeDefined();

      // 驗證篩選結果
      if (data.opportunities.length > 0) {
        data.opportunities.forEach((opp: Opportunity) => {
          expect(opp.workDetails.workHoursPerWeek).toBeGreaterThanOrEqual(20);
          expect(opp.workDetails.workHoursPerWeek).toBeLessThanOrEqual(30);
        });
      }

      // 恢復原始的mongoose.connect
      jest.restoreAllMocks();
    }, 30000);
  });
});