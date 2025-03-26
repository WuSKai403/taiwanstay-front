import { NextApiRequest, NextApiResponse } from 'next';
import { hash } from 'bcryptjs';
import { connectToDatabase } from '@/lib/mongodb';
import { UserRole } from '@/models/enums/UserRole';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '方法不允許' });
  }

  try {
    const { name, email, password } = req.body;

    // 基本驗證
    if (!name || !email || !password) {
      return res.status(400).json({ message: '請填寫所有必填欄位' });
    }

    // 密碼強度驗證
    if (password.length < 8) {
      return res.status(400).json({ message: '密碼長度至少需要 8 個字元' });
    }

    const { db } = await connectToDatabase();

    // 檢查電子郵件是否已存在
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: '此電子郵件已被註冊' });
    }

    // 加密密碼
    const hashedPassword = await hash(password, 12);

    // 創建新用戶
    const result = await db.collection('users').insertOne({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: UserRole.USER,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return res.status(201).json({
      message: '註冊成功',
      userId: result.insertedId
    });
  } catch (error) {
    console.error('註冊錯誤:', error);
    return res.status(500).json({ message: '註冊過程中發生錯誤' });
  }
}