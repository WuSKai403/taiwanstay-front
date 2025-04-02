import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import dbConnect from '@/lib/dbConnect';
import Host from '@/models/Host';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 只允許 GET 請求
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: '方法不允許' });
  }

  try {
    // 獲取用戶 session
    const session = await getSession({ req });

    if (!session || !session.user) {
      return res.status(401).json({ success: false, message: '未授權' });
    }

    // 連接數據庫
    await dbConnect();

    const { hostId } = req.query;

    // 尋找主人記錄並確認是否為當前用戶
    const host = await Host.findById(hostId).select('userId');

    if (!host) {
      return res.status(404).json({ success: false, message: '找不到主人記錄' });
    }

    // 檢查用戶 ID 是否匹配主人的用戶 ID
    if (host.userId.toString() !== session.user.id) {
      return res.status(403).json({ success: false, message: '權限不足' });
    }

    // 驗證成功
    return res.status(200).json({ success: true, message: '驗證成功' });
  } catch (error) {
    console.error('主人權限驗證錯誤:', error);
    return res.status(500).json({ success: false, message: '伺服器錯誤' });
  }
}