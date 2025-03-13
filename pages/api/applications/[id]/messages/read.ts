import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]';
import { connectToDatabase } from '@/lib/mongodb';
import Application from '@/models/Application';

// 定義訊息接口
interface Message {
  sender: string;
  content: string;
  timestamp: Date;
  read: boolean;
  _id?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 只允許POST請求
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, message: '方法不允許' });
    }

    await connectToDatabase();

    // 獲取用戶會話
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ success: false, message: '未授權' });
    }

    const { id } = req.query;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ success: false, message: '無效的申請ID' });
    }

    // 查詢申請
    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ success: false, message: '申請不存在' });
    }

    // 檢查權限：只有申請者可以標記主辦方訊息為已讀
    const isApplicant = application.userId.toString() === session.user.id;
    if (!isApplicant) {
      return res.status(403).json({ success: false, message: '無權執行此操作' });
    }

    // 標記訊息為已讀
    application.communications.unreadUserMessages = 0;

    // 更新所有訊息的已讀狀態
    application.communications.messages = application.communications.messages.map((msg: Message) => {
      if (msg.sender !== session.user.id && !msg.read) {
        return { ...msg, read: true };
      }
      return msg;
    });

    // 保存更新
    await application.save();

    return res.status(200).json({
      success: true,
      message: '訊息已標記為已讀'
    });
  } catch (error: any) {
    console.error('標記訊息為已讀錯誤:', error);
    return res.status(500).json({ success: false, message: '伺服器錯誤', error: error.message });
  }
}
