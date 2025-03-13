import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb';
import Host from '@/models/Host';
import Opportunity from '@/models/Opportunity';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '只允許 GET 請求' });
  }

  try {
    await connectToDatabase();

    const {
      search,
      city,
      minRating,
      page = '1',
      limit = '12',
    } = req.query;

    // 構建查詢條件
    const query: any = {};

    // 搜尋條件
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // 城市過濾
    if (city) {
      query['location.city'] = city;
    }

    // 評分過濾
    if (minRating) {
      query['rating.average'] = { $gte: Number(minRating) };
    }

    // 分頁
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // 獲取主辦方列表
    const hosts = await Host.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber)
      .lean();

    // 獲取總數
    const total = await Host.countDocuments(query);

    // 獲取每個主辦方的機會數量
    const hostsWithOpportunityCount = await Promise.all(
      hosts.map(async (host) => {
        const opportunityCount = await Opportunity.countDocuments({ hostId: host._id });
        return {
          ...host,
          opportunityCount,
        };
      })
    );

    return res.status(200).json({
      hosts: JSON.parse(JSON.stringify(hostsWithOpportunityCount)),
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        pages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error) {
    console.error('獲取主辦方列表失敗:', error);
    return res.status(500).json({ message: '獲取主辦方列表失敗' });
  }
}