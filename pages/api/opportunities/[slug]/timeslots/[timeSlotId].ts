import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]';
import dbConnect from '@/lib/dbConnect';
import Opportunity from '@/models/Opportunity';
import { UserRole } from '@/models/enums';
import { TimeSlotStatus } from '@/models/enums/TimeSlotStatus';
import { ApiError } from '@/lib/errors';
import mongoose, { Types } from 'mongoose';
import { TimeSlot } from '@/types/opportunity';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;
  const { slug, timeSlotId } = req.query;

  // 確保 timeSlotId 是有效的 ObjectId
  if (!timeSlotId || typeof timeSlotId !== 'string' || !Types.ObjectId.isValid(timeSlotId)) {
    return res.status(400).json({ success: false, message: '無效的時段 ID' });
  }

  const timeSlotObjectId = new Types.ObjectId(timeSlotId);

  await dbConnect();

  // 檢查用戶身份
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ success: false, message: '請先登入' });
  }

  try {
    // 獲取工作機會
    const opportunity = await Opportunity.findOne({ slug });
    if (!opportunity) {
      return res.status(404).json({ success: false, message: '找不到該工作機會' });
    }

    // 檢查是否為主人或管理員
    const isAdmin = session.user.role === UserRole.ADMIN;
    const isHost = session.user.role === UserRole.HOST && opportunity.hostId.toString() === session.user.hostId;

    if (!isAdmin && !isHost) {
      return res.status(403).json({ success: false, message: '權限不足' });
    }

    // 檢查時段是否存在
    const timeSlot = opportunity.timeSlots.id(timeSlotObjectId);
    if (!timeSlot) {
      return res.status(404).json({ success: false, message: '找不到該時段' });
    }

    switch (method) {
      // 獲取時段詳情
      case 'GET':
        return res.status(200).json({
          success: true,
          data: timeSlot
        });

      // 更新時段
      case 'PUT':
        const { startDate, endDate, defaultCapacity, minimumStay, description, status } = req.body;

        // 驗證必要欄位
        if (!startDate || !endDate || !defaultCapacity) {
          return res.status(400).json({
            success: false,
            message: '請提供所有必要欄位'
          });
        }

        // 驗證日期格式 (YYYY-MM)
        const startDateRegex = /^\d{4}-\d{2}$/;
        const endDateRegex = /^\d{4}-\d{2}$/;

        if (!startDateRegex.test(startDate) || !endDateRegex.test(endDate)) {
          return res.status(400).json({
            success: false,
            message: '請提供有效的月份格式 (YYYY-MM)'
          });
        }

        // 比較開始和結束月份
        if (startDate >= endDate) {
          return res.status(400).json({
            success: false,
            message: '結束月份必須晚於開始月份'
          });
        }

        // 驗證容量
        if (defaultCapacity < 1) {
          return res.status(400).json({
            success: false,
            message: '容量必須大於0'
          });
        }

        // 驗證最短停留時間
        const minStay = minimumStay || 14; // 默認為 14 天
        if (minStay < 1) {
          return res.status(400).json({
            success: false,
            message: '最短停留時間必須大於0'
          });
        }

        // 驗證狀態
        if (status && !Object.values(TimeSlotStatus).includes(status as TimeSlotStatus)) {
          return res.status(400).json({
            success: false,
            message: '無效的時段狀態'
          });
        }

        // 更新時段
        timeSlot.startDate = startDate;
        timeSlot.endDate = endDate;
        timeSlot.defaultCapacity = defaultCapacity;
        timeSlot.minimumStay = minStay;
        timeSlot.description = description || '';

        // 只有在提供狀態時才更新
        if (status) {
          timeSlot.status = status as TimeSlotStatus;
        }

        // 生成月份範圍
        const months = generateMonthRange(startDate, endDate);

        // 保留已有月份的預訂數量
        const updatedMonthlyCapacities = months.map(month => {
          // 檢查是否已有該月份的容量記錄
          const existingCapacity = timeSlot.monthlyCapacities?.find(
            (mc: any) => mc.month === month
          );

          return {
            month,
            capacity: defaultCapacity,
            bookedCount: existingCapacity ? existingCapacity.bookedCount : 0
          };
        });

        // 更新時段的月份容量
        timeSlot.monthlyCapacities = updatedMonthlyCapacities;

        await opportunity.save();

        return res.status(200).json({
          success: true,
          data: timeSlot,
          message: '時段更新成功'
        });

      // 刪除時段
      case 'DELETE':
        // 檢查是否有相關申請
        const Application = mongoose.model('Application');
        const hasApplications = await Application.exists({ timeSlotId: timeSlotObjectId });

        if (hasApplications) {
          return res.status(400).json({
            success: false,
            message: '該時段已有申請，無法刪除'
          });
        }

        // 刪除時段
        opportunity.timeSlots.id(timeSlotObjectId).remove();

        // 如果沒有時段了，更新 hasTimeSlots 欄位
        if (opportunity.timeSlots.length === 0) {
          opportunity.hasTimeSlots = false;
        }

        await opportunity.save();

        return res.status(200).json({
          success: true,
          message: '時段刪除成功'
        });

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('時段詳情錯誤:', error);
    const statusCode = error instanceof ApiError ? error.statusCode : 500;
    const message = error instanceof ApiError ? error.message : '伺服器錯誤';
    return res.status(statusCode).json({ success: false, message });
  }
}

/**
 * 生成月份範圍
 * @param startDate 開始月份 (YYYY-MM)
 * @param endDate 結束月份 (YYYY-MM)
 * @returns 月份列表 (YYYY-MM 格式)
 */
function generateMonthRange(startDate: string, endDate: string): string[] {
  const months: string[] = [];

  // 解析開始月份
  const [startYear, startDateNum] = startDate.split('-').map(Number);
  const [endYear, endDateNum] = endDate.split('-').map(Number);

  // 設置初始月份
  let currentYear = startYear;
  let currentMonth = startDateNum;

  // 生成每個月份
  while (
    currentYear < endYear ||
    (currentYear === endYear && currentMonth <= endDateNum)
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