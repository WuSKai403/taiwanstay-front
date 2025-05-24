import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '@/lib/dbConnect';
import Opportunity from '@/models/Opportunity';
import Host from '@/models/Host';
import { OpportunityStatus, OpportunityType } from '@/models/enums';
import { z } from 'zod';
import { transformMediaForDB } from '@/lib/types/media';
import { nanoid } from 'nanoid';
import { generateSlug } from '@/lib/utils/slugUtils';

// 基本必填欄位驗證 - 用於API層級的驗證
const opportunitySubmitSchema = z.object({
  title: z.string().min(5, { message: '標題至少需要5個字符' }).max(100, { message: '標題不能超過100個字符' }),
  shortDescription: z.string().min(10, { message: '簡短描述至少需要10個字符' }).max(200, { message: '簡短描述不能超過200個字符' }),
  description: z.string().min(20, { message: '詳細描述至少需要20個字符' }),
  type: z.string().min(1, { message: '請選擇機會類型' }),
  location: z.object({
    city: z.string().min(1, { message: '請選擇城市' }),
    district: z.string().min(1, { message: '請選擇區域' }),
  }),
  workDetails: z.object({
    tasks: z.array(z.string()).min(1, { message: '請至少添加一個工作任務' }),
  }),
  media: z.object({
    coverImage: z.object({
      publicId: z.string().optional(),
      secureUrl: z.string().optional(),
      url: z.string().optional(),
      previewUrl: z.string().optional(),
      thumbnailUrl: z.string().optional(),
      alt: z.string().optional(),
      version: z.string().optional(),
      format: z.string().optional(),
      width: z.number().optional(),
      height: z.number().optional(),
    }).optional(),
    images: z.array(z.object({
      publicId: z.string().optional(),
      secureUrl: z.string().optional(),
      url: z.string().optional(),
      previewUrl: z.string().optional(),
      thumbnailUrl: z.string().optional(),
      alt: z.string().optional(),
      version: z.string().optional(),
      format: z.string().optional(),
      width: z.number().optional(),
      height: z.number().optional(),
    })).optional(),
    descriptions: z.array(z.string()).optional(),
    videoUrl: z.string().optional(),
    videoDescription: z.string().optional(),
    virtualTour: z.string().optional(),
  }).optional(),
  // 移除 workTimeSettings 驗證，使用 timeSlots 代替
  hasTimeSlots: z.boolean().optional(),
  timeSlots: z.array(z.object({
    startDate: z.string().min(1, { message: '請選擇開始日期' }),
    endDate: z.string().min(1, { message: '請選擇結束日期' }),
    defaultCapacity: z.number().min(1, { message: '容量至少為1人' }),
    minimumStay: z.number().min(1, { message: '最短停留時間至少為1天' }),
    workDaysPerWeek: z.number().min(1, { message: '每週工作天數至少為1天' }).max(7, { message: '每週工作天數最多為7天' }),
    workHoursPerDay: z.number().min(1, { message: '每日工作時數至少為1小時' }),
    description: z.string().optional(),
  })).optional(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '只允許 POST 請求' });
  }

  console.log('===== 送出審核 API 開始處理 =====');
  console.log('請求方法:', req.method);
  console.log('請求內容類型:', req.headers['content-type']);
  console.log('請求體預覽:', Object.keys(req.body));

  try {
    // 獲取會話數據以驗證用戶
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user) {
      console.error('錯誤: 未授權的請求，沒有有效的會話');
      return res.status(401).json({ message: '未授權的請求' });
    }

    console.log('用戶ID:', session.user.id);
    console.log('用戶權限:', session.user.role);

    // 驗證表單數據
    try {
      console.log('驗證請求數據...');

      // 檢查主要數據結構
      console.log('表單基本數據檢查:', {
        hasTitle: Boolean(req.body.title),
        titleLength: req.body.title ? req.body.title.length : 0,
        hasShortDescription: Boolean(req.body.shortDescription),
        shortDescriptionLength: req.body.shortDescription ? req.body.shortDescription.length : 0,
        hasType: Boolean(req.body.type),
        hasLocation: Boolean(req.body.location),
        hasMedia: Boolean(req.body.media),
        hasTimeSlots: Boolean(req.body.hasTimeSlots),
        timeSlotsCount: req.body.timeSlots ? req.body.timeSlots.length : 0,
      });

      // 檢查媒體數據 - 這是問題重點
      if (req.body.media) {
        console.log('媒體數據詳細結構:', JSON.stringify(req.body.media, null, 2));

        console.log('媒體數據檢查:', {
          hasCoverImage: Boolean(req.body.media.coverImage),
          coverImageType: req.body.media.coverImage ? typeof req.body.media.coverImage : 'undefined',
          hasCoverImageUrl: req.body.media.coverImage ? Boolean(req.body.media.coverImage.url) : false,
          coverImageUrlType: req.body.media.coverImage && req.body.media.coverImage.url ? typeof req.body.media.coverImage.url : 'undefined',
          coverImageUrlLength: req.body.media.coverImage && req.body.media.coverImage.url ? req.body.media.coverImage.url.length : 0,
          imagesCount: req.body.media.images ? req.body.media.images.length : 0,
          imagesType: req.body.media.images ? typeof req.body.media.images : 'undefined',
          imagesIsArray: req.body.media.images ? Array.isArray(req.body.media.images) : false,
          imagesValid: req.body.media.images ? req.body.media.images.every((img: any) => img && img.url) : false
        });

        // 檢查封面圖片
        if (req.body.media.coverImage) {
          console.log('封面圖片結構:', JSON.stringify(req.body.media.coverImage, null, 2));
          console.log('封面圖片屬性:', Object.keys(req.body.media.coverImage));

          if (req.body.media.coverImage.secureUrl) {
            console.log('封面圖片URL類型與長度:', {
              類型: typeof req.body.media.coverImage.secureUrl,
              長度: req.body.media.coverImage.secureUrl.length,
              URL值預覽: req.body.media.coverImage.secureUrl.substring(0, 50) + '...'
            });
          } else {
            console.log('錯誤: 封面圖片缺少secureUrl屬性');
          }
        } else {
          console.log('錯誤: 缺少封面圖片');
        }

        // 檢查圖片集
        if (req.body.media.images && Array.isArray(req.body.media.images)) {
          console.log('圖片集數量:', req.body.media.images.length);

          // 檢查每個圖片
          req.body.media.images.forEach((img: any, index: number) => {
            console.log(`圖片 ${index} 詳細資訊:`, {
              類型: typeof img,
              是否為空: img === null || img === undefined,
              屬性: img ? Object.keys(img) : '無屬性',
              secureUrl存在: Boolean(img && img.secureUrl),
              secureUrl類型: img && img.secureUrl ? typeof img.secureUrl : '無secureUrl',
              secureUrl長度: img && img.secureUrl ? img.secureUrl.length : 0,
              secureUrl預覽: img && img.secureUrl ? img.secureUrl.substring(0, 30) + '...' : '無secureUrl'
            });
          });

          // 檢查無效圖片
          const invalidImages = req.body.media.images.filter((img: any) => !img || !img.secureUrl);
          if (invalidImages.length > 0) {
            console.log(`發現 ${invalidImages.length} 張無效圖片，缺少secureUrl`);
          }
        } else {
          console.log('圖片集不是陣列或為空');
        }
      } else {
        console.log('錯誤: 缺少媒體數據結構');
      }

      // 檢查時間段設置
      if (req.body.hasTimeSlots && req.body.timeSlots) {
        console.log('時間段數量:', req.body.timeSlots.length);

        // 檢查每個時間段
        req.body.timeSlots.forEach((slot: any, index: number) => {
          console.log(`時間段 ${index} 詳細資訊:`, {
            startDate: slot.startDate,
            endDate: slot.endDate,
            defaultCapacity: slot.defaultCapacity,
            minimumStay: slot.minimumStay,
            workDaysPerWeek: slot.workDaysPerWeek,
            workHoursPerDay: slot.workHoursPerDay,
            hasDescription: Boolean(slot.description)
          });
        });
      } else {
        console.log('沒有使用時間段管理或時間段為空');
      }

      const validationResult = opportunitySubmitSchema.safeParse(req.body);
      if (!validationResult.success) {
        console.error('驗證失敗:', validationResult.error.format());

        // 從Zod錯誤中提取出可讀性更好的錯誤訊息
        const formattedErrors = formatZodErrors(validationResult.error);
        console.error('格式化後的錯誤:', formattedErrors);

        return res.status(400).json({
          message: '表單驗證失敗',
          errors: formattedErrors
        });
      }

      console.log('表單驗證通過');
    } catch (validationError) {
      console.error('驗證過程中發生錯誤:', validationError);
      return res.status(400).json({
        message: '表單驗證出錯',
        error: (validationError as Error).message
      });
    }

    // 連接數據庫
    await dbConnect();

    console.log('數據庫連接成功，開始處理機會提交');

    const userId = session.user.id;
    const { hostId, ...opportunityData } = req.body;
    console.log('請求數據：', {
      hostId,
      title: opportunityData.title,
      shortDescription: opportunityData.shortDescription?.substring(0, 30) + '...'
    });

    // 驗證 hostId
    if (!hostId) {
      console.log('錯誤: 缺少主人 ID');
      return res.status(400).json({ success: false, message: '缺少主人 ID' });
    }

    // 確認用戶對此主人有權限
    console.log(`檢查主人權限，hostId: ${hostId}`);
    const host = await Host.findById(hostId);
    if (!host) {
      console.log(`錯誤: 找不到主人信息 (ID: ${hostId})`);
      return res.status(404).json({ success: false, message: '找不到主人資訊' });
    }

    console.log('找到主人信息:', {
      hostId: host._id,
      name: host.name,
      hostUserId: host.userId.toString()
    });

    if (host.userId.toString() !== userId) {
      console.log(`權限錯誤: 用戶 (${userId}) 無權替此主人 (${host.userId}) 創建機會`);
      return res.status(403).json({ success: false, message: '無權替此主人創建機會' });
    }

    console.log('權限驗證通過，開始創建機會...');

    // 創建機會並設置為待審核狀態
    console.log('創建新機會實例...');

    // 處理媒體數據，確保與資料庫模型兼容
    const processedOpportunityData = { ...opportunityData };

    // 使用 transformMediaForDB 處理媒體數據
    if (processedOpportunityData.media) {
      console.log('正在處理媒體數據以適配資料庫模型...');

      // 使用轉換函數將前端格式轉為資料庫格式
      processedOpportunityData.media = transformMediaForDB(processedOpportunityData.media);

      console.log('媒體數據處理完畢:', {
        hasCoverImage: Boolean(processedOpportunityData.media.coverImage),
        imagesCount: processedOpportunityData.media.images?.length || 0,
        descriptionsType: processedOpportunityData.media.descriptions ?
          (Array.isArray(processedOpportunityData.media.descriptions) ? 'array' : 'object') : 'none'
      });
    }

    // 生成必要的欄位
    // 1. 生成 publicId
    const publicId = nanoid(12);
    console.log('生成的publicId:', publicId);

    // 2. 生成 slug - 使用通用工具函數
    const slug = generateSlug(
      opportunityData.title,
      opportunityData.type,
      opportunityData.location?.city
    );
    console.log('生成的slug:', slug);

    // 處理日期格式 - 將 YYYY-MM-DD 轉換為 YYYY-MM
    if (processedOpportunityData.timeSlots && Array.isArray(processedOpportunityData.timeSlots)) {
      processedOpportunityData.timeSlots = processedOpportunityData.timeSlots.map((slot: any) => {
        // 確保日期格式正確
        if (slot.startDate && typeof slot.startDate === 'string') {
          // 保持原始格式，不再轉換為 YYYY-MM
          console.log(`處理時間段開始日期: ${slot.startDate}`);
        }

        if (slot.endDate && typeof slot.endDate === 'string') {
          // 保持原始格式，不再轉換為 YYYY-MM
          console.log(`處理時間段結束日期: ${slot.endDate}`);
        }

        return slot;
      });
    }

    // 確保地理位置座標格式正確
    if (processedOpportunityData.location && processedOpportunityData.location.coordinates) {
      console.log('檢查地理位置座標...');

      // 檢查座標格式是否為標準的 GeoJSON
      if (processedOpportunityData.location.coordinates.type === 'Point' &&
          Array.isArray(processedOpportunityData.location.coordinates.coordinates) &&
          processedOpportunityData.location.coordinates.coordinates.length === 2) {
        console.log('座標格式正確 (GeoJSON Point)');
      } else if (processedOpportunityData.location.coordinates.lat && processedOpportunityData.location.coordinates.lng) {
        // 兼容舊格式：從 {lat, lng} 轉換為 GeoJSON Point 格式
        console.log(`轉換座標到 GeoJSON 格式: { type: "Point", coordinates: [${processedOpportunityData.location.coordinates.lng}, ${processedOpportunityData.location.coordinates.lat}] }`);
        processedOpportunityData.location.coordinates = {
          type: 'Point',
          coordinates: [
            parseFloat(processedOpportunityData.location.coordinates.lng.toString()),
            parseFloat(processedOpportunityData.location.coordinates.lat.toString())
          ]
        };
      } else {
        // 座標格式無效，移除座標欄位
        console.log('座標格式無效，移除座標欄位');
        delete processedOpportunityData.location.coordinates;
      }

      // 確保 showExactLocation 為 true
      processedOpportunityData.location.showExactLocation = true;
    }

    const opportunity = new Opportunity({
      ...processedOpportunityData,
      hostId,
      publicId,
      slug,
      status: OpportunityStatus.PENDING,  // 設置為待審核狀態
      createdBy: userId,
      updatedBy: userId,
      reviewHistory: [{
        status: OpportunityStatus.PENDING,
        comment: '初次提交待審核',
        reviewedBy: null,
        createdAt: new Date()
      }]
    });

    // MongoDB 驗證
    try {
      // 使用 validateSync 進行 MongoDB 模型驗證
      const mongoValidationError = opportunity.validateSync();
      if (mongoValidationError) {
        console.error('MongoDB 驗證失敗:', mongoValidationError);

        // 格式化 MongoDB 驗證錯誤
        const mongoErrors = Object.keys(mongoValidationError.errors).map(key => {
          const err = mongoValidationError.errors[key];
          return `${key}: ${err.message}`;
        });

        return res.status(400).json({
          success: false,
          message: 'MongoDB 驗證失敗',
          errors: mongoErrors,
          code: 'MONGO_VALIDATION_FAILED'
        });
      }
    } catch (validationError) {
      console.error('驗證過程中發生錯誤:', validationError);
      return res.status(500).json({
        success: false,
        message: '驗證過程中發生錯誤',
        error: (validationError as Error).message
      });
    }

    // 保存到資料庫
    console.log('儲存機會到資料庫...');
    await opportunity.save();
    console.log('機會已成功保存，ID:', opportunity._id);

    // TODO: 發送通知給管理員進行審核

    // 回傳成功結果
    console.log('=== submit-for-review API 處理完成 ===');
    return res.status(201).json({
      success: true,
      message: '機會已送出審核',
      _id: opportunity._id,
      opportunity: JSON.parse(JSON.stringify(opportunity))
    });
  } catch (error: any) {
    console.error('送出審核失敗:', error);
    console.error('錯誤堆疊:', error.stack);

    // 尋找更多錯誤詳情
    let errorMessage = '送出審核時發生錯誤';
    let errorDetails = error.message;
    let statusCode = 500;
    let errorCode = 'SERVER_ERROR';

    // 檢查是否為驗證錯誤
    if (error.name === 'ValidationError') {
      console.error('驗證錯誤詳情:', error.errors);
      errorMessage = '資料驗證失敗';
      errorDetails = Object.values(error.errors || {})
        .map((err: any) => err.message)
        .join(', ');
      statusCode = 400;
      errorCode = 'VALIDATION_ERROR';
    } else if (error.name === 'MongoServerError') {
      // 處理 MongoDB 特定錯誤
      if (error.code === 11000) { // 重複鍵錯誤
        errorMessage = '資料重複錯誤';
        statusCode = 409;
        errorCode = 'DUPLICATE_KEY';
      }
    }

    console.log('=== submit-for-review API 處理失敗 ===');
    return res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: errorDetails,
      code: errorCode
    });
  }
}

// 格式化 Zod 錯誤為更友好的格式
function formatZodErrors(error: z.ZodError) {
  const formattedErrors: Record<string, string> = {};

  // 遍歷錯誤
  error.errors.forEach(err => {
    // 將路徑數組轉換為點分隔的字符串（例如 "media.coverImage.url"）
    const path = err.path.join('.');
    formattedErrors[path] = err.message;
  });

  return formattedErrors;
}