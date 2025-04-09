import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { UserRole } from '@/models/enums/UserRole';
import dbConnect from '@/lib/dbConnect';
import Host from '@/models/Host';
import User from '@/models/User';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 檢查請求方法
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '方法不允許' });
  }

  try {
    // 檢查用戶身份和權限
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ message: '未授權' });
    }

    // 確認用戶是否有管理員權限
    if (session?.user?.role !== UserRole.ADMIN && session?.user?.role !== UserRole.SUPER_ADMIN) {
      return res.status(403).json({ message: '權限不足' });
    }

    // 連接資料庫
    await dbConnect();

    // 獲取參數
    const { status = 'all', search = '', page = '1', limit = '10' } = req.query as {
      status: string;
      search: string;
      page: string;
      limit: string;
    };

    // 構建查詢條件
    const query: any = {};
    if (status !== 'all') {
      query.status = status;
    }

    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { 'contactInfo.email': searchRegex }
      ];
    }

    // 分頁設置
    const currentPage = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);
    const skip = (currentPage - 1) * pageSize;

    // 獲取總數和分頁數據
    const [totalCount, hosts] = await Promise.all([
      Host.countDocuments(query),
      Host.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean()
    ]);

    // 計算總頁數
    const totalPages = Math.ceil(totalCount / pageSize);

    // 處理主辦方數據（可以在這裡關聯用戶數據，或者進行其他數據處理）
    // 為了簡化 API 響應，我們直接返回獲取的數據

    // 返回主辦方列表和分頁信息
    return res.status(200).json({
      hosts,
      pagination: {
        currentPage,
        totalPages,
        totalCount,
        pageSize
      }
    });
  } catch (error: unknown) {
    console.error('獲取主辦方列表失敗', error);
    return res.status(500).json({
      message: '伺服器錯誤',
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
}