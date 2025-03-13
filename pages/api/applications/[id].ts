import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectToDatabase } from '@/lib/mongodb';
import Application from '@/models/Application';
import { ApplicationStatus } from '@/models/enums/ApplicationStatus';
import { UserRole } from '@/types';
import mongoose from 'mongoose';
import { isAdmin, canAccessApplication } from '@/utils/roleUtils';

/**
 * @swagger
 * /api/applications/{id}:
 *   get:
 *     summary: 獲取特定申請
 *     description: 根據ID獲取特定申請的詳細資訊
 *     parameters:
 *       - name: id
 *         in: path
 *         description: 申請ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功獲取申請
 *       404:
 *         description: 申請不存在
 *       500:
 *         description: 伺服器錯誤
 *   put:
 *     summary: 更新申請
 *     description: 更新特定申請的資訊
 *     parameters:
 *       - name: id
 *         in: path
 *         description: 申請ID
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [DRAFT, PENDING, REVIEWING, ACCEPTED, REJECTED, CONFIRMED, CANCELLED, COMPLETED, WITHDRAWN]
 *               statusNote:
 *                 type: string
 *               applicationDetails:
 *                 type: object
 *               reviewDetails:
 *                 type: object
 *               confirmationDetails:
 *                 type: object
 *               cancellationDetails:
 *                 type: object
 *               completionDetails:
 *                 type: object
 *     responses:
 *       200:
 *         description: 申請更新成功
 *       400:
 *         description: 請求參數錯誤
 *       401:
 *         description: 未授權
 *       404:
 *         description: 申請不存在
 *       500:
 *         description: 伺服器錯誤
 *   delete:
 *     summary: 刪除申請
 *     description: 刪除特定申請
 *     parameters:
 *       - name: id
 *         in: path
 *         description: 申請ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 申請刪除成功
 *       401:
 *         description: 未授權
 *       404:
 *         description: 申請不存在
 *       500:
 *         description: 伺服器錯誤
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();

    const { id } = req.query;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ success: false, message: '無效的申請ID' });
    }

    switch (req.method) {
      case 'GET':
        return getApplication(req, res, id);
      case 'PUT':
        return updateApplication(req, res, id);
      case 'DELETE':
        return deleteApplication(req, res, id);
      default:
        return res.status(405).json({ success: false, message: '方法不允許' });
    }
  } catch (error: any) {
    console.error('申請API錯誤:', error);
    return res.status(500).json({ success: false, message: '伺服器錯誤', error: error.message });
  }
}

/**
 * 獲取特定申請
 */
async function getApplication(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    // 檢查用戶是否已登入
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ success: false, message: '未授權' });
    }

    // 獲取申請
    const application = await Application.findById(id)
      .populate('opportunityId', 'title slug location')
      .populate('hostId', 'name slug')
      .populate('userId', 'name email')
      .select('-__v');

    if (!application) {
      return res.status(404).json({ success: false, message: '申請不存在' });
    }

    // 檢查權限：只有管理員、申請者和主人可以查看申請
    if (!canAccessApplication(
      session.user,
      application.userId._id.toString(),
      application.hostId._id.toString()
    )) {
      return res.status(403).json({ success: false, message: '無權訪問此申請' });
    }

    return res.status(200).json({
      success: true,
      data: application
    });
  } catch (error: any) {
    console.error('獲取申請錯誤:', error);
    return res.status(500).json({ success: false, message: '獲取申請失敗', error: error.message });
  }
}

/**
 * 更新申請
 */
