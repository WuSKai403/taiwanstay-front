import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import dbConnect from '@/lib/dbConnect';
import Opportunity from '@/models/Opportunity';
import { ApiError } from '@/lib/errors';
import { Types } from 'mongoose';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;
  const { slug } = req.query;
  const { startMonth, endMonth, timeSlotId } = req.query;

  await dbConnect();

  try {
    // 獲取工作機會
    const opportunity = await Opportunity.findOne({ slug });
    if (!opportunity) {
      return res.status(404).json({ success: false, message: '找不到該工作機會' });
    }

    switch (method) {
      // 獲取月份容量
      case 'GET':
        // 驗證月份參數
        if (!startMonth || !endMonth) {
          return res.status(400).json({
            success: false,
            message: '請提供開始月份和結束月份'
          });
        }

        // 驗證月份格式 (YYYY-MM)
        const monthRegex = /^\d{4}-\d{2}$/;
        if (!monthRegex.test(startMonth as string) || !monthRegex.test(endMonth as string)) {
          return res.status(400).json({
            success: false,
            message: '請提供有效的月份格式 (YYYY-MM)'
          });
        }

        if ((startMonth as string) > (endMonth as string)) {
          return res.status(400).json({
            success: false,
            message: '結束月份必須晚於或等於開始月份'
          });
        }

        // 獲取月份範圍
        const allMonths = generateMonthRange(startMonth as string, endMonth as string);

        // 構建結果
        let result: any[] = [];

        // 如果提供了時段ID，則只查詢該時段的容量
        if (timeSlotId && typeof timeSlotId === 'string' && Types.ObjectId.isValid(timeSlotId)) {
          const timeSlotObjectId = new Types.ObjectId(timeSlotId);
          const timeSlot = opportunity.timeSlots.id(timeSlotObjectId);

          if (!timeSlot) {
            return res.status(404).json({
              success: false,
              message: '找不到該時段'
            });
          }

          // 獲取月份容量
          result = allMonths.map(month => {
            const monthCapacity = timeSlot.monthlyCapacities?.find((mc: any) => mc.month === month);

            return {
              month,
              timeSlotId: timeSlot._id,
              capacity: monthCapacity ? monthCapacity.capacity : timeSlot.defaultCapacity,
              bookedCount: monthCapacity ? monthCapacity.bookedCount : 0,
              available: monthCapacity
                ? monthCapacity.capacity - monthCapacity.bookedCount
                : timeSlot.defaultCapacity,
              isAvailable: monthCapacity
                ? monthCapacity.capacity > monthCapacity.bookedCount
                : timeSlot.defaultCapacity > 0
            };
          });
        } else {
          // 查詢所有時段的月份容量
          result = allMonths.map(month => {
            const monthCapacities = opportunity.timeSlots
              .filter((ts: any) => ts.status === 'OPEN')
              .map((ts: any) => {
                const monthCapacity = ts.monthlyCapacities?.find((mc: any) => mc.month === month);

                return {
                  timeSlotId: ts._id,
                  capacity: monthCapacity ? monthCapacity.capacity : ts.defaultCapacity,
                  bookedCount: monthCapacity ? monthCapacity.bookedCount : 0,
                  available: monthCapacity
                    ? monthCapacity.capacity - monthCapacity.bookedCount
                    : ts.defaultCapacity
                };
              });

            // 計算總容量
            const totalCapacity = monthCapacities.reduce((sum: number, mc: any) => sum + mc.capacity, 0);
            const totalBooked = monthCapacities.reduce((sum: number, mc: any) => sum + mc.bookedCount, 0);
            const totalAvailable = totalCapacity - totalBooked;

            return {
              month,
              capacity: totalCapacity,
              bookedCount: totalBooked,
              available: totalAvailable,
              isAvailable: totalAvailable > 0,
              timeSlots: monthCapacities
            };
          });
        }

        return res.status(200).json({
          success: true,
          data: result
        });

      default:
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('月份容量查詢錯誤:', error);
    const statusCode = error instanceof ApiError ? error.statusCode : 500;
    const message = error instanceof ApiError ? error.message : '伺服器錯誤';
    return res.status(statusCode).json({ success: false, message });
  }
}

/**
 * 生成月份範圍
 * @param startMonth 開始月份 (YYYY-MM)
 * @param endMonth 結束月份 (YYYY-MM)
 * @returns 月份列表 (YYYY-MM 格式)
 */
function generateMonthRange(startMonth: string, endMonth: string): string[] {
  const months: string[] = [];

  // 解析開始月份
  const [startYear, startMonthNum] = startMonth.split('-').map(Number);
  const [endYear, endMonthNum] = endMonth.split('-').map(Number);

  // 設置初始月份
  let currentYear = startYear;
  let currentMonth = startMonthNum;

  // 生成每個月份
  while (
    currentYear < endYear ||
    (currentYear === endYear && currentMonth <= endMonthNum)
  ) {
    // 格式化為 YYYY-MM
    const formattedMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    months.push(formattedMonth);

    // 移至下個月
    if (currentMonth === 12) {
      currentYear++;
      currentMonth = 1;
    } else {
      currentMonth++;
    }
  }

  return months;
}