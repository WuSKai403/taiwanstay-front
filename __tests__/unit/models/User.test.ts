import mongoose from 'mongoose';
import { User, UserRole } from '../../../models';
import { setupTestDatabase, teardownTestDatabase, clearDatabase } from '../../../scripts/test-setup';

// 在所有測試前設置測試數據庫
beforeAll(async () => {
  await setupTestDatabase();
});

// 在所有測試後清理測試數據庫
afterAll(async () => {
  await teardownTestDatabase();
});

// 在每個測試前清理數據庫集合
beforeEach(async () => {
  await clearDatabase();
});

describe('User Model', () => {
  it('should create a new user successfully', async () => {
    // 創建測試用戶
    const testUser = new User({
      name: '測試用戶',
      email: `test-${Date.now()}@example.com`,
      role: UserRole.USER,
      profile: {
        bio: '這是一個測試用戶',
        skills: ['測試技能'],
        languages: ['中文', '英文'],
        location: {
          type: 'Point',
          coordinates: [121.5654, 25.0330] // 經度, 緯度
        }
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

    // 保存用戶
    const savedUser = await testUser.save();

    // 驗證用戶已保存
    expect(savedUser._id).toBeDefined();
    expect(savedUser.name).toBe('測試用戶');
    expect(savedUser.role).toBe(UserRole.USER);
    expect(savedUser.profile.skills).toContain('測試技能');
    expect(savedUser.profile.languages).toContain('中文');
    expect(savedUser.profile.languages).toContain('英文');
  });

  it('should require email field', async () => {
    // 創建缺少必填字段的用戶
    const userWithoutEmail = new User({
      name: '測試用戶',
      role: UserRole.USER,
      profile: {
        location: {
          type: 'Point',
          coordinates: [121.5654, 25.0330]
        }
      }
    });

    // 驗證保存時會拋出錯誤
    await expect(userWithoutEmail.save()).rejects.toThrow();
  });

  it('should not allow duplicate emails', async () => {
    // 創建第一個用戶
    const email = `test-${Date.now()}@example.com`;
    const firstUser = new User({
      name: '測試用戶1',
      email,
      role: UserRole.USER,
      profile: {
        location: {
          type: 'Point',
          coordinates: [121.5654, 25.0330]
        }
      }
    });
    await firstUser.save();

    // 創建具有相同電子郵件的第二個用戶
    const secondUser = new User({
      name: '測試用戶2',
      email,
      role: UserRole.USER,
      profile: {
        location: {
          type: 'Point',
          coordinates: [121.5654, 25.0330]
        }
      }
    });

    // 驗證保存時會拋出錯誤
    await expect(secondUser.save()).rejects.toThrow();
  });

  it('should have default role as USER', async () => {
    // 創建沒有指定角色的用戶
    const user = new User({
      name: '測試用戶',
      email: `test-${Date.now()}@example.com`,
      profile: {
        location: {
          type: 'Point',
          coordinates: [121.5654, 25.0330]
        }
      }
    });

    const savedUser = await user.save();

    // 驗證默認角色是USER
    expect(savedUser.role).toBe(UserRole.USER);
  });
});