import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../../lib/mongodb';
import { Opportunity } from '../../../../models/index';
import { isValidObjectId } from '../../../../utils/helpers';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 只允許 POST 請求
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '方法不允許' });
  }

  // 連接到數據庫
  await connectToDatabase();

  // 獲取機會 ID
  const { id } = req.query;

  try {
    // 檢查 ID 是否有效
    if (!id || !isValidObjectId(id as string)) {
      return res.status(400).json({ message: '無效的機會ID' });
    }

    // 更新瀏覽次數
    const result = await Opportunity.updateOne(
      { _id: id },
      { $inc: { 'stats.views': 1 } }
    );

    // 檢查是否找到並更新了機會
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: '找不到該機會' });
    }

    return res.status(200).json({
      message: '瀏覽次數更新成功'
    });
  } catch (error) {
    console.error('更新瀏覽次數失敗:', error);
    return res.status(500).json({
      message: '更新瀏覽次數時發生錯誤',
      error: (error as Error).message
    });
  }
}