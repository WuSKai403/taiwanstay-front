import mongoose from 'mongoose';
import { createMocks } from 'node-mocks-http';
import searchHandler from '../../../pages/api/opportunities/search';
import { OpportunityType } from '../../../models/enums';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Opportunity, Host, User } from '../../../models/index';
import { UserRole } from '../../../models/enums';

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
  console.log('Connected to test database for search tests');
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
  console.log('Disconnected from test database for search tests');
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
  await Opportunity.create([
    {
      hostId: host._id,
      title: '農場工作機會',
      slug: 'test001-farm-opportunity',
      publicId: 'test001',
      description: '這是一個農場工作機會',
      shortDescription: '農場工作',
      type: OpportunityType.FARMING,
      status: 'ACTIVE',
      workDetails: {
        tasks: ['照顧植物', '澆水', '除草'],
        skills: ['園藝知識', '耐心'],
        learningOpportunities: ['學習有機農業', '了解永續發展'],
        workHoursPerWeek: 20,
        workDaysPerWeek: 5,
        minimumStay: 30,
        isOngoing: true,
        physicalDemand: 'medium',
        languages: ['中文', '英文']
      },
      location: {
        address: '台北市農場路123號',
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
    },
    {
      hostId: host._id,
      title: '旅館工作機會',
      slug: 'test002-hotel-opportunity',
      publicId: 'test002',
      description: '這是一個旅館工作機會',
      shortDescription: '旅館工作',
      type: OpportunityType.HOSPITALITY,
      status: 'ACTIVE',
      workDetails: {
        tasks: ['接待客人', '整理房間', '協助餐飲服務'],
        skills: ['溝通能力', '組織能力'],
        learningOpportunities: ['學習接待技巧', '了解旅遊業運作'],
        workHoursPerWeek: 25,
        workDaysPerWeek: 5,
        minimumStay: 30,
        isOngoing: true,
        physicalDemand: 'low',
        languages: ['中文', '英文']
      },
      location: {
        address: '台北市旅館路456號',
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
          type: 'shared_room',
          description: '提供共享房間'
        },
        meals: {
          provided: true,
          count: 2,
          description: '提供早餐和晚餐'
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
        coverImage: 'https://example.com/cover2.jpg',
        gallery: ['https://example.com/image2.jpg']
      },
      applicationProcess: {
        instructions: '請提供您的履歷和自我介紹',
        questions: ['您有相關工作經驗嗎？'],
        currentApplications: 0
      },
      impact: {
        environmentalContribution: '我們致力於減少能源消耗',
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
    }
  ]);
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

describe('Search API', () => {
  it('應該返回所有機會當沒有提供搜索參數時', async () => {
    // 禁用API中的數據庫連接
    jest.spyOn(mongoose, 'connect').mockImplementation(() => Promise.resolve(mongoose));

    const { req, res } = createMocks({
      method: 'GET',
    });

    await searchHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.opportunities).toBeDefined();
    expect(Array.isArray(data.opportunities)).toBe(true);
    expect(data.opportunities.length).toBeGreaterThan(0);

    // 恢復原始的mongoose.connect
    jest.restoreAllMocks();
  }, 30000);

  it('應該根據關鍵詞過濾機會', async () => {
    // 禁用API中的數據庫連接
    jest.spyOn(mongoose, 'connect').mockImplementation(() => Promise.resolve(mongoose));

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        q: '農場',
      },
    });

    await searchHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.opportunities).toBeDefined();

    // 驗證所有返回的機會都包含關鍵詞
    if (data.opportunities.length > 0) {
      data.opportunities.forEach((opp: any) => {
        const containsKeyword =
          opp.title.includes('農場') ||
          (opp.description && opp.description.includes('農場')) ||
          (opp.shortDescription && opp.shortDescription.includes('農場'));

        expect(containsKeyword).toBe(true);
      });
    }

    // 恢復原始的mongoose.connect
    jest.restoreAllMocks();
  }, 30000);

  it('應該根據機會類型過濾機會', async () => {
    // 禁用API中的數據庫連接
    jest.spyOn(mongoose, 'connect').mockImplementation(() => Promise.resolve(mongoose));

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        type: OpportunityType.FARMING,
      },
    });

    await searchHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.opportunities).toBeDefined();

    // 驗證所有返回的機會都是農業類型
    if (data.opportunities.length > 0) {
      data.opportunities.forEach((opp: any) => {
        expect(opp.type).toBe(OpportunityType.FARMING);
      });
    }

    // 恢復原始的mongoose.connect
    jest.restoreAllMocks();
  }, 30000);

  it('應該根據工作時數範圍過濾機會', async () => {
    // 禁用API中的數據庫連接
    jest.spyOn(mongoose, 'connect').mockImplementation(() => Promise.resolve(mongoose));

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        minHours: '20',
        maxHours: '25',
      },
    });

    await searchHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.opportunities).toBeDefined();

    // 驗證所有返回的機會的工作時數都在範圍內
    if (data.opportunities.length > 0) {
      data.opportunities.forEach((opp: any) => {
        expect(opp.workDetails.workHoursPerWeek).toBeGreaterThanOrEqual(20);
        expect(opp.workDetails.workHoursPerWeek).toBeLessThanOrEqual(25);
      });
    }

    // 恢復原始的mongoose.connect
    jest.restoreAllMocks();
  }, 30000);

  it('應該根據地區過濾機會', async () => {
    // 禁用API中的數據庫連接
    jest.spyOn(mongoose, 'connect').mockImplementation(() => Promise.resolve(mongoose));

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        region: '北部',
      },
    });

    await searchHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.opportunities).toBeDefined();

    // 驗證所有返回的機會都在北部地區
    if (data.opportunities.length > 0) {
      data.opportunities.forEach((opp: any) => {
        expect(opp.location.region).toBe('北部');
      });
    }

    // 恢復原始的mongoose.connect
    jest.restoreAllMocks();
  }, 30000);

  it('應該返回405錯誤當使用不允許的HTTP方法時', async () => {
    // 禁用API中的數據庫連接
    jest.spyOn(mongoose, 'connect').mockImplementation(() => Promise.resolve(mongoose));

    const { req, res } = createMocks({
      method: 'POST',
    });

    await searchHandler(req, res);

    expect(res._getStatusCode()).toBe(405);
    const data = JSON.parse(res._getData());
    expect(data.message).toBe('方法不允許');

    // 恢復原始的mongoose.connect
    jest.restoreAllMocks();
  }, 30000);
});