import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import mongoose from 'mongoose';
import { hash } from 'bcryptjs';
import { User, Host, Organization, Opportunity, Application } from '../models';
import DateCapacity from '../models/DateCapacity';
import { UserRole } from '../models/enums/UserRole';
import { HostStatus, HostType } from '../models/enums';
import { OrganizationStatus, OrganizationType } from '../models/enums';
import { OpportunityStatus, OpportunityType } from '../models/enums';
import { ApplicationStatus } from '../models/enums/ApplicationStatus';
import { TimeSlotStatus } from '../models/enums/TimeSlotStatus';
import { generatePublicId } from '../utils/helpers';
import dotenv from 'dotenv';

// 將 YYYY-MM 轉換為 Date 對象
function parseYearMonthToDate(yearMonth: string, isEndOfMonth: boolean = false): Date {
  const [year, month] = yearMonth.split('-').map(num => parseInt(num, 10));
  const date = new Date(year, month - 1, isEndOfMonth ? getLastDayOfMonth(year, month) : 1);
  return date;
}

// 獲取月份的最後一天
function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

// 從 YYYY-MM 格式的起止月份生成可用月份數組
function generateAvailableMonthsFromYearMonth(startMonth: string, endMonth: string): number[] {
  if (!startMonth || !endMonth) {
    // 如果沒有提供月份範圍，返回所有月份
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  }

  const [startYear, startMonthNum] = startMonth.split('-').map(num => parseInt(num, 10));
  const [endYear, endMonthNum] = endMonth.split('-').map(num => parseInt(num, 10));

  const months = new Set<number>();

  // 如果年份相同
  if (startYear === endYear) {
    for (let month = startMonthNum; month <= endMonthNum; month++) {
      months.add(month);
    }
  } else {
    // 如果跨年份
    // 添加第一年的月份
    for (let month = startMonthNum; month <= 12; month++) {
      months.add(month);
    }

    // 添加中間年份的所有月份
    for (let year = startYear + 1; year < endYear; year++) {
      for (let month = 1; month <= 12; month++) {
        months.add(month);
      }
    }

    // 添加最後一年的月份
    for (let month = 1; month <= endMonthNum; month++) {
      months.add(month);
    }
  }

  return Array.from(months).sort((a, b) => a - b);
}

// 載入環境變數
dotenv.config({ path: '.env.local' });

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

console.log(`使用資料庫: ${DB_NAME}`);

// 讀取 CSV 檔案
function readCsvFile(filePath: string) {
  const fileContent = fs.readFileSync(filePath, { encoding: 'utf-8' });
  return parse(fileContent, {
    columns: true,
    skip_empty_lines: true
  });
}

// 連接到MongoDB數據庫
async function connectToDatabase() {
  try {
    // 連接到MongoDB
    await mongoose.connect(MONGODB_URI, {
      dbName: DB_NAME
    });
    console.log('MongoDB連接成功');
  } catch (error) {
    console.error('MongoDB連接失敗:', error);
    throw error;
  }
}

// 清空集合
async function clearCollections() {
  console.log('清空集合...');
  await User.deleteMany({});
  await Host.deleteMany({});
  await Organization.deleteMany({});
  await Opportunity.deleteMany({});
  await Application.deleteMany({});
  await DateCapacity.deleteMany({});
}

