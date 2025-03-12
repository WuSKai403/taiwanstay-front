import { connectToDatabase, disconnectFromDatabase } from '../lib/mongoose';
import {
  User,
  Host,
  Organization,
  Opportunity,
  Application,
  UserRole,
  HostType,
  HostStatus,
  OrganizationType,
  OrganizationStatus,
  OpportunityType,
  OpportunityStatus
} from '../models';

async function testModels() {
  console.log('開始測試資料模型...');

  try {
    // 連接到資料庫
    console.log('正在連接到 MongoDB...');
    await connectToDatabase();
    console.log('成功連接到 MongoDB!');

    // 測試 User 模型
    console.log('\n測試 User 模型...');
    const userCount = await User.countDocuments();
    console.log(`資料庫中有 ${userCount} 個用戶`);

    // 創建測試用戶
    const testUser = new User({
      name: '測試用戶',
      email: `test-${Date.now()}@example.com`,
      role: UserRole.USER,
      profile: {
        bio: '這是一個測試用戶',
        skills: ['測試技能'],
        languages: ['中文', '英文']
      },
      privacySettings: {
        email: 'PRIVATE',
        phone: 'PRIVATE',
        personalInfo: {
          birthdate: 'PRIVATE',
          gender: 'PRIVATE',
          nationality: 'PRIVATE',
          currentLocation: 'PRIVATE',
          occupation: 'PRIVATE',
          education: 'PRIVATE'
        },
        socialMedia: {
          instagram: 'PRIVATE',
          facebook: 'PRIVATE',
          threads: 'PRIVATE',
          linkedin: 'PRIVATE',
          twitter: 'PRIVATE',
          youtube: 'PRIVATE',
          tiktok: 'PRIVATE',
          website: 'PRIVATE',
          other: 'PRIVATE'
        },
        workExchangePreferences: 'PRIVATE',
        skills: 'PUBLIC',
        languages: 'PUBLIC',
        bio: 'PUBLIC'
      }
    });

    await testUser.save();
    console.log(`創建測試用戶: ${testUser.name} (${testUser._id})`);

    // 測試 Host 模型
    console.log('\n測試 Host 模型...');
    const hostCount = await Host.countDocuments();
    console.log(`資料庫中有 ${hostCount} 個主辦方`);

    // 創建測試主辦方
    const testHost = new Host({
      userId: testUser._id,
      name: '測試主辦方',
      slug: `test-host-${Date.now()}`,
      description: '這是一個測試主辦方',
      status: HostStatus.PENDING,
      type: HostType.FARM,
      category: '有機農場',
      contactInfo: {
        email: 'test-host@example.com'
      },
      location: {
        address: '測試地址',
        city: '台北市',
        country: '台灣',
        coordinates: {
          type: 'Point',
          coordinates: [121.5654, 25.0330]
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
      }
    });

    await testHost.save();
    console.log(`創建測試主辦方: ${testHost.name} (${testHost._id})`);

    // 測試 Opportunity 模型
    console.log('\n測試 Opportunity 模型...');
    const opportunityCount = await Opportunity.countDocuments();
    console.log(`資料庫中有 ${opportunityCount} 個工作機會`);

    // 創建測試工作機會
    const testOpportunity = new Opportunity({
      hostId: testHost._id,
      title: '測試工作機會',
      slug: `test-opportunity-${Date.now()}`,
      description: '這是一個測試工作機會',
      shortDescription: '測試工作機會簡介',
      status: OpportunityStatus.DRAFT,
      type: OpportunityType.FARMING,
      workDetails: {
        tasks: ['照顧植物', '澆水'],
        workHoursPerWeek: 20,
        workDaysPerWeek: 5,
        minimumStay: 7,
        languages: ['中文']
      },
      benefits: {
        accommodation: {
          provided: true,
          type: 'private_room'
        },
        meals: {
          provided: true,
          count: 3
        }
      },
      requirements: {
        acceptsCouples: false,
        acceptsFamilies: false,
        acceptsPets: false,
        drivingLicenseRequired: false
      },
      location: {
        city: '台北市',
        country: '台灣',
        coordinates: {
          type: 'Point',
          coordinates: [121.5654, 25.0330]
        }
      },
      applicationProcess: {
        currentApplications: 0
      }
    });

    await testOpportunity.save();
    console.log(`創建測試工作機會: ${testOpportunity.title} (${testOpportunity._id})`);

    // 測試 Application 模型
    console.log('\n測試 Application 模型...');
    const applicationCount = await Application.countDocuments();
    console.log(`資料庫中有 ${applicationCount} 個申請`);

    // 清理測試數據
    console.log('\n清理測試數據...');
    await Opportunity.deleteOne({ _id: testOpportunity._id });
    await Host.deleteOne({ _id: testHost._id });
    await User.deleteOne({ _id: testUser._id });
    console.log('測試數據已清理');

    console.log('\n所有模型測試完成!');
  } catch (error) {
    console.error('測試過程中發生錯誤:', error);
  } finally {
    // 關閉資料庫連接
    await disconnectFromDatabase();
    console.log('資料庫連接已關閉');
  }
}

// 執行測試
testModels();