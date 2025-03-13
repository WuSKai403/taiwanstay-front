import mongoose from 'mongoose';
import { createMocks } from 'node-mocks-http';
import { Opportunity, Host, User } from '../../../../models/index';
import { OpportunityStatus, OpportunityType, WorkType, UserRole } from '../../../../models/enums';
import opportunitiesHandler from '../../../../pages/api/opportunities/index';
import opportunityHandler from '../../../../pages/api/opportunities/[id]';
import { MongoMemoryServer } from 'mongodb-memory-server';

// 連接到測試數據庫
let mongoServer: MongoMemoryServer;

// 使用一個標誌來跟踪連接狀態
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
  console.log('Connected to test database');
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
  console.log('Disconnected from test database');
}

// 在所有測試開始前連接數據庫
beforeAll(async () => {
  await connectToDatabase();
}, 30000);

// 在所有測試結束後斷開數據庫連接
afterAll(async () => {
  await disconnectFromDatabase();
}, 30000);

// 測試用戶數據
const testUser = {
  name: '測試用戶',
  email: 'test@example.com',
  password: 'password123',
  role: UserRole.HOST
};

// 測試主辦方數據
const testHost = {
  name: '測試主辦方',
  slug: 'test-host',
  description: '這是一個測試主辦方',
  type: 'FARM', // 農場類型
  category: 'AGRICULTURE', // 農業類別
  verified: false,
  contactInfo: {
    email: 'host@example.com',
    phone: '0912345678'
  },
  location: {
    address: '台北市信義區松山路123號',
    city: '台北市',
    district: '信義區',
    zipCode: '110',
    country: '台灣',
    coordinates: {
      type: 'Point',
      coordinates: [121.5654, 25.0330] // 台北市座標
    }
  },
  amenities: {
    hasWifi: true,
    hasParking: true,
    hasMeals: true,
    hasPrivateRoom: true,
    hasSharedRoom: false,
    hasCamping: false,
    hasKitchen: true,
    hasShower: true,
    hasHeating: true,
    hasAirConditioning: true,
    hasWashingMachine: true,
    hasPets: false,
    isSmokingAllowed: false,
    isChildFriendly: true,
    isAccessible: true
  },
  details: {
    providesAccommodation: true,
    providesMeals: true
  },
  ratings: {
    overall: 0,
    workEnvironment: 0,
    accommodation: 0,
    food: 0,
    hostHospitality: 0,
    learningOpportunities: 0,
    reviewCount: 0
  }
};

// 測試工作機會數據
const testOpportunity = {
  title: '測試工作機會',
  slug: 'test-opportunity',
  description: '這是一個測試工作機會的詳細描述，包含了工作內容、環境等資訊。',
  shortDescription: '這是一個測試工作機會',
  status: OpportunityStatus.ACTIVE,
  type: OpportunityType.HOSPITALITY,
  workDetails: {
    tasks: ['接待客人', '整理房間', '協助餐飲服務'],
    skills: ['溝通能力', '組織能力'],
    learningOpportunities: ['學習接待技巧', '了解旅遊業運作'],
    workHoursPerWeek: 20,
    workDaysPerWeek: 5,
    minimumStay: 30, // 30天
    isOngoing: true,
    physicalDemand: 'medium',
    languages: ['中文', '英文']
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
    },
    otherBenefits: ['免費WiFi', '可使用公共設施']
  },
  requirements: {
    minAge: 18,
    maxAge: 65,
    gender: 'any',
    acceptsCouples: false,
    acceptsFamilies: false,
    acceptsPets: false,
    drivingLicenseRequired: false,
    specificNationalities: [],
    specificSkills: ['基本英語溝通能力'],
    otherRequirements: ['親切有禮的服務態度']
  },
  media: {
    coverImage: 'https://example.com/cover.jpg',
    gallery: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    videos: []
  },
  location: {
    address: '台北市信義區松山路123號',
    city: '台北市',
    district: '信義區',
    country: '台灣',
    coordinates: {
      type: 'Point',
      coordinates: [121.5654, 25.0330] // 台北市座標
    }
  },
  applicationProcess: {
    instructions: '請提供您的履歷和自我介紹',
    questions: ['您有相關工作經驗嗎？', '您能工作多久？'],
    currentApplications: 0
  },
  impact: {
    environmentalContribution: '我們致力於減少一次性塑料的使用',
    socialContribution: '我們為當地社區提供就業機會',
    culturalExchange: '我們鼓勵文化交流和相互學習',
    sustainableDevelopmentGoals: ['負責任消費和生產', '氣候行動']
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
};

