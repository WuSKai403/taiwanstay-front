import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { ProfileUpdateData } from '@/lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: '方法不允許' });
  }

  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ message: '請先登入' });
  }

  try {
    const { db } = await connectToDatabase();
    const data = req.body as ProfileUpdateData;

    // 更新用戶資料
    const result = await db.collection('users').updateOne(
      { email: session.user?.email },
      {
        $set: {
          ...data,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: '找不到用戶' });
    }

    return res.status(200).json({ message: '更新成功' });
  } catch (error) {
    console.error('更新用戶資料錯誤:', error);
    return res.status(500).json({ message: '更新用戶資料時發生錯誤' });
  }
}

// 獲取用戶資料
async function getUserProfile(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    // 根據 session 中的 email 獲取用戶資料
    const user = await User.findOne({ email: session.user.email }).lean();

    if (!user) {
      return res.status(404).json({ message: '找不到用戶' });
    }

    // 將用戶資料轉換為 JSON 格式
    const profile = JSON.parse(JSON.stringify(user));

    return res.status(200).json({ profile });
  } catch (error) {
    console.error('獲取用戶資料失敗:', error);
    return res.status(500).json({ message: '獲取用戶資料失敗' });
  }
}

// 更新用戶資料
async function updateUserProfile(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    const {
      name,
      profile
    } = req.body;

    // 驗證必填欄位
    if (!name) {
      return res.status(400).json({ message: '姓名為必填欄位' });
    }

    // 構建更新對象
    const updateData: any = {
      name,
      updatedAt: new Date()
    };

    // 添加個人資料欄位
    if (profile) {
      // 處理個人資料欄位
      if (profile.bio !== undefined) {
        updateData['profile.bio'] = profile.bio;
      }

      // 處理社交媒體欄位
      if (profile.socialMedia) {
        if (profile.socialMedia.facebook !== undefined) {
          updateData['profile.socialMedia.facebook'] = profile.socialMedia.facebook;
        }
        if (profile.socialMedia.instagram !== undefined) {
          updateData['profile.socialMedia.instagram'] = profile.socialMedia.instagram;
        }
      }

      // 處理個人信息欄位
      if (profile.personalInfo) {
        if (profile.personalInfo.currentLocation !== undefined) {
          updateData['profile.personalInfo.currentLocation'] = profile.personalInfo.currentLocation;
        }
        if (profile.personalInfo.occupation !== undefined) {
          updateData['profile.personalInfo.occupation'] = profile.personalInfo.occupation;
        }
      }
    }

    // 更新用戶資料
    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email },
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedUser) {
      return res.status(404).json({ message: '找不到用戶' });
    }

    // 將更新後的用戶資料轉換為 JSON 格式
    const updatedProfile = JSON.parse(JSON.stringify(updatedUser));

    return res.status(200).json({
      message: '用戶資料已更新',
      profile: updatedProfile
    });
  } catch (error) {
    console.error('更新用戶資料失敗:', error);
    return res.status(500).json({ message: '更新用戶資料失敗' });
  }
}