// 導入用戶資料
async function importUsers() {
  console.log('導入用戶資料...');
  const users = readCsvFile(path.join(process.cwd(), 'data/seed/users.csv'));

  for (const user of users) {
    // 加密密碼
    const hashedPassword = await hash(user.password, 10);

    // 基本資料（所有角色都需要）
    const baseProfile = {
      avatar: user.image,
      birthDate: new Date('1990-01-01'),
      emergencyContact: {
        name: '緊急聯絡人',
        phone: '0912345678',
        relationship: '親屬'
      },
      physicalCondition: '良好',
      preferredWorkHours: 20,
      workExperience: [{
        title: '無工作經驗',
        description: '尚無相關工作經驗',
        duration: '0年'
      }]
    };

    // 根據角色設定不同的資料
    let roleSpecificProfile = {};
    let finalProfile = {};

    if (user.role === UserRole.USER) {
      // 一般使用者需要的額外資料
      roleSpecificProfile = {
        preferredWorkHours: 20,
        languages: ['中文', '英文'],
        dietaryRestrictions: [],
        skills: ['溝通能力', '團隊合作'],
        interests: ['永續發展', '文化交流'],
        experience: {
          workExperience: '無相關經驗',
          volunteerExperience: '無相關經驗',
          relevantCertifications: []
        },
        preferences: {
          preferredLocations: ['台北市', '新北市'],
          preferredDuration: {
            min: 7,
            max: 30
          },
          preferredWorkTypes: ['文化', '環境'],
          accommodationPreferences: ['單人房', '共享房'],
          dietaryPreferences: ['無特殊要求']
        }
      };
    } else if (user.role === UserRole.HOST) {
      // 主辦方管理員需要的額外資料
      roleSpecificProfile = {
        position: '主辦方管理員',
        department: '營運管理',
        responsibilities: ['機會管理', '志工協調'],
        preferredWorkHours: 40,
        languages: ['中文', '英文'],
        contactPreferences: {
          preferredContactMethod: 'email',
          availableTime: '09:00-18:00',
          responseTime: '24小時內'
        }
      };
    } else if (user.role === UserRole.ORGANIZATION) {
      // 組織管理員需要的額外資料
      roleSpecificProfile = {
        position: '組織管理員',
        department: '營運管理',
        responsibilities: ['主辦方管理', '組織發展'],
        preferredWorkHours: 40,
        languages: ['中文', '英文'],
        contactPreferences: {
          preferredContactMethod: 'email',
          availableTime: '09:00-18:00',
          responseTime: '24小時內'
        }
      };
    } else if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
      // 系統管理員需要的額外資料
      roleSpecificProfile = {
        adminLevel: user.role === UserRole.SUPER_ADMIN ? 'super' : 'admin',
        permissions: ['all'],
        preferredWorkHours: 40,
        languages: ['中文', '英文'],
        lastLogin: new Date(),
        securityClearance: 'high'
      };
    }

    finalProfile = { ...baseProfile, ...roleSpecificProfile };

    // 創建用戶
    try {
      await User.create({
        name: user.name,
        email: user.email,
        password: hashedPassword, // 使用加密後的密碼
        role: user.role,
        image: user.image,
        profile: finalProfile
      });
    } catch (error) {
      console.error(`創建用戶失敗 ${user.email}:`, error);
      throw error;
    }
  }

  console.log(`已導入 ${users.length} 筆用戶資料`);
}

// 導入主辦方資料
async function importHosts() {
  console.log('導入主辦方資料...');
  const hosts = readCsvFile(path.join(process.cwd(), 'data/seed/hosts.csv'));

  for (const host of hosts) {
    // 查找對應的用戶
    const user = await User.findOne({ email: host.contactEmail });

    if (!user) {
      console.warn(`找不到對應的用戶: ${host.contactEmail}`);
      continue;
    }

    // 創建主辦方
    await Host.create({
      userId: user._id,
      name: host.name,
      slug: host.slug,
      description: host.description,
      status: host.status as HostStatus,
      type: host.type as HostType,
      category: host.category,
      verified: host.status === 'ACTIVE',
      contactInfo: {
        email: host.contactEmail,
        phone: '0912345678',
        website: `https://${host.slug}.example.com`
      },
      location: {
        address: `${host.city}某處`,
        city: host.city,
        district: '',
        country: host.country,
        coordinates: {
          type: 'Point',
          coordinates: [parseFloat(host.lng), parseFloat(host.lat)]
        }
      },
      media: {
        logo: `https://picsum.photos/seed/${host.slug}/200/200`,
        coverImage: `https://picsum.photos/seed/${host.slug}-cover/1200/600`,
        gallery: [
          `https://picsum.photos/seed/${host.slug}-1/800/600`,
          `https://picsum.photos/seed/${host.slug}-2/800/600`,
          `https://picsum.photos/seed/${host.slug}-3/800/600`
        ]
      },
      amenities: {
        hasWifi: true,
        hasParking: true,
        hasMeals: true,
        hasPrivateRoom: Math.random() > 0.5,
        hasSharedRoom: Math.random() > 0.5,
        hasKitchen: true,
        hasShower: true
      },
      details: {
        foundedYear: 2010 + Math.floor(Math.random() * 10),
        teamSize: 2 + Math.floor(Math.random() * 8),
        languages: ['中文', '英文'],
        acceptsChildren: Math.random() > 0.7,
        acceptsPets: Math.random() > 0.7,
        acceptsCouples: Math.random() > 0.3,
        minStayDuration: 7,
        maxStayDuration: 90,
        workHoursPerWeek: 20 + Math.floor(Math.random() * 10),
        workDaysPerWeek: 4 + Math.floor(Math.random() * 2),
        providesAccommodation: true,
        providesMeals: Math.random() > 0.3
      }
    });

    // 更新用戶的 hostId
    const createdHost = await Host.findOne({ slug: host.slug });
    await User.findByIdAndUpdate(user._id, { hostId: createdHost._id });
  }

  console.log(`已導入 ${hosts.length} 筆主辦方資料`);
}

