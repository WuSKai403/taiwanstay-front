import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../../lib/mongodb';
import { Opportunity } from '../../../../models/index';
import { isValidObjectId } from '../../../../utils/helpers';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 只允許 POST 請求
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '只允許 POST 請求' });
  }

  const { slug } = req.query;

  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ message: '機會 ID 無效' });
  }

  try {
    // 連接到數據庫
    await connectToDatabase();

    // 查找機會
    const opportunity = await Opportunity.findOne({
      $or: [
        { _id: isValidObjectId(slug) ? new ObjectId(slug) : null },
        { slug: slug },
        { publicId: slug }
      ]
    });

    if (!opportunity) {
      return res.status(404).json({ message: '找不到機會' });
    }

    // 增加瀏覽次數
    await Opportunity.findByIdAndUpdate(opportunity._id, {
      $inc: { 'stats.views': 1 }
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('增加機會瀏覽次數失敗:', error);
    return res.status(500).json({ message: '增加機會瀏覽次數失敗' });
  }
}