describe('工作機會 API', () => {
  let testHost: any;
  let testOpportunityId: string;
  let testUserId: string;

  // 在所有測試前創建測試數據
  beforeAll(async () => {
    // 清理可能存在的測試數據
    await User.deleteMany({ email: testUser.email });
    await Host.deleteMany({ name: '測試主辦方' });
    await Opportunity.deleteMany({ title: '測試工作機會' });

    // 創建測試用戶
    const user = await User.create(testUser);
    testUserId = user._id.toString();

    // 創建測試主辦方
    testHost = await Host.create({
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
  }, 30000);

  // 在所有測試後刪除測試數據
  afterAll(async () => {
    try {
      // 刪除測試工作機會
      await Opportunity.deleteMany({ hostId: testHost?._id });

      // 刪除測試主辦方
      if (testHost && testHost._id) {
        await Host.findByIdAndDelete(testHost._id);
      }

      // 刪除測試用戶
      if (testUserId) {
        await User.findByIdAndDelete(testUserId);
      }
    } catch (error) {
      console.error('清理測試數據失敗:', error);
    }
  }, 30000);

  // 測試創建工作機會
  it('應該能夠創建新的工作機會', async () => {
    // 禁用API中的數據庫連接
    jest.spyOn(mongoose, 'connect').mockImplementation(() => Promise.resolve(mongoose));

    const testOpportunity = {
      hostId: testHost._id,
      title: '測試工作機會',
      slug: 'test-opportunity',
      description: '這是一個測試工作機會的詳細描述',
      shortDescription: '測試工作機會簡介',
      status: OpportunityStatus.ACTIVE,
      type: OpportunityType.FARMING,
      workDetails: {
        tasks: ['接待客人', '整理環境', '協助活動'],
        workHoursPerWeek: 20,
        workDaysPerWeek: 5,
        minimumStay: 30,
        isOngoing: true,
        physicalDemand: 'medium',
        languages: ['中文', '英文']
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
        gallery: ['https://example.com/image1.jpg'],
        videos: []
      },
      location: {
        address: '台北市信義區信義路五段7號',
        city: '台北市',
        country: '台灣',
        coordinates: {
          type: 'Point',
          coordinates: [121.5656, 25.0331]
        }
      },
      applicationProcess: {
        instructions: '請提供您的履歷和自我介紹',
        questions: ['您有相關工作經驗嗎？'],
        currentApplications: 0
      },
      impact: {
        environmentalContribution: '我們致力於減少一次性塑料的使用',
        socialContribution: '我們為當地社區提供就業機會',
        culturalExchange: '我們鼓勵文化交流和相互學習',
        sustainableDevelopmentGoals: ['負責任消費和生產', '氣候行動']
      }
    };

    // 模擬POST請求
    const { req, res } = createMocks({
      method: 'POST',
      body: testOpportunity
    });

    // 調用API處理程序
    await opportunitiesHandler(req, res);

    // 驗證響應
    expect(res._getStatusCode()).toBe(201);

    const data = JSON.parse(res._getData());
    expect(data.message).toBe('工作機會創建成功');
    expect(data.opportunity).toHaveProperty('id');
    expect(data.opportunity.title).toBe(testOpportunity.title);

    // 保存工作機會ID用於後續測試
    testOpportunityId = data.opportunity.id;

    // 恢復原始的mongoose.connect
    jest.restoreAllMocks();
  }, 30000);

  // 測試獲取工作機會列表
  it('應該能夠獲取工作機會列表', async () => {
    // 禁用API中的數據庫連接
    jest.spyOn(mongoose, 'connect').mockImplementation(() => Promise.resolve(mongoose));

    // 模擬GET請求
    const { req, res } = createMocks({
      method: 'GET'
    });

    // 調用API處理程序
    await opportunitiesHandler(req, res);

    // 驗證響應
    expect(res._getStatusCode()).toBe(200);

    const data = JSON.parse(res._getData());
    expect(data.opportunities).toBeInstanceOf(Array);
    expect(data.opportunities.length).toBeGreaterThan(0);

    // 恢復原始的mongoose.connect
    jest.restoreAllMocks();
  }, 30000);

  // 測試獲取工作機會詳情
  it('應該能夠獲取工作機會詳情', async () => {
    // 禁用API中的數據庫連接
    jest.spyOn(mongoose, 'connect').mockImplementation(() => Promise.resolve(mongoose));

    // 確保testOpportunityId存在
    if (!testOpportunityId) {
      const opportunity = await Opportunity.findOne({ title: '測試工作機會' });
      if (opportunity) {
        testOpportunityId = opportunity._id.toString();
      } else {
        throw new Error('找不到測試工作機會');
      }
    }

    // 模擬GET請求
    const { req, res } = createMocks({
      method: 'GET',
      query: {
        id: testOpportunityId
      }
    });

    // 調用API處理程序
    await opportunityHandler(req, res);

    // 驗證響應
    expect(res._getStatusCode()).toBe(200);

    const data = JSON.parse(res._getData());
    expect(data.opportunity).toHaveProperty('id', testOpportunityId);
    expect(data.opportunity).toHaveProperty('title', '測試工作機會');

    // 恢復原始的mongoose.connect
    jest.restoreAllMocks();
  }, 30000);

  // 測試更新工作機會
  it('應該能夠更新工作機會', async () => {
    // 禁用API中的數據庫連接
    jest.spyOn(mongoose, 'connect').mockImplementation(() => Promise.resolve(mongoose));

    const updateData = {
      title: '更新後的測試工作機會',
      shortDescription: '更新後的簡介'
    };

    // 模擬PUT請求
    const { req, res } = createMocks({
      method: 'PUT',
      query: {
        id: testOpportunityId
      },
      body: updateData
    });

    // 調用API處理程序
    await opportunityHandler(req, res);

    // 驗證響應
    expect(res._getStatusCode()).toBe(200);

    const data = JSON.parse(res._getData());
    expect(data.message).toBe('工作機會更新成功');
    expect(data.opportunity.title).toBe(updateData.title);
    expect(data.opportunity.shortDescription).toBe(updateData.shortDescription);

    // 恢復原始的mongoose.connect
    jest.restoreAllMocks();
  }, 30000);

  // 測試刪除工作機會
  it('應該能夠刪除工作機會', async () => {
    // 禁用API中的數據庫連接
    jest.spyOn(mongoose, 'connect').mockImplementation(() => Promise.resolve(mongoose));

    // 模擬DELETE請求
    const { req, res } = createMocks({
      method: 'DELETE',
      query: {
        id: testOpportunityId
      }
    });

    // 調用API處理程序
    await opportunityHandler(req, res);

    // 驗證響應
    expect(res._getStatusCode()).toBe(200);

    const data = JSON.parse(res._getData());
    expect(data.message).toBe('工作機會刪除成功');

    // 確認工作機會已被刪除
    const checkReq = createMocks({
      method: 'GET',
      query: {
        id: testOpportunityId
      }
    });

    await opportunityHandler(checkReq.req, checkReq.res);
    expect(checkReq.res._getStatusCode()).toBe(404);

    // 恢復原始的mongoose.connect
    jest.restoreAllMocks();
  }, 30000);
});