// 導入組織資料
async function importOrganizations() {
  console.log('導入組織資料...');
  const organizations = readCsvFile(path.join(process.cwd(), 'data/seed/organizations.csv'));

  for (const org of organizations) {
    // 查找對應的用戶
    const user = await User.findOne({ email: org.contactEmail });

    if (!user) {
      console.warn(`找不到對應的用戶: ${org.contactEmail}`);
      continue;
    }

    // 創建組織
    await Organization.create({
      name: org.name,
      slug: org.slug,
      description: org.description,
      status: org.status as OrganizationStatus,
      type: org.type as OrganizationType,
      verified: org.status === 'ACTIVE',
      contactInfo: {
        email: org.contactEmail,
        phone: '0912345678',
        website: `https://${org.slug}.example.org`
      },
      location: {
        address: `${org.city}某處`,
        city: org.city,
        district: '',
        country: org.country,
        coordinates: {
          type: 'Point',
          coordinates: [parseFloat(org.lng), parseFloat(org.lat)]
        }
      },
      media: {
        logo: `https://picsum.photos/seed/${org.slug}/200/200`,
        coverImage: `https://picsum.photos/seed/${org.slug}-cover/1200/600`,
        gallery: [
          `https://picsum.photos/seed/${org.slug}-1/800/600`,
          `https://picsum.photos/seed/${org.slug}-2/800/600`,
          `https://picsum.photos/seed/${org.slug}-3/800/600`
        ]
      },
      details: {
        foundedYear: 2000 + Math.floor(Math.random() * 20),
        teamSize: 5 + Math.floor(Math.random() * 15),
        languages: ['中文', '英文'],
        focusAreas: ['永續發展', '文化保存', '社區營造']
      },
      admins: [user._id],
      hosts: []
    });

    // 更新用戶的 organizationId
    const createdOrg = await Organization.findOne({ slug: org.slug });
    await User.findByIdAndUpdate(user._id, { organizationId: createdOrg._id });
  }

  console.log(`已導入 ${organizations.length} 筆組織資料`);
}

