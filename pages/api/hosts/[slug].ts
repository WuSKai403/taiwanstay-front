import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb';
import Host from '@/models/Host';
import Opportunity from '@/models/Opportunity';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug } = req.query;

  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ message: '主辦方 ID 無效' });
  }

  try {
    await connectToDatabase();

    // 根據請求方法處理不同操作
    switch (req.method) {
      case 'GET':
        return await getHostDetail(req, res, slug);
      default:
        return res.status(405).json({ message: '方法不允許' });
    }
  } catch (error) {
    console.error('主辦方 API 錯誤:', error);
    return res.status(500).json({ message: '伺服器錯誤' });
  }
}

// 獲取主辦方詳情
async function getHostDetail(req: NextApiRequest, res: NextApiResponse, slug: string) {
  try {
    // 檢查 ID 是否為有效的 ObjectId
    let hostQuery = {};
    if (ObjectId.isValid(slug)) {
      hostQuery = { _id: new ObjectId(slug) };
    } else {
      // 如果不是有效的 ObjectId，可能是自定義 ID
      hostQuery = { publicId: slug };
    }

    // 獲取主辦方詳情
    const host = await Host.findOne(hostQuery).lean();

    if (!host) {
      return res.status(404).json({ message: '找不到主辦方' });
    }

    // 將 host 轉換為 JSON 字符串再解析回來，以確保 _id 被正確處理
    const hostData = JSON.parse(JSON.stringify(host));

    // 獲取該主辦方的機會列表
    const opportunities = await Opportunity.find({ hostId: hostData._id })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      host: hostData,
      opportunities: JSON.parse(JSON.stringify(opportunities)),
    });
  } catch (error) {
    console.error('獲取主辦方詳情失敗:', error);
    return res.status(500).json({ message: '獲取主辦方詳情失敗' });
  }
}