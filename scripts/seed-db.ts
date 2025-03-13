import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import mongoose from 'mongoose';
import { User, Host, Organization, Opportunity, Application } from '../models';
import { UserRole } from '../models/enums/UserRole';
import { HostStatus, HostType } from '../models/enums';
import { OrganizationStatus, OrganizationType } from '../models/enums';
import { OpportunityStatus, OpportunityType } from '../models/enums';
import { ApplicationStatus } from '../models/enums/ApplicationStatus';
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
}

// 導入用戶資料
async function importUsers() {
  console.log('導入用戶資料...');
  const users = readCsvFile(path.join(process.cwd(), 'data/seed/users.csv'));

  for (const user of users) {
    await User.create({
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role,
      image: user.image,
      profile: {
        avatar: user.image
      }
    });
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

    // 創建機會
    await Opportunity.create({
      hostId: host._id,
      title: opp.title,
      slug: opp.slug,
      publicId,
      description: `${opp.shortDescription}這是一個很好的機會，可以學習到很多技能和知識。我們提供舒適的住宿環境和豐富的學習資源，歡迎對此領域有興趣的朋友加入我們。`,
      shortDescription: opp.shortDescription,
      status: opp.status as OpportunityStatus,
      type: opp.type as OpportunityType,
      workDetails: {
        description: `每週工作 ${opp.workHoursPerWeek} 小時，${opp.workDaysPerWeek} 天。主要工作內容包括...`,
        workHoursPerWeek: parseInt(opp.workHoursPerWeek),
        workDaysPerWeek: parseInt(opp.workDaysPerWeek),
        minimumStay: 7,
        maximumStay: 90,
        startDate: new Date(),
        endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        isOngoing: true,
        schedule: '工作時間為週一至週五上午 9 點至下午 5 點，週末休息。',
        languages: ['中文', '英文']
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
      }
    });
  }

  console.log(`已導入 ${opportunities.length} 筆機會資料`);
}

// 導入申請資料
async function importApplications() {
  console.log('導入申請資料...');
  const applications = readCsvFile(path.join(process.cwd(), 'data/seed/applications.csv'));

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

    // 創建申請
    await Application.create({
      userId: user._id,
      opportunityId: opportunity._id,
      hostId: host._id,
      status: app.status as ApplicationStatus,
      applicationDetails: {
        message: app.message,
        startDate: new Date(app.startDate),
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
    });

    // 更新機會的申請數量
    await Opportunity.findByIdAndUpdate(opportunity._id, {
      $inc: { 'applicationProcess.currentApplications': 1, 'stats.applications': 1 }
    });
  }

  console.log(`已導入 ${applications.length} 筆申請資料`);
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