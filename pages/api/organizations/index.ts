import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectToDatabase } from '@/lib/mongodb';
import Organization from '@/models/Organization';
import { OrganizationStatus } from '@/models/enums/OrganizationStatus';
import { UserRole } from '@/models/enums/UserRole';
import { generateSlug } from '@/utils/helpers';
import { nanoid } from 'nanoid';
import { isAdmin } from '@/utils/roleUtils';

/**
 * @swagger
 * /api/organizations:
 *   get:
 *     summary: 獲取組織列表
 *     description: 獲取組織列表，可以根據查詢參數進行過濾
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
 *         description: 組織狀態
 *         required: false
 *         schema:
 *           type: string
 *           enum: [PENDING, ACTIVE, INACTIVE, REJECTED, SUSPENDED]
 *       - name: type
 *         in: query
 *         description: 組織類型
 *         required: false
 *         schema:
 *           type: string
 *           enum: [NGO, SOCIAL_ENTERPRISE, COOPERATIVE, FOUNDATION, ASSOCIATION, EDUCATIONAL, RELIGIOUS, COMMUNITY, GOVERNMENT, OTHER]
 *     responses:
 *       200:
 *         description: 成功獲取組織列表
 *       400:
 *         description: 請求參數錯誤
 *       500:
 *         description: 伺服器錯誤
 *   post:
 *     summary: 創建組織
 *     description: 創建新的組織
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - type
 *               - contactInfo
 *               - location
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               mission:
 *                 type: string
 *               vision:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [NGO, SOCIAL_ENTERPRISE, COOPERATIVE, FOUNDATION, ASSOCIATION, EDUCATIONAL, RELIGIOUS, COMMUNITY, GOVERNMENT, OTHER]
 *               contactInfo:
 *                 type: object
 *                 required:
 *                   - email
 *                 properties:
 *                   email:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   website:
 *                     type: string
 *               location:
 *                 type: object
 *                 required:
 *                   - address
 *                   - city
 *                   - country
 *                 properties:
 *                   address:
 *                     type: string
 *                   city:
 *                     type: string
 *                   district:
 *                     type: string
 *                   zipCode:
 *                     type: string
 *                   country:
 *                     type: string
 *     responses:
 *       201:
 *         description: 組織創建成功
 *       400:
 *         description: 請求參數錯誤
 *       401:
 *         description: 未授權
 *       500:
 *         description: 伺服器錯誤
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();

    switch (req.method) {
      case 'GET':
        return getOrganizations(req, res);
      case 'POST':
        return createOrganization(req, res);
      default:
        return res.status(405).json({ success: false, message: '方法不允許' });
    }
  } catch (error) {
    console.error('組織API錯誤:', error);
    return res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
}

/**
 * 獲取組織列表
 */
async function getOrganizations(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      limit = 10,
      page = 1,
      status,
      type,
      search,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    const limitNum = parseInt(limit as string);
    const pageNum = parseInt(page as string);
    const skip = (pageNum - 1) * limitNum;

    // 構建查詢條件
    const query: any = {};

    // 只顯示活躍的組織，除非是管理員
    const session = await getServerSession(req, res, authOptions);
    const userIsAdmin = isAdmin(session?.user);

    if (!userIsAdmin) {
      query.status = OrganizationStatus.ACTIVE;
    } else if (status) {
      query.status = status;
    }

    if (type) {
      query.type = type;
    }

    if (search) {
      query.$text = { $search: search as string };
    }

    // 獲取總數
    const total = await Organization.countDocuments(query);

    // 獲取組織列表
    const organizations = await Organization.find(query)
      .sort({ [sort as string]: order === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(limitNum)
      .select('-__v');

    return res.status(200).json({
      success: true,
      data: {
        organizations,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('獲取組織列表錯誤:', error);
    return res.status(500).json({
      success: false,
      message: '獲取組織列表失敗',
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
}

/**
 * 創建組織
 */
async function createOrganization(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 檢查用戶是否已登入
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ success: false, message: '未授權' });
    }

    const {
      name,
      description,
      mission,
      vision,
      type,
      contactInfo,
      location,
      media,
      details
    } = req.body;

    // 驗證必填欄位
    if (!name || !description || !type || !contactInfo?.email || !location?.address || !location?.city || !location?.country) {
      return res.status(400).json({ success: false, message: '缺少必填欄位' });
    }

    // 生成slug
    const baseSlug = generateSlug(name);
    const uniqueId = nanoid(6);
    const slug = `${baseSlug}-${uniqueId}`;

    // 創建組織
    const organization = await Organization.create({
      name,
      slug,
      description,
      mission,
      vision,
      type,
      status: OrganizationStatus.PENDING, // 新創建的組織需要審核
      contactInfo,
      location,
      media,
      details,
      admins: [session.user.id], // 將創建者設為管理員
    });

    return res.status(201).json({
      success: true,
      message: '組織創建成功',
      data: organization
    });
  } catch (error) {
    console.error('創建組織錯誤:', error);
    return res.status(500).json({
      success: false,
      message: '創建組織失敗',
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
}