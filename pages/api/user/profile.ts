import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { ProfileUpdateData } from '@/lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 獲取用戶會話
  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ message: '請先登入' });
  }

  // 根據 HTTP 方法處理不同請求
  if (req.method === 'GET') {
    return getUserProfile(req, res, session);
  } else if (req.method === 'PUT') {
    return updateUserProfile(req, res, session);
  } else {
    return res.status(405).json({ message: '方法不允許' });
  }
}

// 獲取用戶資料
async function getUserProfile(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    // 連接到數據庫
    const { db } = await connectToDatabase();

    // 根據 session 中的 email 獲取用戶資料
    const user = await db.collection('users').findOne({ email: session.user.email });

    if (!user) {
      return res.status(404).json({ message: '找不到用戶' });
    }

    return res.status(200).json({ profile: user });
  } catch (error) {
    console.error('獲取用戶資料失敗:', error);
    return res.status(500).json({ message: '獲取用戶資料失敗' });
  }
}

// 更新用戶資料
async function updateUserProfile(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    // 連接到數據庫
    const { db } = await connectToDatabase();
    const data = req.body as ProfileUpdateData;

    // 構建更新對象
    const updateData = {
      ...data,
      updatedAt: new Date()
    };

    // 更新用戶資料
    const result = await db.collection('users').findOneAndUpdate(
      { email: session.user.email },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return res.status(404).json({ message: '找不到用戶' });
    }

    return res.status(200).json({
      message: '用戶資料已更新',
      profile: result.value
    });
  } catch (error) {
    console.error('更新用戶資料失敗:', error);
    return res.status(500).json({ message: '更新用戶資料失敗' });
  }
}