async function updateApplication(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    // 檢查用戶是否已登入
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ success: false, message: '未授權' });
    }

    // 獲取申請
    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ success: false, message: '申請不存在' });
    }

    // 檢查權限：只有管理員、申請者和主人可以更新申請
    const userIsAdmin = isAdmin(session.user);
    const isApplicant = application.userId.toString() === session.user.id;
    const isHost = application.hostId.toString() === session.user.id;

    if (!userIsAdmin && !isApplicant && !isHost) {
      return res.status(403).json({ success: false, message: '無權更新此申請' });
    }

    const {
      status,
      statusNote,
      applicationDetails,
      reviewDetails,
      confirmationDetails,
      cancellationDetails,
      completionDetails
    } = req.body;

    // 根據用戶角色限制可更新的欄位
    const updateData: any = {};

    // 申請者可以更新的欄位
    if (isApplicant) {
      // 申請者只能在特定狀態下更新申請
      if (application.status === ApplicationStatus.DRAFT) {
        if (applicationDetails) updateData.applicationDetails = applicationDetails;
        if (status === ApplicationStatus.PENDING) updateData.status = status;
      }

      // 申請者可以撤回申請
      if (status === ApplicationStatus.WITHDRAWN &&
          [ApplicationStatus.DRAFT, ApplicationStatus.PENDING, ApplicationStatus.REVIEWING].includes(application.status as ApplicationStatus)) {
        updateData.status = status;
        updateData.statusNote = statusNote;
      }
    }

    // 主人可以更新的欄位
    if (isHost) {
      // 主人可以審核申請
      if ([ApplicationStatus.REVIEWING, ApplicationStatus.ACCEPTED, ApplicationStatus.REJECTED].includes(status as ApplicationStatus) &&
          [ApplicationStatus.PENDING, ApplicationStatus.REVIEWING].includes(application.status as ApplicationStatus)) {
        updateData.status = status;
        updateData.statusNote = statusNote;

        if (reviewDetails) {
          updateData.reviewDetails = {
            ...reviewDetails,
            reviewedBy: session.user.id,
            reviewedAt: new Date()
          };
        }
      }

      // 主人可以確認申請
      if (status === ApplicationStatus.CONFIRMED && application.status === ApplicationStatus.ACCEPTED) {
        updateData.status = status;

        if (confirmationDetails) {
          updateData.confirmationDetails = {
            ...confirmationDetails,
            confirmedBy: session.user.id,
            confirmedAt: new Date()
          };
        }
      }

      // 主人可以取消申請
      if (status === ApplicationStatus.CANCELLED &&
          [ApplicationStatus.ACCEPTED, ApplicationStatus.CONFIRMED].includes(application.status as ApplicationStatus)) {
        updateData.status = status;

        if (cancellationDetails) {
          updateData.cancellationDetails = {
            ...cancellationDetails,
            cancelledBy: session.user.id,
            cancelledAt: new Date(),
            initiatedBy: 'host'
          };
        }
      }

      // 主人可以完成申請
      if (status === ApplicationStatus.COMPLETED && application.status === ApplicationStatus.CONFIRMED) {
        updateData.status = status;

        if (completionDetails) {
          updateData.completionDetails = {
            ...completionDetails,
            completedAt: new Date()
          };
        }
      }
    }

    // 管理員可以更新所有欄位
    if (userIsAdmin) {
      if (status) updateData.status = status;
      if (statusNote) updateData.statusNote = statusNote;
      if (applicationDetails) updateData.applicationDetails = applicationDetails;
      if (reviewDetails) updateData.reviewDetails = reviewDetails;
      if (confirmationDetails) updateData.confirmationDetails = confirmationDetails;
      if (cancellationDetails) updateData.cancellationDetails = cancellationDetails;
      if (completionDetails) updateData.completionDetails = completionDetails;
    }

    // 如果沒有可更新的欄位，返回錯誤
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: '無可更新的欄位或無權進行此操作' });
    }

    // 更新申請
    const updatedApplication = await Application.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: '申請更新成功',
      data: updatedApplication
    });
  } catch (error: any) {
    console.error('更新申請錯誤:', error);
    return res.status(500).json({ success: false, message: '更新申請失敗', error: error.message });
  }
}

/**
 * 刪除申請
 */
async function deleteApplication(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    // 檢查用戶是否已登入
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ success: false, message: '未授權' });
    }

    // 獲取申請
    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ success: false, message: '申請不存在' });
    }

    // 檢查權限：只有管理員和申請者可以刪除申請，且只能刪除草稿狀態的申請
    const userIsAdmin = isAdmin(session.user);
    const isApplicant = application.userId.toString() === session.user.id;

    if (!userIsAdmin && !isApplicant) {
      return res.status(403).json({ success: false, message: '無權刪除此申請' });
    }

    if (!userIsAdmin && application.status !== ApplicationStatus.DRAFT) {
      return res.status(400).json({ success: false, message: '只能刪除草稿狀態的申請' });
    }

    // 刪除申請
    await Application.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: '申請刪除成功'
    });
  } catch (error: any) {
    console.error('刪除申請錯誤:', error);
    return res.status(500).json({ success: false, message: '刪除申請失敗', error: error.message });
  }
}