// 導入機會資料
async function importOpportunities() {
  console.log('導入機會資料...');
  const opportunities = readCsvFile(path.join(process.cwd(), 'data/seed/opportunities.csv'));

  for (const opp of opportunities) {
    // 查找對應的主辦方
    const host = await Host.findOne({ slug: opp.hostSlug });

    if (!host) {
      console.warn(`找不到對應的主辦方: ${opp.hostSlug}`);
      continue;
    }

    // 生成 publicId
    const publicId = generatePublicId();

    // 處理時段相關欄位
    const hasTimeSlots = opp.hasTimeSlots === 'true';
    let timeSlots: any[] = [];

    if (hasTimeSlots) {
      // 創建時段
      const startMonth = opp.timeSlotStartMonth; // 直接使用 YYYY-MM 格式
      const endMonth = opp.timeSlotEndMonth; // 直接使用 YYYY-MM 格式
      const defaultCapacity = parseInt(opp.timeSlotDefaultCapacity) || 2;

      // 生成月份範圍
      const months = generateMonthRange(startMonth, endMonth);

      // 創建月份容量記錄
      const monthlyCapacities = months.map(month => ({
        month,
        capacity: defaultCapacity,
        bookedCount: 0
      }));

      const timeSlot = {
        _id: new mongoose.Types.ObjectId(),
        startMonth,
        endMonth,
        defaultCapacity,
        minimumStay: parseInt(opp.timeSlotMinimumStay) || 14,
        appliedCount: 0,
        confirmedCount: 0,
        status: TimeSlotStatus.OPEN,
        description: `${opp.title}的開放時段`,
        capacityOverrides: [],
        monthlyCapacities
      };

      timeSlots.push(timeSlot);
    }

    // 從 timeSlotStartMonth 和 timeSlotEndMonth 生成 availableMonths
    const availableMonths = hasTimeSlots
      ? generateAvailableMonthsFromYearMonth(opp.timeSlotStartMonth, opp.timeSlotEndMonth)
      : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]; // 如果沒有時段，預設全年可用

    // 創建機會
    const createdOpportunity = await Opportunity.create({
      hostId: host._id,
      title: opp.title,
      slug: opp.slug,
      publicId,
      description: `${opp.shortDescription}這是一個很好的機會，可以學習到很多技能和知識。我們提供舒適的住宿環境和豐富的學習資源，歡迎對此領域有興趣的朋友加入我們。`,
      shortDescription: opp.shortDescription,
      status: opp.status as OpportunityStatus,
      type: opp.type as OpportunityType,

      // 工作詳情 - 移除時間相關欄位
      workDetails: {
        tasks: ['協助日常工作', '參與專案活動', '學習相關技能'],
        skills: ['溝通能力', '團隊合作', '學習能力'],
        learningOpportunities: ['專業技能', '文化交流', '永續生活'],
        physicalDemand: 'medium',
        languages: ['中文', '英文'],
        // 添加可用月份 - 使用新的函數生成
        availableMonths: availableMonths
      },

      // 工作時間設置 - 整體時間框架
      workTimeSettings: {
        workHoursPerDay: parseInt(opp.workHoursPerWeek) / parseInt(opp.workDaysPerWeek),
        workDaysPerWeek: parseInt(opp.workDaysPerWeek),
        minimumStay: parseInt(opp.minimumStay) || 7,
        maximumStay: parseInt(opp.maximumStay) || 90,
        startDate: hasTimeSlots ? parseYearMonthToDate(opp.timeSlotStartMonth) : new Date(),
        endDate: hasTimeSlots ? parseYearMonthToDate(opp.timeSlotEndMonth, true) : new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        isOngoing: true,
        seasonality: {
          spring: true,
          summer: true,
          autumn: true,
          winter: true
        }
      },

      benefits: {
        accommodation: {
          provided: opp.accommodationProvided === 'true',
          type: 'private_room',
          description: '提供舒適的單人房間，包含基本傢俱和寢具。'
        },
        meals: {
          provided: opp.mealsProvided === 'true',
          count: 3,
          description: '提供三餐，使用當地新鮮食材。'
        },
        stipend: {
          provided: false
        },
        otherBenefits: ['免費Wi-Fi', '洗衣設備', '自行車使用']
      },
      requirements: {
        minAge: 18,
        maxAge: 65,
        gender: 'any',
        acceptsCouples: true,
        acceptsFamilies: false,
        acceptsPets: false,
        drivingLicenseRequired: false,
        specificSkills: ['良好的溝通能力', '團隊合作精神', '基本的英文能力'],
        otherRequirements: ['對此領域有熱情', '願意學習新事物', '能適應簡單的生活環境']
      },
      media: {
        coverImage: `https://picsum.photos/seed/${opp.slug}/1200/600`,
        gallery: [
          `https://picsum.photos/seed/${opp.slug}-1/800/600`,
          `https://picsum.photos/seed/${opp.slug}-2/800/600`,
          `https://picsum.photos/seed/${opp.slug}-3/800/600`
        ]
      },
      location: {
        address: `${opp.city}某處`,
        city: opp.city,
        country: opp.country,
        coordinates: {
          type: 'Point',
          coordinates: [parseFloat(opp.lng), parseFloat(opp.lat)]
        }
      },
      applicationProcess: {
        instructions: '請填寫申請表，並附上簡短的自我介紹和相關經驗。',
        questions: [
          '你為什麼對這個機會感興趣？',
          '你有哪些相關經驗或技能？',
          '你對這次體驗有什麼期望？'
        ],
        currentApplications: 0
      },
      impact: {
        environmentalContribution: '我們致力於環境保護和永續發展...',
        socialContribution: '我們支持當地社區發展...',
        culturalExchange: '我們促進文化交流和相互理解...'
      },
      ratings: {
        overall: 4.5,
        workEnvironment: 4.3,
        accommodation: 4.2,
        food: 4.4,
        hostHospitality: 4.7,
        learningOpportunities: 4.6,
        reviewCount: 10 + Math.floor(Math.random() * 20)
      },
      stats: {
        views: 100 + Math.floor(Math.random() * 900),
        applications: 5 + Math.floor(Math.random() * 15),
        bookmarks: 10 + Math.floor(Math.random() * 40),
        shares: 5 + Math.floor(Math.random() * 15)
      },
      timeSlots: timeSlots,
      hasTimeSlots: hasTimeSlots
    });

    // 注意：我們不再需要調用 initializeDateCapacities，因為月份容量現在直接嵌入在 timeSlots 中
  }

  console.log(`已導入 ${opportunities.length} 筆機會資料`);
}

