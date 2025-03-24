import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Application from '@/models/Application';
import Opportunity from '@/models/Opportunity';
import Host from '@/models/Host';
import { ApplicationStatus } from '@/models/enums/ApplicationStatus';
import { isAdmin } from '@/utils/roleUtils';

/**
 * @swagger
 * /api/applications:
 *   get:
 *     summary: 獲取申請列表
 *     description: 獲取申請列表，可以根據查詢參數進行過濾
 *     parameters:
 *       - name: limit
 *         in: query
 *         description: 每頁顯示的數量
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *       - name: page
 *         in: query
 *         description: 頁碼
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: status
 *         in: query
 *         description: 申請狀態
 *         required: false
 *         schema:
 *           type: string
 *           enum: [DRAFT, PENDING, REVIEWING, ACCEPTED, REJECTED, CONFIRMED, CANCELLED, COMPLETED, WITHDRAWN]
 *       - name: opportunityId
 *         in: query
 *         description: 工作機會ID
 *         required: false
 *         schema:
 *           type: string
 *       - name: hostId
 *         in: query
 *         description: 主人ID
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功獲取申請列表
 *       400:
 *         description: 請求參數錯誤
 *       401:
 *         description: 未授權
 *       500:
 *         description: 伺服器錯誤
 *   post:
 *     summary: 創建申請
 *     description: 創建新的申請
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - opportunityId
 *               - applicationDetails
 *             properties:
 *               opportunityId:
 *                 type: string
 *               applicationDetails:
 *                 type: object
 *                 required:
 *                   - message
 *                   - startDate
 *                   - duration
 *                 properties:
 *                   message:
 *                     type: string
 *                   startDate:
 *                     type: string
 *                     format: date
 *                   endDate:
 *                     type: string
 *                     format: date
 *                   duration:
 *                     type: integer
 *                   travelingWith:
 *                     type: object
 *                   answers:
 *                     type: array
 *                   specialRequirements:
 *                     type: string
 *                   dietaryRestrictions:
 *                     type: array
 *                   languages:
 *                     type: array
 *                   relevantExperience:
 *                     type: string
 *                   motivation:
 *                     type: string
 *     responses:
 *       201:
 *         description: 申請創建成功
 *       400:
 *         description: 請求參數錯誤
 *       401:
 *         description: 未授權
 *       404:
 *         description: 工作機會不存在
 *       500:
 *         description: 伺服器錯誤
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await dbConnect();

    // 使用 getServerSession 獲取用戶會話
    const session = await getServerSession(req, res, authOptions);

    // 檢查用戶是否已登入
    if (!session || !session.user) {
      return res.status(401).json({ success: false, message: '未授權，請先登入' });
    }

    // 確保用戶ID存在
    const userId = session.user.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: '無效的用戶ID' });
    }

    switch (req.method) {
      case 'GET':
        return getApplications(req, res, userId);
      case 'POST':
        return createApplication(req, res, userId);
      default:
        return res.status(405).json({ success: false, message: '方法不允許' });
    }
  } catch (error: any) {
    console.error('申請API錯誤:', error);
    return res.status(500).json({ success: false, message: '伺服器錯誤', error: error.message });
  }
}

/**
 * 獲取申請列表
 */
async function getApplications(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    // 從查詢參數中獲取分頁和排序信息
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const sort = req.query.sort as string || 'createdAt';
    const order = req.query.order as string || 'desc';
    const status = req.query.status as string;

    // 構建查詢條件
    const query: any = { userId };
    if (status) {
      query.status = status;
    }

    // 執行查詢
    const applications = await Application.find(query)
      .populate('opportunityId', 'title slug shortDescription type location media')
      .populate('hostId', 'name profileImage')
      .sort({ [sort]: order === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      data: {
        applications,
        pagination: {
          total: applications.length,
          page: page,
          limit: limit,
          pages: Math.ceil(applications.length / limit)
        }
      }
    });
  } catch (error: any) {
    console.error('獲取申請列表錯誤:', error);
    return res.status(500).json({ success: false, message: '獲取申請列表失敗', error: error.message });
  }
}

/**
 * 創建申請
 */
async function createApplication(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    // 檢查用戶是否已登入
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ success: false, message: '未授權' });
    }

    const { opportunityId, hostId, timeSlotId, applicationDetails } = req.body;

    // 驗證必填欄位
    if (!opportunityId || !applicationDetails || !applicationDetails.message || !applicationDetails.startDate || !applicationDetails.duration) {
      return res.status(400).json({ success: false, message: '缺少必填欄位' });
    }

    // 檢查工作機會是否存在
    const opportunity = await Opportunity.findById(opportunityId);
    if (!opportunity) {
      return res.status(404).json({ success: false, message: '工作機會不存在' });
    }

    // 檢查時段是否存在（如果提供了時段ID）
    if (timeSlotId) {
      const timeSlot = opportunity.timeSlots?.id(timeSlotId);
      if (!timeSlot) {
        return res.status(404).json({ success: false, message: '時段不存在' });
      }

      // 檢查時段是否開放申請
      if (timeSlot.status !== 'OPEN') {
        return res.status(400).json({ success: false, message: '該時段已不開放申請' });
      }

      // 檢查申請的日期是否在時段範圍內
      const startDate = new Date(applicationDetails.startDate);
      const endDate = applicationDetails.endDate ? new Date(applicationDetails.endDate) : new Date(startDate.getTime() + applicationDetails.duration * 24 * 60 * 60 * 1000);

      if (startDate < new Date(timeSlot.startDate) || endDate > new Date(timeSlot.endDate)) {
        return res.status(400).json({ success: false, message: '申請的日期範圍超出了時段的有效期' });
      }

      // 檢查停留時間是否符合最短要求
      const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      if (durationDays < timeSlot.minimumStay) {
        return res.status(400).json({ success: false, message: `停留時間不得少於 ${timeSlot.minimumStay} 天` });
      }
    }

    // 檢查用戶是否已經申請過該工作機會
    const existingApplication = await Application.findOne({
      userId: userId,
      opportunityId,
      ...(timeSlotId ? { timeSlotId } : {})
    });

    if (existingApplication) {
      return res.status(400).json({ success: false, message: '您已經申請過該工作機會的這個時段' });
    }

    // 創建申請
    const application = await Application.create({
      userId: userId,
      opportunityId,
      hostId: hostId || opportunity.hostId,
      timeSlotId, // 添加時段ID
      status: ApplicationStatus.PENDING,
      applicationDetails,
      communications: {
        messages: [{
          sender: userId,
          content: applicationDetails.message,
          timestamp: new Date(),
          read: false
        }],
        lastMessageAt: new Date(),
        unreadHostMessages: 1,
        unreadUserMessages: 0
      }
    });

    return res.status(201).json({
      success: true,
      message: '申請創建成功',
      data: application
    });
  } catch (error: any) {
    console.error('創建申請錯誤:', error);
    return res.status(500).json({ success: false, message: '創建申請失敗', error: error.message });
  }
}