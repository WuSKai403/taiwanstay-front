import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectToDatabase } from '@/lib/mongodb';
import Application from '@/models/Application';
import Opportunity from '@/models/Opportunity';
import Host from '@/models/Host';
import { ApplicationStatus } from '@/models/enums/ApplicationStatus';
import { UserRole } from '@/types';
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
    await connectToDatabase();

    switch (req.method) {
      case 'GET':
        return getApplications(req, res);
      case 'POST':
        return createApplication(req, res);
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
async function getApplications(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 檢查用戶是否已登入
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ success: false, message: '未授權' });
    }

    const {
      limit = 10,
      page = 1,
      status,
      opportunityId,
      hostId,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    const limitNum = parseInt(limit as string);
    const pageNum = parseInt(page as string);
    const skip = (pageNum - 1) * limitNum;

    // 構建查詢條件
    const query: any = {};

    // 根據用戶角色設置查詢條件
    const userIsAdmin = isAdmin(session.user);

    if (!userIsAdmin) {
      // 普通用戶只能查看自己的申請
      query.userId = session.user.id;
    }

    if (status) {
      query.status = status;
    }

    if (opportunityId) {
      query.opportunityId = opportunityId;
    }

    if (hostId) {
      query.hostId = hostId;
    }

    // 獲取總數
    const total = await Application.countDocuments(query);

    // 獲取申請列表
    const applications = await Application.find(query)
      .sort({ [sort as string]: order === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(limitNum)
      .populate('opportunityId', 'title slug location')
      .populate('hostId', 'name slug')
      .select('-__v');

    return res.status(200).json({
      success: true,
      data: {
        applications,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum)
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
async function createApplication(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 檢查用戶是否已登入
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ success: false, message: '未授權' });
    }

    const { opportunityId, applicationDetails } = req.body;

    // 驗證必填欄位
    if (!opportunityId || !applicationDetails || !applicationDetails.message || !applicationDetails.startDate || !applicationDetails.duration) {
      return res.status(400).json({ success: false, message: '缺少必填欄位' });
    }

    // 檢查工作機會是否存在
    const opportunity = await Opportunity.findById(opportunityId);
    if (!opportunity) {
      return res.status(404).json({ success: false, message: '工作機會不存在' });
    }

    // 檢查用戶是否已經申請過該工作機會
    const existingApplication = await Application.findOne({
      userId: session.user.id,
      opportunityId
    });

    if (existingApplication) {
      return res.status(400).json({ success: false, message: '您已經申請過該工作機會' });
    }

    // 創建申請
    const application = await Application.create({
      userId: session.user.id,
      opportunityId,
      hostId: opportunity.hostId,
      status: ApplicationStatus.PENDING,
      applicationDetails,
      communications: {
        messages: [{
          sender: session.user.id,
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