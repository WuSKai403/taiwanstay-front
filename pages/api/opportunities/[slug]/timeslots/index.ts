import { NextApiRequest, NextApiResponse } from 'next';
import mongoose, { Types } from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]';
import Opportunity from '@/models/Opportunity';
import DateCapacity from '@/models/DateCapacity';
import { TimeSlotStatus } from '@/models/enums/TimeSlotStatus';
import { ApiError } from '@/lib/errors';
import { TimeSlot } from '@/types/opportunity';
import { UserRole } from '@/models/enums';
import dbConnect from '@/lib/dbConnect';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;
  const { slug } = req.query;

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

    switch (method) {
      // 獲取所有時段
      case 'GET':
        return res.status(200).json({
          success: true,
          data: opportunity.timeSlots || []
        });

      // 添加新時段
      case 'POST':
        const { startDate, endDate, defaultCapacity, minimumStay, capacityOverrides, description } = req.body;

        // 驗證必要欄位
        if (!startDate || !endDate || !defaultCapacity) {
          return res.status(400).json({
            success: false,
            message: '請提供所有必要欄位'
          });
        }

        // 驗證日期
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          return res.status(400).json({
            success: false,
            message: '請提供有效的日期格式'
          });
        }

        if (start >= end) {
          return res.status(400).json({
            success: false,
            message: '結束日期必須晚於開始日期'
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

        // 驗證容量覆蓋
        if (capacityOverrides && Array.isArray(capacityOverrides)) {
          for (const override of capacityOverrides) {
            if (!override.startDate || !override.endDate || !override.capacity) {
              return res.status(400).json({
                success: false,
                message: '容量覆蓋必須包含開始日期、結束日期和容量'
              });
            }

            const overrideStart = new Date(override.startDate);
            const overrideEnd = new Date(override.endDate);

            if (isNaN(overrideStart.getTime()) || isNaN(overrideEnd.getTime())) {
              return res.status(400).json({
                success: false,
                message: '請提供有效的日期格式'
              });
            }

            if (overrideStart >= overrideEnd) {
              return res.status(400).json({
                success: false,
                message: '覆蓋結束日期必須晚於開始日期'
              });
            }

            if (overrideStart < start || overrideEnd > end) {
              return res.status(400).json({
                success: false,
                message: '覆蓋日期範圍必須在時段日期範圍內'
              });
            }

            if (override.capacity < 1) {
              return res.status(400).json({
                success: false,
                message: '覆蓋容量必須大於0'
              });
            }
          }
        }

        // 創建新時段
        const newTimeSlot: Omit<TimeSlot, '_id'> = {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          defaultCapacity,
          minimumStay: minStay,
          appliedCount: 0,
          confirmedCount: 0,
          status: TimeSlotStatus.OPEN,
          description: description || '',
          capacityOverrides: capacityOverrides || []
        };

        // 添加到工作機會
        opportunity.timeSlots.push(newTimeSlot);
        opportunity.hasTimeSlots = true;
        await opportunity.save();

        // 獲取新添加的時段ID
        const timeSlotId = opportunity.timeSlots[opportunity.timeSlots.length - 1]._id;

        // 初始化月份容量
        await initializeMonthCapacities(opportunity._id, timeSlotId, opportunity.timeSlots[opportunity.timeSlots.length - 1]);

        return res.status(201).json({
          success: true,
          data: newTimeSlot,
          message: '時段添加成功'
        });

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('時段管理錯誤:', error);
    const statusCode = error instanceof ApiError ? error.statusCode : 500;
    const message = error instanceof ApiError ? error.message : '伺服器錯誤';
    return res.status(statusCode).json({ success: false, message });
  }
}

/**
 * 初始化月份容量記錄
 * @param opportunityId 機會ID
 * @param timeSlotId 時段ID
 * @param timeSlot 時段物件
 */
async function initializeMonthCapacities(
  opportunityId: mongoose.Types.ObjectId,
  timeSlotId: mongoose.Types.ObjectId,
  timeSlot: any
) {
  try {
    // 檢查時段是否有開始和結束月份
    if (!timeSlot.startMonth || !timeSlot.endMonth) {
      return;
    }

    // 解析開始和結束月份
    const startParts = timeSlot.startMonth.split('-').map((part: string) => parseInt(part));
    const endParts = timeSlot.endMonth.split('-').map((part: string) => parseInt(part));

    if (startParts.length !== 2 || endParts.length !== 2) {
      throw new Error('月份格式不正確，應為 YYYY-MM');
    }

    const startYear = startParts[0];
    const startMonth = startParts[1];
    const endYear = endParts[0];
    const endMonth = endParts[1];

    // 取得 timeSlot 所在的 opportunity
    const opportunity = await Opportunity.findById(opportunityId);
    if (!opportunity) {
      throw new Error('找不到對應的機會');
    }

    // 生成所有需要的月份
    const monthCapacities = [];
    let currentYear = startYear;
    let currentMonth = startMonth;

    while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
      const monthString = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

      monthCapacities.push({
        date: monthString,
        opportunityId,
        timeSlotId,
        opportunitySlug: opportunity.slug,
        capacity: timeSlot.defaultCapacity || 1,
        bookedCount: 0
      });

      // 移至下個月
      if (currentMonth === 12) {
        currentYear++;
        currentMonth = 1;
      } else {
        currentMonth++;
      }
    }

    // 批量插入月份容量記錄
    if (monthCapacities.length > 0) {
      await DateCapacity.deleteMany({ opportunityId, timeSlotId });
      await DateCapacity.insertMany(monthCapacities);
    }

    console.log(`已為時段 ${timeSlotId} 創建 ${monthCapacities.length} 筆月份容量記錄`);
  } catch (error) {
    console.error('初始化月份容量時出錯:', error);
    throw error;
  }
}