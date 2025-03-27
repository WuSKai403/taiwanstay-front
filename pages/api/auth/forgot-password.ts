import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb';
import { randomBytes } from 'crypto';
import emailService from '@/lib/email/EmailService';
import { EmailType } from '@/lib/email/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '方法不允許' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: '請提供電子郵件地址' });
  }

  try {
    console.log('開始處理密碼重置請求:', { email });

    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne({ email });

    if (user) {
      console.log('找到用戶，生成重置令牌');

      // 生成重置令牌
      const resetToken = randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 小時後過期

      // 更新用戶記錄
      await db.collection('users').updateOne(
        { email },
        {
          $set: {
            resetToken,
            resetTokenExpiry
          }
        }
      );

      console.log('已更新用戶的重置令牌');

      // 發送重置郵件
      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`;
      console.log('重置 URL:', resetUrl);

      const emailContent = `
        <h1>重設密碼</h1>
        <p>您收到這封郵件是因為您（或其他人）請求重設密碼。</p>
        <p>請點擊下面的連結重設密碼：</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>此連結將在 1 小時後過期。</p>
        <p>如果您沒有請求重設密碼，請忽略此郵件。</p>
      `;

      console.log('準備發送重置郵件');

      const emailResult = await emailService.sendEmail(
        {
          to: email,
          subject: '重設密碼',
          html: emailContent
        },
        EmailType.IMPORTANT
      );

      console.log('郵件發送結果:', emailResult);

      if (!emailResult.success) {
        console.error('發送重設密碼郵件失敗:', emailResult.error);
        return res.status(500).json({
          message: '發送重設密碼郵件時發生錯誤',
          error: emailResult.error
        });
      }

      console.log('重置郵件發送成功');
    } else {
      console.log('找不到用戶:', email);
    }

    // 為了安全起見，無論用戶是否存在都返回相同的訊息
    return res.status(200).json({ message: '如果該電子郵件地址存在，我們已發送重設密碼的指示' });
  } catch (error) {
    console.error('重設密碼錯誤:', error);
    return res.status(500).json({
      message: '處理重設密碼請求時發生錯誤',
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
}