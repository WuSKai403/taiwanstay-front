import { NextApiRequest, NextApiResponse } from 'next';
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
      return res.status(401).json({ message: '無效的電子郵件或密碼' });
    }

    // 從請求體中獲取登入憑證
    const { email, password } = req.body;

    // 基本驗證
    if (!email || !password) {
      return res.status(400).json({ message: '缺少電子郵件或密碼' });
    }

    // 查找用戶
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: '無效的電子郵件或密碼' });
    }

    // 驗證密碼
    // 注意：在實際應用中，應該使用bcrypt等工具比較加密後的密碼
    if (user.password !== password) {
      return res.status(401).json({ message: '無效的電子郵件或密碼' });
    }

    // 生成令牌（在實際應用中，應該使用JWT等工具）
    const token = `mock-token-${Date.now()}`;

    // 返回成功響應（不包含密碼）
    return res.status(200).json({
      message: '登入成功',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('用戶登入失敗:', error);
    return res.status(500).json({ message: '登入過程中發生錯誤' });
  }
}