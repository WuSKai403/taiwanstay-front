import { NextApiRequest, NextApiResponse } from 'next';
import mongoose, { Types } from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]';
import Opportunity from '@/models/Opportunity';
import { TimeSlotStatus } from '@/models/enums/TimeSlotStatus';
import { ApiError } from '@/lib/errors';
import { TimeSlot } from '@/types/opportunity';
import { UserRole } from '@/models/enums';
import dbConnect from '@/lib/dbConnect';
import Host from '@/models/Host';
import { getSession } from 'next-auth/react';

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

        // 計算開始月份和結束月份（YYYY-MM格式）
        const startDate = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
        const endDate = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}`;

        // 生成月份容量
        const months = generateMonthRange(startDate, endDate);
        const monthlyCapacities = months.map(month => ({
          month,
          capacity: defaultCapacity,
          bookedCount: 0
        }));

        // 創建新時段
        const newTimeSlot: Omit<TimeSlot, '_id'> = {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          startDate,
          endDate,
          defaultCapacity,
          minimumStay: minStay,
          appliedCount: 0,
          confirmedCount: 0,
          status: TimeSlotStatus.OPEN,
          description: description || '',
          capacityOverrides: capacityOverrides || [],
          monthlyCapacities: monthlyCapacities
        };

        // 添加到工作機會
        opportunity.timeSlots.push(newTimeSlot);
        opportunity.hasTimeSlots = true;
        await opportunity.save();

        // 獲取新添加的時段
        const addedTimeSlot = opportunity.timeSlots[opportunity.timeSlots.length - 1];

        return res.status(201).json({
          success: true,
          data: addedTimeSlot,
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
