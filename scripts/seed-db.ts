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
      const timeSlot = {
        _id: new mongoose.Types.ObjectId(),
        startDate: new Date(opp.timeSlotStartDate),
        endDate: new Date(opp.timeSlotEndDate),
        defaultCapacity: parseInt(opp.timeSlotDefaultCapacity) || 2,
        minimumStay: parseInt(opp.timeSlotMinimumStay) || 14,
        appliedCount: 0,
        confirmedCount: 0,
        status: TimeSlotStatus.OPEN,
        description: `${opp.title}的開放時段`,
        capacityOverrides: []
      };
      timeSlots.push(timeSlot);
    }

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
        languages: ['中文', '英文']
      },

      // 工作時間設置 - 整體時間框架
      workTimeSettings: {
        workHoursPerDay: parseInt(opp.workHoursPerWeek) / parseInt(opp.workDaysPerWeek),
        workDaysPerWeek: parseInt(opp.workDaysPerWeek),
        minimumStay: parseInt(opp.minimumStay) || 7,
        maximumStay: parseInt(opp.maximumStay) || 90,
        startDate: hasTimeSlots ? new Date(opp.timeSlotStartDate) : new Date(),
        endDate: hasTimeSlots ? new Date(opp.timeSlotEndDate) : new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
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

    // 如果有時段，初始化日期容量
    if (hasTimeSlots && timeSlots.length > 0) {
      await initializeDateCapacities(
        createdOpportunity._id,
        timeSlots[0]._id,
        new Date(opp.timeSlotStartDate),
        new Date(opp.timeSlotEndDate),
        parseInt(opp.timeSlotDefaultCapacity) || 2,
        opp.slug
      );
    }
  }

  console.log(`已導入 ${opportunities.length} 筆機會資料`);
}

// 初始化日期容量
async function initializeDateCapacities(
  opportunityId: mongoose.Types.ObjectId,
  timeSlotId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date,
  defaultCapacity: number,
  opportunitySlug: string
): Promise<void> {
  // 獲取所有日期
  const allDates: string[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    allDates.push(formatDate(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // 為每一天創建容量記錄
  const dateCapacities = [];

  for (const date of allDates) {
    dateCapacities.push({
      date,
      opportunityId,
      timeSlotId,
      opportunitySlug,
      capacity: defaultCapacity,
      bookedCount: 0
    });
  }

  // 批量插入
  if (dateCapacities.length > 0) {
    await DateCapacity.insertMany(dateCapacities);
  }
}

// 導入日期容量資料
async function importDateCapacities() {
  console.log('導入日期容量資料...');

  try {
    const dateCapacities = readCsvFile(path.join(process.cwd(), 'data/seed/date_capacities.csv'));

    for (const dc of dateCapacities) {
      // 查找對應的機會
      const opportunity = await Opportunity.findOne({ slug: dc.opportunitySlug });

      if (!opportunity) {
        console.warn(`找不到對應的機會: ${dc.opportunitySlug}`);
        continue;
      }

      // 查找對應的時段
      let timeSlotId = dc.timeSlotId;
      if (!mongoose.Types.ObjectId.isValid(timeSlotId)) {
        // 如果 timeSlotId 不是有效的 ObjectId，使用機會的第一個時段
        if (opportunity.timeSlots && opportunity.timeSlots.length > 0) {
          timeSlotId = opportunity.timeSlots[0]._id;
        } else {
          console.warn(`機會 ${dc.opportunitySlug} 沒有時段`);
          continue;
        }
      }

      // 更新日期容量
      await DateCapacity.updateOne(
        {
          date: dc.date,
          opportunityId: opportunity._id,
          timeSlotId: timeSlotId
        },
        {
          $set: {
            capacity: parseInt(dc.capacity),
            bookedCount: parseInt(dc.bookedCount)
          }
        },
        { upsert: true }
      );
    }

    console.log(`已導入 ${dateCapacities.length} 筆日期容量資料`);
  } catch (error) {
    console.error('導入日期容量資料失敗:', error);
    // 如果找不到檔案，不中斷程序
  }
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

    // 處理結束日期
    let endDate = null;
    if (app.endDate && app.endDate.trim() !== '') {
      endDate = new Date(app.endDate);
    } else if (app.startDate && app.duration) {
      // 如果沒有提供結束日期，根據開始日期和持續時間計算
      const startDate = new Date(app.startDate);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + parseInt(app.duration));
    }

    // 創建申請資料物件
    const applicationData = {
      userId: user._id,
      opportunityId: opportunity._id,
      hostId: host._id,
      timeSlotId: timeSlotId,
      status: app.status as ApplicationStatus,
      applicationDetails: {
        message: app.message,
        startDate: new Date(app.startDate),
        endDate: endDate,
        duration: parseInt(app.duration),
        travelingWith: {
          partner: false,
          children: false,
          pets: false
        },
        languages: ['中文', '英文'],
        relevantExperience: '我有相關的經驗...',
        motivation: '我希望能夠學習和成長...'
      },
      communications: {
        messages: [{
          sender: user._id,
          content: app.message,
          timestamp: new Date(),
          read: app.status !== 'PENDING'
        }],
        lastMessageAt: new Date(),
        unreadHostMessages: 1,
        unreadUserMessages: 0
      }
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

        // 手動更新日期容量的已預訂數量
        if (app.startDate && endDate) {
          const startDate = new Date(app.startDate);
          const allDates = [];
          const currentDate = new Date(startDate);

          while (currentDate <= endDate) {
            allDates.push(formatDate(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
          }

          for (const date of allDates) {
            await DateCapacity.updateOne(
              {
                date,
                opportunityId: opportunity._id,
                timeSlotId: timeSlotId
              },
              { $inc: { bookedCount: 1 } }
            );
          }
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
    await importDateCapacities();
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