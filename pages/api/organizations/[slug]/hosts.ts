import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { connectToDatabase } from '@/lib/mongodb';
import Organization from '@/models/Organization';
import Host from '@/models/Host';
import User from '@/models/User';
import { UserRole } from '@/models/enums/UserRole';
import mongoose from 'mongoose';
import { canAccessOrganization } from '@/utils/roleUtils';

/**
 * @swagger
 * /api/organizations/{id}/hosts:
 *   get:
 *     summary: 獲取組織下的主人列表
 *     description: 獲取特定組織下的所有主人
 *     parameters:
 *       - name: id
 *         in: path
 *         description: 組織ID
 *         required: true
 *         schema:
 *           type: string
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
 *     responses:
 *       200:
 *         description: 成功獲取主人列表
 *       404:
 *         description: 組織不存在
 *       500:
 *         description: 伺服器錯誤
 *   post:
 *     summary: 添加主人到組織
 *     description: 將現有主人添加到組織中
 *     parameters:
 *       - name: id
 *         in: path
 *         description: 組織ID
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hostId
 *             properties:
 *               hostId:
 *                 type: string
 *                 description: 主人ID
 *     responses:
 *       200:
 *         description: 主人添加成功
 *       400:
 *         description: 請求參數錯誤
 *       401:
 *         description: 未授權
 *       404:
 *         description: 組織或主人不存在
 *       500:
 *         description: 伺服器錯誤
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug } = req.query;

  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ message: '組織 ID 無效' });
  }

  try {
    await connectToDatabase();

    // 檢查組織是否存在
    const organization = await Organization.findById(slug);
    if (!organization) {
      return res.status(404).json({ success: false, message: '組織不存在' });
    }

    // 根據請求方法處理不同操作
    switch (req.method) {
      case 'GET':
        return await getOrganizationHosts(req, res, slug);
      case 'POST':
        return addHostToOrganization(req, res, slug, organization);
      default:
        return res.status(405).json({ message: '方法不允許' });
    }
  } catch (error: any) {
    console.error('組織主人API錯誤:', error);
    return res.status(500).json({ success: false, message: '伺服器錯誤', error: error.message });
  }
}

/**
 * 獲取組織下的主人列表
 */
async function getOrganizationHosts(req: NextApiRequest, res: NextApiResponse, slug: string) {
  try {
    const {
      limit = 10,
      page = 1,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    const limitNum = parseInt(limit as string);
    const pageNum = parseInt(page as string);
    const skip = (pageNum - 1) * limitNum;

    // 獲取組織下的主人ID列表
    const organization = await Organization.findById(slug).select('hosts');
    if (!organization) {
      return res.status(404).json({ success: false, message: '組織不存在' });
    }

    // 獲取總數
    const total = organization.hosts.length;

    // 獲取主人列表
    const hosts = await Host.find({
      _id: { $in: organization.hosts }
    })
      .sort({ [sort as string]: order === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(limitNum)
      .select('-__v');

    return res.status(200).json({
      success: true,
      data: {
        hosts,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error: any) {
    console.error('獲取組織主人列表錯誤:', error);
    return res.status(500).json({ success: false, message: '獲取組織主人列表失敗', error: error.message });
  }
}

/**
 * 添加主人到組織
 */
async function addHostToOrganization(req: NextApiRequest, res: NextApiResponse, slug: string, organization: any) {
  try {
    // 檢查用戶是否已登入
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user) {
      return res.status(401).json({ success: false, message: '未授權' });
    }

    // 檢查權限：只有管理員和組織管理員可以添加主人
    if (!canAccessOrganization(session.user, organization.admins)) {
      return res.status(403).json({ success: false, message: '無權添加主人到此組織' });
    }

    const { hostId } = req.body;
    if (!hostId) {
      return res.status(400).json({ success: false, message: '缺少主人ID' });
    }

    // 檢查主人是否存在
    const host = await Host.findById(hostId);
    if (!host) {
      return res.status(404).json({ success: false, message: '主人不存在' });
    }

    // 檢查主人是否已在組織中
    if (organization.hosts.includes(hostId)) {
      return res.status(400).json({ success: false, message: '主人已在組織中' });
    }

    // 添加主人到組織
    const updatedOrganization = await Organization.findByIdAndUpdate(
      slug,
      { $addToSet: { hosts: hostId } },
      { new: true }
    );

    // 更新主人的組織引用
    await Host.findByIdAndUpdate(
      hostId,
      { $addToSet: { organizations: slug } }
    );

    return res.status(200).json({
      success: true,
      message: '主人添加成功',
      data: updatedOrganization
    });
  } catch (error: any) {
    console.error('添加主人到組織錯誤:', error);
    return res.status(500).json({ success: false, message: '添加主人到組織失敗', error: error.message });
  }
}