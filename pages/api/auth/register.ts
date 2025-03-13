import { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import { UserRole } from '../../../models/enums/UserRole';
import { User } from '../../../models/index';

// 檢查環境變數是否開啟認證
const isAuthEnabled = process.env.ENABLE_AUTH !== 'false';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 如果不是POST請求，返回405方法不允許
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '方法不允許' });
  }

  try {
    // 如果認證被禁用，則返回模擬成功響應
    if (!isAuthEnabled) {
      return res.status(201).json({
        message: '用戶註冊成功',
        user: {
          id: 'test-user-id',
          name: 'Test User',
          email: 'test@example.com',
          role: UserRole.USER
        }
      });
    }

    // 從請求體中獲取用戶數據
    const { name, email, password } = req.body;

    // 基本驗證
    if (!name || !email || !password) {
      return res.status(400).json({ message: '缺少必要欄位' });
    }

    // 驗證電子郵件格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: '無效的電子郵件格式' });
    }

    // 驗證密碼強度（至少8個字符，包含字母和數字）
    if (password.length < 8 || !/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
      return res.status(400).json({
        message: '密碼必須至少8個字符，且包含字母和數字'
      });
    }

    // 檢查用戶是否已存在
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: '該電子郵件已被註冊' });
    }

    // 創建新用戶
    // 注意：在實際應用中，應該對密碼進行加密
    const newUser = new User({
      name,
      email,
      password, // 實際應用中應該使用bcrypt等工具加密
      role: UserRole.USER,
      profile: {},
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
        skills: 'PRIVATE',
        languages: 'PRIVATE',
        bio: 'PRIVATE'
      }
    });

    await newUser.save();

    // 返回成功響應（不包含密碼）
    return res.status(201).json({
      message: '用戶註冊成功',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('用戶註冊失敗:', error);
    return res.status(500).json({ message: '註冊過程中發生錯誤' });
  }
}