import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '@/lib/dbConnect';
import Host from '@/models/Host';
import { HostStatus } from '@/models/enums/HostStatus';
import { UserRole } from '@/models/enums/UserRole';
import mongoose from 'mongoose';
import { hostRegisterSchema } from '@/lib/schemas/host';
import { z } from 'zod';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, query } = req;
  const { hostId } = query;

  // 連接資料庫
  await dbConnect();

  // 確認用戶身份
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) {
    return res.status(401).json({ success: false, message: '未授權' });
  }

  // 確認hostId參數
  if (!hostId || typeof hostId !== 'string') {
    return res.status(400).json({ success: false, message: '無效的主人 ID' });
  }

  // 檢查 ID 格式
  if (!mongoose.Types.ObjectId.isValid(hostId)) {
    return res.status(400).json({ success: false, message: '無效的主人 ID 格式' });
  }

  // 獲取主人資訊
  const host = await Host.findById(hostId);

  if (!host) {
    return res.status(404).json({ success: false, message: '找不到主人資訊' });
  }

  // 檢查用戶權限 - 只有資源擁有者和管理員可以操作
  const isOwner = host.userId.toString() === session.user.id;
  const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ success: false, message: '無權執行此操作' });
  }

  // GET 方法 - 獲取主人詳情
  if (method === 'GET') {
    return res.status(200).json({
      success: true,
      host
    });
  }

  // PUT 方法 - 更新主人資訊
  if (method === 'PUT') {
    try {
      // 只有資源擁有者可以更新
      if (!isOwner) {
        return res.status(403).json({ success: false, message: '只有資源擁有者可以更新主人資訊' });
      }

      // 確認主人狀態為 EDITING
      if (host.status !== HostStatus.EDITING) {
        return res.status(400).json({
          success: false,
          message: '只能在編輯狀態下更新主人資訊'
        });
      }

      console.log('[API] 更新主人 - 請求體:', JSON.stringify(req.body, null, 2));

      // 驗證請求數據
      try {
        hostRegisterSchema.parse(req.body);
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
        type,
        category,
        location,
        contactInfo,
        amenities,
        details,
        photos,
        photoDescriptions,
        videoIntroduction,
        additionalMedia,
        features,
        email,
        mobile
      } = req.body;

      // 明確移除舊的 media 欄位
      if (req.body.media) {
        console.log('[API] 發現舊的媒體欄位，將其移除');
        delete req.body.media;
      }

      // 轉換照片欄位格式
      let processedPhotos: Array<{
        publicId: string;
        secureUrl: string;
        thumbnailUrl?: string;
        previewUrl?: string;
        originalUrl?: string;
      }> = [];
      if (photos && Array.isArray(photos) && photos.length > 0) {
        processedPhotos = photos
          .map((photo: any) => {
            if (!photo) return null;

            return {
              publicId: photo.publicId || photo.publicId,
              secureUrl: photo.secureUrl || photo.secureUrl,
              thumbnailUrl: photo.thumbnailUrl,
              previewUrl: photo.previewUrl,
              originalUrl: photo.originalUrl || photo.secureUrl || photo.secureUrl
            };
          })
          .filter((item): item is NonNullable<typeof item> => item !== null);

        console.log('[API] 處理後的照片數據:', processedPhotos);
      }

      // 處理設施資訊
      const processedAmenities = amenities || {
        basics: {},
        accommodation: {},
        workExchange: {},
        lifestyle: {},
        activities: {},
        customAmenities: [],
        amenitiesNotes: '',
        workExchangeDescription: ''
      };

      // 更新主人資訊
      host.name = name;
      host.description = description;
      host.type = type;
      host.category = category;
      host.status = HostStatus.PENDING; // 重新提交後狀態設為待審核
      host.statusNote = '重新提交申請，等待審核';
      host.email = email || (contactInfo?.email || '');
      host.mobile = mobile || (contactInfo?.mobile || '');
      host.location = location;
      host.contactInfo = contactInfo;
      host.amenities = processedAmenities;
      host.details = details || {};

      // 使用新的媒體欄位結構
      host.photos = processedPhotos;
      host.photoDescriptions = photoDescriptions || [];
      host.videoIntroduction = videoIntroduction || { url: '', description: '' };
      host.additionalMedia = additionalMedia || { virtualTour: '' };

      // 明確刪除舊的 media 欄位 (如果存在)
      if ((host as any).media) {
        console.log('[API] 刪除現有主人記錄中的舊媒體欄位');
        (host as any).media = undefined;
      }

      host.features = features || {};
      host.updatedAt = new Date();

      // 保存狀態變更歷史
      const statusRecord = {
        status: HostStatus.EDITING,
        statusNote: host.statusNote,
        updatedBy: new mongoose.Types.ObjectId(session.user.id),
        updatedAt: new Date()
      };

      host.statusHistory = host.statusHistory || [];
      host.statusHistory.push(statusRecord);

      // 保存更新
      await host.save();

      return res.status(200).json({
        success: true,
        message: '主人資訊已更新並提交審核',
        host: {
          _id: host._id,
          name: host.name,
          status: host.status
        }
      });
    } catch (error: any) {
      console.error('[API] 更新主人資訊失敗:', error);
      return res.status(500).json({
        success: false,
        message: '更新主人資訊失敗',
        error: error.message
      });
    }
  }

  // DELETE 方法 - 刪除主人
  if (method === 'DELETE') {
    // 只有管理員或資源擁有者可以刪除
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: '無權執行此操作' });
    }

    try {
      await Host.findByIdAndDelete(hostId);
      return res.status(200).json({
        success: true,
        message: '主人資訊已刪除'
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: '刪除主人資訊失敗',
        error: error.message
      });
    }
  }

  // 不支援的方法
  return res.status(405).json({ success: false, message: '方法不允許' });
}