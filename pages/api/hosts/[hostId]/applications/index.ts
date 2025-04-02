import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import dbConnect from '@/lib/dbConnect';
import Host from '@/models/Host';
import Application from '@/models/Application';
import Opportunity from '@/models/Opportunity';
import User from '@/models/User';
import { ApplicationStatus } from '@/models/enums/ApplicationStatus';

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

    // 驗證主人權限
    const host = await Host.findById(hostId).select('userId');

    if (!host) {
      return res.status(404).json({ success: false, message: '找不到主人記錄' });
    }

    if (host.userId.toString() !== session.user.id) {
      return res.status(403).json({ success: false, message: '權限不足' });
    }

    // 獲取查詢參數
    const {
      status,
      opportunityId,
      search,
      page = '1',
      limit = '10',
      sort = '-createdAt'
    } = req.query;

    // 構建查詢條件
    const query: any = { hostId };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (opportunityId && opportunityId !== 'all') {
      query.opportunityId = opportunityId;
    }

    // 獲取主人的所有工作機會
    const opportunities = await Opportunity.find({ hostId })
      .select('_id title')
      .sort({ createdAt: -1 });

    // 如果有搜索關鍵字，需要先獲取符合姓名的用戶 ID
    if (search && typeof search === 'string') {
      // 此處假設用戶集合中有類似的查詢方式，實際實現可能需要調整
      const users = await User.find({
        name: { $regex: search, $options: 'i' }
      }).select('_id');

      if (users.length > 0) {
        query.userId = { $in: users.map((user: { _id: string }) => user._id) };
      } else {
        // 如果沒有找到用戶，返回空結果
        return res.status(200).json({
          success: true,
          data: {
            applications: [],
            opportunities,
            total: 0,
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            pages: 0
          }
        });
      }
    }

    // 計算分頁
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // 排序方向
    const sortDirection = (sort as string).startsWith('-') ? -1 : 1;
    const sortField = (sort as string).replace(/^-/, '');
    const sortOptions: any = {};
    sortOptions[sortField] = sortDirection;

    // 獲取總數
    const total = await Application.countDocuments(query);

    // 獲取申請列表
    const applications = await Application.find(query)
      .populate('userId', 'name profileImage')
      .populate('opportunityId', 'title slug type location media')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      data: {
        applications,
        opportunities,
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('獲取主人申請列表錯誤:', error);
    return res.status(500).json({ success: false, message: '伺服器錯誤' });
  }
}