import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import dbConnect from '@/lib/dbConnect';
import Host from '@/models/Host';
import mongoose from 'mongoose';
import { z } from 'zod';

// 設定資料驗證模式
const hostSettingsSchema = z.object({
  name: z.string().min(1, '名稱不能為空'),
  description: z.string().optional(),
  contactEmail: z.string().email('請輸入有效的電子郵件地址'),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url('請輸入有效的網址').optional().or(z.literal('')),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 只允許 PUT 請求
  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, message: '方法不允許' });
  }

  const { hostId } = req.query;

  // 確認 hostId 參數
  if (!hostId || typeof hostId !== 'string') {
    return res.status(400).json({ success: false, message: '無效的主人 ID' });
  }

  // 檢查 ID 格式
  if (!mongoose.Types.ObjectId.isValid(hostId)) {
    return res.status(400).json({ success: false, message: '無效的主人 ID 格式' });
  }

  try {
    // 檢查用戶身份
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user) {
      return res.status(401).json({ success: false, message: '未授權' });
    }

    // 連接資料庫
    await dbConnect();

    // 獲取主人資訊
    const host = await Host.findById(hostId);
    if (!host) {
      return res.status(404).json({ success: false, message: '找不到主人資訊' });
    }

    // 檢查用戶是否為資源擁有者
    if (host.userId.toString() !== session.user.id) {
      return res.status(403).json({ success: false, message: '只有資源擁有者可以更新主人設定' });
    }

    // 驗證請求數據
    try {
      hostSettingsSchema.parse(req.body);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: '資料驗證失敗',
          errors: validationError.errors
        });
      }
      throw validationError;
    }

    // 解析請求體
    const {
      name,
      description,
      contactEmail,
      contactPhone,
      address,
      website
    } = req.body;

    // 更新僅限於設定的欄位
    const updateData = {
      name,
      description,
      'contactInfo.contactEmail': contactEmail,
      'contactInfo.contactMobile': contactPhone,  // 注意這裡改用 contactMobile
      'location.address': address,  // 修正：應該更新到 location.address
      'contactInfo.website': website,
      updatedAt: new Date()
    };

    // 使用 findByIdAndUpdate 方法進行更新
    const updatedHost = await Host.findByIdAndUpdate(
      hostId,
      { $set: updateData },
      {
        new: true,  // 返回更新後的文檔
        runValidators: true  // 執行驗證器
      }
    );

    // 檢查是否有更新成功
    console.log('更新後的主人資料:', JSON.stringify(updatedHost, null, 2));

    return res.status(200).json({
      success: true,
      message: '主人設定已更新',
      host: {
        _id: updatedHost._id,
        name: updatedHost.name,
        description: updatedHost.description,
        contactEmail: updatedHost.contactInfo?.contactEmail,
        contactPhone: updatedHost.contactInfo?.contactMobile,
        address: updatedHost.location?.address,
        website: updatedHost.contactInfo?.website,
        status: updatedHost.status,
        userId: updatedHost.userId,
        createdAt: updatedHost.createdAt,
        updatedAt: updatedHost.updatedAt
      }
    });
  } catch (error: any) {
    console.error('更新主人設定失敗:', error);
    return res.status(500).json({
      success: false,
      message: '更新主人設定失敗',
      error: error.message
    });
  }
}