// 導入日期容量資料
async function importDateCapacities() {
  console.log('已棄用 DateCapacity，跳過處理，月份容量直接嵌入在時段中');
  console.log('如需導入舊有的日期容量數據，請更新程式碼以匹配新結構');

  // 此函數留在此處以保持向後兼容性，但實際上不再執行舊的導入邏輯
}

/**
 * 生成月份範圍
 * @param startMonth 開始月份 (YYYY-MM)
 * @param endMonth 結束月份 (YYYY-MM)
 * @returns 月份列表 (YYYY-MM 格式)
 */
function generateMonthRange(startMonth: string, endMonth: string): string[] {
  const months: string[] = [];

  // 解析開始月份
  const [startYear, startMonthNum] = startMonth.split('-').map(Number);
  const [endYear, endMonthNum] = endMonth.split('-').map(Number);

  // 設置初始月份
  let currentYear = startYear;
  let currentMonth = startMonthNum;

  // 生成每個月份
  while (
    currentYear < endYear ||
    (currentYear === endYear && currentMonth <= endMonthNum)
  ) {
    // 格式化為 YYYY-MM
    const formattedMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    months.push(formattedMonth);

    // 移至下個月
    if (currentMonth === 12) {
      currentYear++;
      currentMonth = 1;
    } else {
      currentMonth++;
    }
  }

  return months;
}

