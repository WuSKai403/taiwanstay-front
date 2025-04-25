import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb';
import Opportunity from '@/models/Opportunity';
import Host from '@/models/Host';
import { requireAuth, requireHostOwnerOrAdmin } from '@/lib/middleware/authMiddleware';

// 主人機會列表處理函數
async function getHostOpportunities(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 連接數據庫
    await connectToDatabase();

    // 獲取主人 ID
    const { hostId } = req.query;

    // 檢查是否需要權限控制 (查詢參數中的 all=true 表示請求所有機會)
    const showAll = req.query.all === 'true';

    // 構建查詢條件
    let query: any = { hostId: hostId };

    // 如果不是查詢所有機會，則只顯示已發布的機會
    if (!showAll) {
      query.status = 'PUBLISHED';
    }

    // 獲取查詢參數
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const sort = (req.query.sort as string) || '-createdAt'; // 默認按創建時間降序

    // 獲取機會總數
    const total = await Opportunity.countDocuments(query);

    // 獲取機會列表
    const opportunities = await Opportunity.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('hostId', 'name description status')
      .lean();

    // 返回結果
    return res.status(200).json({
      success: true,
      count: opportunities.length,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      opportunities: JSON.parse(JSON.stringify(opportunities))
    });
  } catch (error) {
    console.error('獲取主人機會列表時出錯:', error);
    return res.status(500).json({ success: false, message: '服務器錯誤' });
  }
}

// 路由處理函數
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 僅處理 GET 請求
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: '方法不允許' });
  }

  const { hostId, all } = req.query;

  // 如果請求查看所有機會，需要進行權限檢查
  if (all === 'true') {
    // 使用權限中間件檢查是否為主人擁有者或管理員
    return requireHostOwnerOrAdmin(req => req.query.hostId as string)(getHostOpportunities)(req, res);
  }
  // 如果只查看已發布機會，不需要特殊權限
  else {
    return getHostOpportunities(req, res);
  }
}
