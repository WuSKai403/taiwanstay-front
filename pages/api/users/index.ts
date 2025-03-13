import { NextApiRequest, NextApiResponse } from 'next';
import { User } from '../../../models/index';
import { UserRole } from '../../../models/enums/UserRole';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      return getUsers(req, res);
    case 'POST':
      return createUser(req, res);
    default:
      return res.status(405).json({ message: '方法不允許' });
  }
}

// 獲取用戶列表
async function getUsers(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 從查詢參數中獲取篩選條件
    const {
      q, // 搜尋關鍵詞
      role, // 用戶角色
      page = '1',
      limit = '10',
      sort = 'newest' // 排序方式：newest, oldest
    } = req.query;

    // 構建查詢條件
    const query: any = {};

    // 如果有搜尋關鍵詞，添加到查詢條件
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ];
    }

    // 如果有角色篩選，添加到查詢條件
    if (role) {
      query.role = role;
    }

    // 計算總數
    const total = await User.countDocuments(query);

    // 分頁處理
    const pageNum = parseInt(String(page), 10);
    const limitNum = parseInt(String(limit), 10);
    const skip = (pageNum - 1) * limitNum;

    // 排序方式
    let sortOption = {};
    if (sort === 'newest') {
      sortOption = { createdAt: -1 };
    } else if (sort === 'oldest') {
      sortOption = { createdAt: 1 };
    }

    // 查詢用戶列表
    const users = await User.find(query)
      .select('-password') // 排除密碼字段
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    // 返回結果
    return res.status(200).json({
      users: users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.profile?.avatar,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      })),
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('獲取用戶列表失敗:', error);
    return res.status(500).json({ message: '獲取用戶列表時發生錯誤' });
  }
}

// 創建用戶
async function createUser(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 從請求體中獲取用戶數據
    const { name, email, password, role = UserRole.USER, location, profile = {} } = req.body;

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
    const userData = {
      name,
      email,
      password, // 實際應用中應該使用bcrypt等工具加密
      role,
      profile: { ...profile },
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
    };

    // 如果提供了有效的位置資訊，則添加到用戶資料中
    if (location && location.coordinates && Array.isArray(location.coordinates) && location.coordinates.length === 2) {
      (userData.profile as any).location = {
        type: 'Point',
        coordinates: location.coordinates
      };
    }

    const newUser = new User(userData);

    await newUser.save();

    // 返回成功響應（不包含密碼）
    return res.status(201).json({
      message: '用戶創建成功',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt
      }
    });
  } catch (error) {
    console.error('創建用戶失敗:', error);
    return res.status(500).json({ message: '創建用戶時發生錯誤' });
  }
}