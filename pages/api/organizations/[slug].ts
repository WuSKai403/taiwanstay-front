import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectToDatabase } from '@/lib/mongodb';
import Organization from '@/models/Organization';
import { OrganizationStatus } from '@/models/enums/OrganizationStatus';
import { UserRole } from '@/models/enums/UserRole';
import mongoose from 'mongoose';
import { isAdmin, canAccessOrganization } from '@/utils/roleUtils';

/**
 * @swagger
 * /api/organizations/{id}:
 *   get:
 *     summary: 獲取特定組織
 *     description: 根據ID獲取特定組織的詳細資訊
 *     parameters:
 *       - name: id
 *         in: path
 *         description: 組織ID或slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功獲取組織
 *       404:
 *         description: 組織不存在
 *       500:
 *         description: 伺服器錯誤
 *   put:
 *     summary: 更新組織
 *     description: 更新特定組織的資訊
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
 *               contactInfo:
 *                 type: object
 *               location:
 *                 type: object
 *               media:
 *                 type: object
 *               details:
 *                 type: object
 *     responses:
 *       200:
 *         description: 組織更新成功
 *       400:
 *         description: 請求參數錯誤
 *       401:
 *         description: 未授權
 *       404:
 *         description: 組織不存在
 *       500:
 *         description: 伺服器錯誤
 *   delete:
 *     summary: 刪除組織
 *     description: 刪除特定組織
 *     parameters:
 *       - name: id
 *         in: path
 *         description: 組織ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 組織刪除成功
 *       401:
 *         description: 未授權
 *       404:
 *         description: 組織不存在
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

    // 根據請求方法處理不同操作
    switch (req.method) {
      case 'GET':
        return await getOrganizationDetail(req, res, slug);
      case 'PUT':
        return await updateOrganization(req, res, slug);
      case 'DELETE':
        return await deleteOrganization(req, res, slug);
      default:
        return res.status(405).json({ message: '方法不允許' });
    }
  } catch (error) {
    console.error('組織 API 錯誤:', error);
    return res.status(500).json({ message: '伺服器錯誤' });
  }
}

/**
 * 獲取特定組織
 */
async function getOrganizationDetail(req: NextApiRequest, res: NextApiResponse, slug: string) {
  try {
    // 檢查是否為有效的MongoDB ObjectId或slug
    let query = {};
    if (mongoose.Types.ObjectId.isValid(slug)) {
      query = { _id: slug };
    } else {
      query = { slug: slug };
    }

    // 獲取組織
    const organization = await Organization.findOne(query).select('-__v');

    if (!organization) {
      return res.status(404).json({ success: false, message: '組織不存在' });
    }

    // 檢查權限：非活躍組織只有管理員和組織管理員可以查看
    if (organization.status !== OrganizationStatus.ACTIVE) {
      const session = await getServerSession(req, res, authOptions);

      if (!canAccessOrganization(session?.user, organization.admins)) {
        return res.status(403).json({ success: false, message: '無權訪問此組織' });
      }
    }

    return res.status(200).json({
      success: true,
      data: organization
    });
  } catch (error: any) {
    console.error('獲取組織錯誤:', error);
    return res.status(500).json({ success: false, message: '獲取組織失敗', error: error.message });
  }
}

/**
 * 更新組織
 */
async function updateOrganization(req: NextApiRequest, res: NextApiResponse, slug: string) {
  try {
    // 檢查用戶是否已登入
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ success: false, message: '未授權' });
    }

    // 獲取組織
    const organization = await Organization.findById(slug);
    if (!organization) {
      return res.status(404).json({ success: false, message: '組織不存在' });
    }

    // 檢查權限：只有管理員和組織管理員可以更新組織
    const userIsAdmin = isAdmin(session.user);
    const userCanAccess = canAccessOrganization(session.user, organization.admins);

    if (!userCanAccess) {
      return res.status(403).json({ success: false, message: '無權更新此組織' });
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
      details,
      status
    } = req.body;

    // 只有管理員可以更新狀態
    if (status && !userIsAdmin) {
      return res.status(403).json({ success: false, message: '只有管理員可以更新組織狀態' });
    }

    // 更新組織
    const updatedOrganization = await Organization.findByIdAndUpdate(
      slug,
      {
        $set: {
          ...(name && { name }),
          ...(description && { description }),
          ...(mission && { mission }),
          ...(vision && { vision }),
          ...(type && { type }),
          ...(contactInfo && { contactInfo }),
          ...(location && { location }),
          ...(media && { media }),
          ...(details && { details }),
          ...(status && userIsAdmin && { status }),
          updatedAt: new Date()
        }
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: '組織更新成功',
      data: updatedOrganization
    });
  } catch (error: any) {
    console.error('更新組織錯誤:', error);
    return res.status(500).json({ success: false, message: '更新組織失敗', error: error.message });
  }
}

/**
 * 刪除組織
 */
async function deleteOrganization(req: NextApiRequest, res: NextApiResponse, slug: string) {
  try {
    // 檢查用戶是否已登入
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ success: false, message: '未授權' });
    }

    // 只有管理員可以刪除組織
    if (!isAdmin(session.user)) {
      return res.status(403).json({ success: false, message: '只有管理員可以刪除組織' });
    }

    // 獲取組織
    const organization = await Organization.findById(slug);
    if (!organization) {
      return res.status(404).json({ success: false, message: '組織不存在' });
    }

    // 刪除組織
    await Organization.findByIdAndDelete(slug);

    return res.status(200).json({
      success: true,
      message: '組織刪除成功'
    });
  } catch (error: any) {
    console.error('刪除組織錯誤:', error);
    return res.status(500).json({ success: false, message: '刪除組織失敗', error: error.message });
  }
}