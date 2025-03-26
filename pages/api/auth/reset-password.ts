import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb';
import { hash } from 'bcryptjs';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '方法不允許' });
  }

  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: '缺少必要參數' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: '密碼長度必須至少為 8 個字符' });
    }

    const { db } = await connectToDatabase();

    // 查找具有有效重置令牌的用戶
    const user = await db.collection('users').findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: '無效或已過期的重置令牌' });
    }

    // 加密新密碼
    const hashedPassword = await hash(password, 12);

    // 更新用戶密碼並清除重置令牌
    await db.collection('users').updateOne(
      { _id: user._id },
      {
        $set: {
          hashedPassword,
          updatedAt: new Date()
        },
        $unset: {
          resetToken: 1,
          resetTokenExpiry: 1
        }
      }
    );

    return res.status(200).json({ message: '密碼已成功重置' });
  } catch (error) {
    console.error('重置密碼錯誤:', error);
    return res.status(500).json({ message: '重置密碼時發生錯誤' });
  }
}