import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb';
import Host from '@/models/Host';
import Opportunity from '@/models/Opportunity';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import User from '@/models/User';
import { HostStatus } from '@/models/enums/HostStatus';
import { generateSlug } from '../../../utils/slugUtils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();

    // 根據請求方法處理不同操作
    switch (req.method) {
      case 'GET':
        return await getHosts(req, res);
      case 'POST':
        return await createHost(req, res);
      default:
        return res.status(405).json({ success: false, message: '方法不允許' });
    }
  } catch (error: any) {
    console.error('主人API錯誤:', error);
    return res.status(500).json({ success: false, message: '伺服器錯誤', error: error.message });
  }
}

/**
 * 獲取主人列表
 */
async function getHosts(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      search,
      city,
      minRating,
      page = '1',
      limit = '12',
    } = req.query;

    // 構建查詢條件
    const query: any = {};

    // 搜尋條件
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // 城市過濾
    if (city) {
      query['location.city'] = city;
    }

    // 評分過濾
    if (minRating) {
      query['rating.average'] = { $gte: Number(minRating) };
    }

    // 分頁
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // 獲取主辦方列表
    const hosts = await Host.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber)
      .lean();

    // 獲取總數
    const total = await Host.countDocuments(query);

    // 獲取每個主辦方的機會數量
    const hostsWithOpportunityCount = await Promise.all(
      hosts.map(async (host) => {
        const opportunityCount = await Opportunity.countDocuments({ hostId: host._id });
        return {
          ...host,
          opportunityCount,
        };
      })
    );

    return res.status(200).json({
      hosts: JSON.parse(JSON.stringify(hostsWithOpportunityCount)),
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        pages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error: any) {
    console.error('獲取主辦方列表失敗:', error);
    return res.status(500).json({ success: false, message: '獲取主辦方列表失敗', error: error.message });
  }
}

/**
 * 創建新主人
 */
