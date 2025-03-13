import { NextApiRequest, NextApiResponse } from 'next';
import { User } from '@/models/index';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug } = req.query;

  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ message: '用戶 ID 無效' });
  }

  try {
    await connectToDatabase();

    // 根據請求方法處理不同操作
    switch (req.method) {
      case 'GET':
        return await getUserDetail(req, res, slug);
      case 'PUT':
        return updateUser(req, res, slug);
      case 'DELETE':
        return deleteUser(req, res, slug);
      default:
        return res.status(405).json({ message: '方法不允許' });
    }
  } catch (error) {
    console.error('用戶 API 錯誤:', error);
    return res.status(500).json({ message: '伺服器錯誤' });
  }
}

// 獲取用戶詳情
async function getUserDetail(req: NextApiRequest, res: NextApiResponse, slug: string) {
  try {
    // 查詢用戶
    const user = await User.findById(slug).select('-password');
    if (!user) {
      return res.status(404).json({ message: '用戶不存在' });
    }

    // 返回用戶資料
    return res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile: user.profile,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('獲取用戶詳情失敗:', error);
    return res.status(500).json({ message: '獲取用戶詳情時發生錯誤' });
  }
}

// 更新用戶
async function updateUser(req: NextApiRequest, res: NextApiResponse, slug: string) {
  try {
    // 從請求體中獲取更新數據
    const { name, email, profile, role, privacySettings, location } = req.body;

    // 查詢用戶
    const user = await User.findById(slug);
    if (!user) {
      return res.status(404).json({ message: '用戶不存在' });
    }

    // 如果更新電子郵件，檢查是否已被使用
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ message: '該電子郵件已被使用' });
      }
    }

    // 更新用戶資料
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;

    // 更新個人資料
    if (profile) {
      // 合併現有資料和新資料
      user.profile = {
        ...user.profile,
        ...profile
      };
    }

    // 如果提供了有效的位置資訊，則更新位置資料
    if (location) {
      if (location.coordinates && Array.isArray(location.coordinates) && location.coordinates.length === 2) {
        // 有效的位置資訊
        user.profile.location = {
          type: 'Point',
          coordinates: location.coordinates
        };
      } else if (location === null) {
        // 明確移除位置資訊
        user.profile.location = undefined;
      }
    }

    // 更新隱私設置
    if (privacySettings) {
      // 合併現有設置和新設置
      user.privacySettings = {
        ...user.privacySettings,
        ...privacySettings
      };
    }

    // 保存更新
    await user.save();

    // 返回更新後的用戶資料
    return res.status(200).json({
      message: '用戶更新成功',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile: user.profile,
        privacySettings: user.privacySettings,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('更新用戶失敗:', error);
    return res.status(500).json({ message: '更新用戶時發生錯誤' });
  }
}

// 刪除用戶
async function deleteUser(req: NextApiRequest, res: NextApiResponse, slug: string) {
  try {
    // 查詢並刪除用戶
    const user = await User.findByIdAndDelete(slug);
    if (!user) {
      return res.status(404).json({ message: '用戶不存在' });
    }

    // 返回成功響應
    return res.status(200).json({
      message: '用戶刪除成功',
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('刪除用戶失敗:', error);
    return res.status(500).json({ message: '刪除用戶時發生錯誤' });
  }
}