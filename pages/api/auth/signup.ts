import { NextApiRequest, NextApiResponse } from 'next';
import { hash } from 'bcryptjs';
import { connectToDatabase } from '@/lib/mongodb';
import { isValidEmail } from '@/utils/helpers';
import emailService from '@/lib/email/EmailService';
import { EmailType } from '@/lib/email/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '方法不允許' });
  }

  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: '請提供電子郵件和密碼' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: '無效的電子郵件格式' });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: '密碼長度必須至少為 8 個字符' });
  }

  try {
    const { db } = await connectToDatabase();

    // 檢查郵件是否已被使用
    const existingUser = await db.collection('users').findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: '此電子郵件已被註冊' });
    }

    // 加密密碼
    const hashedPassword = await hash(password, 12);

    // 創建用戶
    const result = await db.collection('users').insertOne({
      email: email.toLowerCase(),
      password: hashedPassword,
      name: name || email.split('@')[0],
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    if (!result.insertedId) {
      throw new Error('創建用戶失敗');
    }

    // 發送歡迎郵件
    const welcomeEmailContent = `
      <h1>歡迎加入 TaiwanStay！</h1>
      <p>親愛的 ${name || email.split('@')[0]}：</p>
      <p>感謝您註冊成為 TaiwanStay 的會員。我們很高興能夠為您提供以工換宿的機會。</p>
      <p>在 TaiwanStay，您可以：</p>
      <ul>
        <li>瀏覽全台灣的工換機會</li>
        <li>與在地主人直接聯繫</li>
        <li>分享您的工換經驗</li>
        <li>建立您的工換檔案</li>
      </ul>
      <p>如果您有任何問題，歡迎隨時與我們聯繫。</p>
      <p>祝您有個愉快的工換之旅！</p>
      <p>TaiwanStay 團隊</p>
    `;

    await emailService.sendEmail(
      {
        to: email,
        subject: '歡迎加入 TaiwanStay',
        html: welcomeEmailContent
      },
      EmailType.IMPORTANT
    );

    return res.status(201).json({ message: '註冊成功' });
  } catch (error) {
    console.error('註冊錯誤:', error);
    return res.status(500).json({ message: '註冊過程中發生錯誤' });
  }
}