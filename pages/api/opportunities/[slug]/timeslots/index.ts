import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import dbConnect from '@/lib/dbConnect';
import Opportunity from '@/models/Opportunity';
import Host from '@/models/Host';
import { UserRole } from '@/models/enums';
import { TimeSlotStatus } from '@/models/enums/TimeSlotStatus';
import { ApiError } from '@/lib/errors';
import mongoose from 'mongoose';

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
        const newTimeSlot = {
          startDate: start,
          endDate: end,
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

        // 初始化日期容量
        await initializeDateCapacities(opportunity._id, timeSlotId, newTimeSlot);

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

// 初始化日期容量的輔助函數
async function initializeDateCapacities(opportunityId, timeSlotId, timeSlot) {
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
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function parseDate(dateString) {
  return new Date(dateString);
}