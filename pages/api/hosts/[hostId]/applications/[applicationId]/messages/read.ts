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

    // 如果沒有通訊記錄，則直接返回
    if (!application.communications || !application.communications.messages) {
      return res.status(200).json({
        success: true,
        message: '沒有需要標記的訊息'
      });
    }

    // 標記主人未讀的訊息為已讀
    let hasUpdates = false;

    if (application.communications.unreadHostMessages > 0) {
      application.communications.messages.forEach((message: { sender: any; read: boolean }) => {
        // 如果是用戶發送的訊息且未讀
        if (message.sender.toString() === application.userId.toString() && !message.read) {
          message.read = true;
          hasUpdates = true;
        }
      });

      // 重置未讀計數
      if (hasUpdates) {
        application.communications.unreadHostMessages = 0;
      }
    }

    if (hasUpdates) {
      await application.save();
    }

    return res.status(200).json({
      success: true,
      message: hasUpdates ? '訊息已標記為已讀' : '沒有需要標記的訊息'
    });
  } catch (error) {
    console.error('標記訊息已讀錯誤:', error);
    return res.status(500).json({ success: false, message: '伺服器錯誤' });
  }
}