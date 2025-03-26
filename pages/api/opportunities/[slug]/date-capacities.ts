import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import dbConnect from '@/lib/dbConnect';
import Opportunity from '@/models/Opportunity';
import DateCapacity from '@/models/DateCapacity';
import { ApiError } from '@/lib/errors';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;
  const { slug } = req.query;
  const { startDate, endDate, timeSlotId } = req.query;

  await dbConnect();

  try {
    // 獲取工作機會
    const opportunity = await Opportunity.findOne({ slug });
    if (!opportunity) {
      return res.status(404).json({ success: false, message: '找不到該工作機會' });
    }

    switch (method) {
      // 獲取日期容量
      case 'GET':
        // 驗證日期參數
        if (!startDate || !endDate) {
          return res.status(400).json({
            success: false,
            message: '請提供開始日期和結束日期'
          });
        }

        const start = new Date(startDate as string);
        const end = new Date(endDate as string);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          return res.status(400).json({
            success: false,
            message: '請提供有效的日期格式'
          });
        }

        if (start > end) {
          return res.status(400).json({
            success: false,
            message: '結束日期必須晚於或等於開始日期'
          });
        }

        // 獲取所有日期
        const allDates = [];
        const currentDate = new Date(start);

        while (currentDate <= end) {
          allDates.push(formatDate(currentDate));
          currentDate.setDate(currentDate.getDate() + 1);
        }

        // 構建查詢條件
        const query: any = {
          opportunityId: opportunity._id,
          date: { $in: allDates }
        };

        // 如果提供了時段ID，則只查詢該時段的容量
        if (timeSlotId) {
          query.timeSlotId = timeSlotId;
        }

        // 查詢日期容量
        const dateCapacities = await DateCapacity.find(query);

        // 構建結果
        const result = allDates.map(date => {
          const capacity = dateCapacities.find(c => c.date === date);
          return {
            date,
            capacity: capacity ? capacity.capacity : 0,
            bookedCount: capacity ? capacity.bookedCount : 0,
            available: capacity ? capacity.capacity - capacity.bookedCount : 0,
            isAvailable: capacity ? capacity.capacity > capacity.bookedCount : false
          };
        });

        return res.status(200).json({
          success: true,
          data: result
        });

      default:
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('日期容量查詢錯誤:', error);
    const statusCode = error instanceof ApiError ? error.statusCode : 500;
    const message = error instanceof ApiError ? error.message : '伺服器錯誤';
    return res.status(statusCode).json({ success: false, message });
  }
}

// 日期格式化輔助函數
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}