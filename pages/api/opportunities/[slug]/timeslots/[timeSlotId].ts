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
        const { startDate, endDate, defaultCapacity, minimumStay, capacityOverrides, description, status } = req.body;

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

        // 驗證狀態
        if (status && !Object.values(TimeSlotStatus).includes(status as TimeSlotStatus)) {
          return res.status(400).json({
            success: false,
            message: '無效的時段狀態'
          });
        }

        // 更新時段
        timeSlot.startDate = start;
        timeSlot.endDate = end;
        timeSlot.defaultCapacity = defaultCapacity;
        timeSlot.minimumStay = minStay;
        timeSlot.description = description || '';
        timeSlot.capacityOverrides = capacityOverrides || [];

        // 只有在提供狀態時才更新
        if (status) {
          timeSlot.status = status as TimeSlotStatus;
        }

        await opportunity.save();

        // 更新日期容量
        const DateCapacity = mongoose.model('DateCapacity');

        // 刪除現有的容量記錄
        await DateCapacity.deleteMany({ opportunityId: opportunity._id, timeSlotId: timeSlotObjectId });

        // 重新初始化日期容量
        await initializeDateCapacities(opportunity._id, timeSlotObjectId, timeSlot);

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

        // 刪除相關的日期容量記錄
        const DateCapacityModel = mongoose.model('DateCapacity');
        await DateCapacityModel.deleteMany({ opportunityId: opportunity._id, timeSlotId: timeSlotObjectId });

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

// 初始化日期容量的輔助函數
async function initializeDateCapacities(
  opportunityId: Types.ObjectId,
  timeSlotId: Types.ObjectId,
  timeSlot: TimeSlot
) {
  const DateCapacity = mongoose.model('DateCapacity');

  // 獲取所有日期
  const allDates = [];
  const currentDate = new Date(timeSlot.startDate);
  const endDate = new Date(timeSlot.endDate);

  while (currentDate <= endDate) {
    allDates.push(formatDate(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // 為每一天創建容量記錄
  const dateCapacities = [];

  for (const date of allDates) {
    // 找到該日期適用的容量覆蓋
    const applicableOverride = timeSlot.capacityOverrides?.find(override => {
      const overrideStart = new Date(override.startDate);
      const overrideEnd = new Date(override.endDate);
      const currentDate = parseDate(date);
      return currentDate >= overrideStart && currentDate <= overrideEnd;
    });

    // 使用覆蓋容量或默認容量
    const capacity = applicableOverride ? applicableOverride.capacity : timeSlot.defaultCapacity;

    dateCapacities.push({
      date,
      opportunityId,
      timeSlotId,
      capacity,
      bookedCount: 0
    });
  }

  // 批量插入
  if (dateCapacities.length > 0) {
    await DateCapacity.insertMany(dateCapacities);
  }
}

// 日期格式化輔助函數
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function parseDate(dateString: string): Date {
  return new Date(dateString);
}