async function createHost(req: NextApiRequest, res: NextApiResponse) {
  // 增加日誌，檢查請求體
  console.log('[API] 創建主人 - 請求體:', JSON.stringify(req.body, null, 2));

  try {
    // 檢查用戶是否已登入
    const session = await getServerSession(req, res, authOptions);
    console.log('[API] 創建主人 - 會話狀態:', session ? '已登入' : '未登入');
    if (session?.user) {
      console.log('[API] 創建主人 - 用戶信息:', {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role
      });
    }

    if (!session || !session.user) {
      console.log('[API] 創建主人 - 錯誤: 未授權');
      return res.status(401).json({ success: false, message: '未授權' });
    }

    // 獲取用戶資料以獲取email和mobile
    const user = await User.findById(session.user.id);
    console.log('[API] 創建主人 - 資料庫用戶檢查:', user ? '找到用戶' : '未找到用戶');

    if (!user) {
      console.log('[API] 創建主人 - 錯誤: 用戶不存在');
      return res.status(404).json({ success: false, message: '用戶不存在' });
    }

    // 檢查用戶是否已是主人
    const existingHost = await Host.findOne({ userId: user._id });
    console.log('[API] 創建主人 - 已有主人記錄, 狀態:', existingHost?.status);

    if (existingHost) {
      if (existingHost.status === HostStatus.PENDING) {
        // 已提交申請但尚未審核
        return res.status(400).json({
          success: false,
          message: '您已提交主人申請，正在審核中',
          status: 'pending',
          hostId: existingHost._id
        });
      } else if (existingHost.status === HostStatus.ACTIVE) {
        // 已是正式主人
        return res.status(400).json({
          success: false,
          message: '您已經是註冊主人，無法重複申請',
          status: 'active',
          hostId: existingHost._id
        });
      } else if (existingHost.status === HostStatus.REJECTED) {
        // 申請被拒絕，可以考慮允許重新申請或提示聯繫客服
        return res.status(400).json({
          success: false,
          message: '您的主人申請已被拒絕，請聯繫客服瞭解詳情',
          status: 'rejected',
          hostId: existingHost._id
        });
      }
    }

    // 處理表單數據
    const formData = req.body;

    // 明確移除舊的 media 欄位
    if (formData.media) {
      console.log('[API] 發現舊的媒體欄位，將其移除');
      delete formData.media;
    }

    // 轉換照片欄位格式
    let processedPhotos: Array<{
      publicId: string;
      secureUrl: string;
      thumbnailUrl?: string;
      previewUrl?: string;
      originalUrl?: string;
    }> = [];
    if (formData.photos && Array.isArray(formData.photos) && formData.photos.length > 0) {
      processedPhotos = formData.photos.map((photo: any) => {
        if (!photo) return null;

        return {
          publicId: photo.publicId || photo.public_id,
          secureUrl: photo.secureUrl || photo.secure_url,
          thumbnailUrl: photo.thumbnailUrl,
          previewUrl: photo.previewUrl,
          originalUrl: photo.originalUrl || photo.secureUrl || photo.secure_url
        };
      }).filter(Boolean);

      console.log('[API] 處理後的照片數據:', processedPhotos);
    }

    // 使用用戶的email和mobile，確保這些都存在
    if (!user.email) {
      return res.status(400).json({ success: false, message: "用戶缺少電子郵件" });
    }

    const contactEmail = formData.contactInfo?.contactEmail;
    const contactMobile = formData.contactInfo?.contactMobile;

    // 創建新的主人資料
    const host = new Host({
      userId: user._id,
      name: formData.name,
      description: formData.description,
      type: formData.type,
      category: formData.category,
      location: formData.location,
      // 使用新的媒體欄位結構
      photos: processedPhotos,
      photoDescriptions: formData.photoDescriptions || [],
      videoIntroduction: formData.videoIntroduction || { url: '', description: '' },
      additionalMedia: formData.additionalMedia || { virtualTour: '' },
      contactInfo: {
        ...formData.contactInfo,
        // 確保聯絡資訊中有email和mobile
        contactEmail: contactEmail || user.email,
        contactMobile: contactMobile || user.mobile
      },
      features: formData.features,
      amenities: formData.amenities,
      details: formData.details,
      // 使用用戶資料中的email和mobile
      email: user.email,
      mobile: user.mobile || contactMobile,
      status: HostStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // 生成slug
    const slug = await generateSlug(formData.name);
    console.log('[API] 創建主人 - 生成的slug:', slug);
    host.slug = slug;

    // 處理地理座標
    if (!formData.location.coordinates) {
      console.log('[API] 創建主人 - 未找到座標，使用默認座標');
      formData.location.coordinates = {
        type: 'Point',
        coordinates: [121.5, 25.0] // 台灣默認座標（台北市中心附近）
      };
    } else {
      console.log('[API] 創建主人 - 座標信息:', formData.location.coordinates);
    }

    // 處理設施資訊
    const processedAmenities = formData.amenities || {
      basics: {},
      accommodation: {},
      workExchange: {},
      lifestyle: {},
      activities: {},
      customAmenities: [],
      amenitiesNotes: '',
      workExchangeDescription: ''
    };

    // 創建新主人記錄
    try {
      const savedHost = await host.save();
      console.log('[API] 創建主人 - 保存成功:', { hostId: savedHost._id.toString() });

      // 更新用戶的主人ID
      await User.findByIdAndUpdate(user._id, { hostId: savedHost._id });
      console.log('[API] 創建主人 - 用戶更新成功');

      return res.status(201).json({
        success: true,
        message: '主人註冊成功，等待審核',
        hostId: savedHost._id
      });
    } catch (saveError: any) {
      console.error('[API] 創建主人 - 保存記錄錯誤:', saveError);
      return res.status(500).json({
        success: false,
        message: '創建主人記錄失敗',
        error: saveError.message,
        code: 'HOST_SAVE_ERROR'
      });
    }
  } catch (error: any) {
    console.error('[API] 創建主人 - 處理錯誤:', error);
    return res.status(500).json({
      success: false,
      message: '創建主人失敗',
      error: error.message,
      code: 'HOST_CREATE_ERROR'
    });
  }
}