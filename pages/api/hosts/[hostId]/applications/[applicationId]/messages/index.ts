import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import dbConnect from '@/lib/dbConnect';
import Host from '@/models/Host';
import Application from '@/models/Application';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 只允許 POST 請求
  if (req.method !== 'POST') {
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

    const { hostId, applicationId } = req.query;
    const { content } = req.body;

    if (!content || typeof content !== 'string' || content.trim() === '') {
      return res.status(400).json({ success: false, message: '訊息內容不能為空' });
    }

    // 驗證主人權限
    const host = await Host.findById(hostId).select('userId');

    if (!host) {
      return res.status(404).json({ success: false, message: '找不到主人記錄' });
    }

    if (host.userId.toString() !== session.user.id) {
      return res.status(403).json({ success: false, message: '權限不足' });
    }

    // 查找申請
    const application = await Application.findOne({
      _id: applicationId,
      hostId
    });

    if (!application) {
      return res.status(404).json({ success: false, message: '找不到申請記錄' });
    }

    // 創建新訊息
    const now = new Date();

    // 初始化通訊記錄，如果不存在
    if (!application.communications) {
      application.communications = {
        messages: [],
        unreadHostMessages: 0,
        unreadUserMessages: 0
      };
    }

    // 添加新訊息
    application.communications.messages.push({
      sender: host.userId,
      content: content.trim(),
      timestamp: now,
      read: false
    });

    // 更新最後訊息時間
    application.communications.lastMessageAt = now;

    // 增加未讀訊息計數
    application.communications.unreadUserMessages += 1;

    // 保存申請
    await application.save();

    return res.status(200).json({
      success: true,
      message: '訊息已發送',
      data: {
        sender: host.userId,
        content: content.trim(),
        timestamp: now,
        read: false
      }
    });
  } catch (error) {
    console.error('發送訊息錯誤:', error);
    return res.status(500).json({ success: false, message: '伺服器錯誤' });
  }
}