// 導入申請資料
async function importApplications() {
  console.log('導入申請資料...');
  const applications = readCsvFile(path.join(process.cwd(), 'data/seed/applications.csv'));

  // 獲取 Application 模型
  const ApplicationModel = mongoose.model('Application');

  for (const app of applications) {
    // 查找對應的用戶
    const user = await User.findOne({ email: app.userEmail });

    if (!user) {
      console.warn(`找不到對應的用戶: ${app.userEmail}`);
      continue;
    }

    // 查找對應的機會
    const opportunity = await Opportunity.findOne({ slug: app.opportunitySlug });

    if (!opportunity) {
      console.warn(`找不到對應的機會: ${app.opportunitySlug}`);
      continue;
    }

    // 查找對應的主辦方
    const host = await Host.findById(opportunity.hostId);

    if (!host) {
      console.warn(`找不到對應的主辦方: ${opportunity.hostId}`);
      continue;
    }

    // 處理時段ID
    let timeSlotId = null;
    if (app.timeSlotId && app.timeSlotId.trim() !== '') {
      // 如果提供了時段ID，查找對應的時段
      if (opportunity.timeSlots && opportunity.timeSlots.length > 0) {
        timeSlotId = opportunity.timeSlots[0]._id;
      }
    }

    // 處理飲食限制
    const dietaryRestrictionsType = app.dietaryRestrictions_type ? app.dietaryRestrictions_type.split(',') : [];
    const dietaryRestrictions = {
      type: dietaryRestrictionsType,
      otherDetails: app.dietaryRestrictions_otherDetails || '',
      vegetarianType: app.dietaryRestrictions_vegetarianType || ''
    };

    // 處理語言
    const languages = [{
      language: app.languages_language || '中文',
      level: app.languages_level || 'native'
    }];

    // 處理駕駛執照
    const drivingLicense = {
      motorcycle: app.drivingLicense_motorcycle === 'true',
      car: app.drivingLicense_car === 'true',
      none: app.drivingLicense_none === 'true',
      other: {
        enabled: false,
        details: ''
      }
    };

    // 處理文化興趣和學習目標
    const culturalInterests = app.culturalInterests ? app.culturalInterests.split(',') : [];
    const learningGoals = app.learningGoals ? app.learningGoals.split(',') : [];

    // 創建申請資料
    const applicationData = {
      _id: new mongoose.Types.ObjectId(),
      userId: user._id,
      opportunityId: opportunity._id,
      hostId: host._id,
      timeSlotId: timeSlotId,
      status: app.status || 'PENDING',
      applicationDetails: {
        message: app.message || '',
        startMonth: app.startMonth,
        endMonth: app.endMonth,
        duration: parseInt(app.duration) || 30,
        dietaryRestrictions,
        languages,
        relevantExperience: app.relevantExperience || '',
        motivation: app.motivation || '',
        nationality: app.nationality || '台灣',
        visaType: app.visaType || '無需簽證',
        allergies: app.allergies || '無',
        drivingLicense,
        physicalCondition: app.physicalCondition || '健康良好',
        skills: app.skills || '',
        accommodationNeeds: app.accommodationNeeds || '',
        culturalInterests,
        learningGoals,
        termsAgreed: app.termsAgreed === 'true'
      },
      communications: {
        messages: [{
          sender: user._id,
          content: app.message || '我對這個機會很感興趣，想要參與！',
          timestamp: new Date(),
          read: false
        }],
        lastMessageAt: new Date(),
        unreadHostMessages: 1,
        unreadUserMessages: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      // 直接使用 insertMany 繞過 pre-save 鉤子
      await ApplicationModel.collection.insertOne(applicationData);

      // 更新機會的申請數量
      await Opportunity.findByIdAndUpdate(opportunity._id, {
        $inc: { 'applicationProcess.currentApplications': 1, 'stats.applications': 1 }
      });

      // 如果有時段ID，手動更新時段的申請數量
      if (timeSlotId) {
        await Opportunity.updateOne(
          { _id: opportunity._id, 'timeSlots._id': timeSlotId },
          { $inc: { 'timeSlots.$.appliedCount': 1 } }
        );

        // 如果狀態為已確認，更新時段的確認數量
        if (app.status === ApplicationStatus.CONFIRMED) {
          await Opportunity.updateOne(
            { _id: opportunity._id, 'timeSlots._id': timeSlotId },
            { $inc: { 'timeSlots.$.confirmedCount': 1 } }
          );
        }
      }
    } catch (error) {
      console.error(`導入申請資料失敗: ${app.userEmail} - ${app.opportunitySlug}`, error);
    }
  }

  console.log(`已導入 ${applications.length} 筆申請資料`);
}

// 日期格式化輔助函數
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// 主函數
async function main() {
  try {
    // 連接資料庫
    await connectToDatabase();
    console.log('已連接到資料庫');

    // 清空集合
    await clearCollections();

    // 導入資料
    await importUsers();
    await importHosts();
    await importOrganizations();
    await importOpportunities();
    // 不再需要單獨導入日期容量，因為月份容量直接嵌入在時段中
    // await importDateCapacities();
    await importApplications();

    console.log('資料導入完成！');
    process.exit(0);
  } catch (error) {
    console.error('資料導入失敗:', error);
    process.exit(1);
  }
}

// 執行主函數
main();