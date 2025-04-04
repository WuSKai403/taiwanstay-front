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
 *               hostId:
 *                 type: string
 *               timeSlotId:
 *                 type: string
 *               applicationDetails:
 *                 type: object
 *                 required:
 *                   - message
 *                   - startMonth
 *                   - endMonth
 *                   - duration
 *                 properties:
 *                   message:
 *                     type: string
 *                   startMonth:
 *                     type: string
 *                     description: YYYY-MM 格式的開始月份
 *                   endMonth:
 *                     type: string
 *                     description: YYYY-MM 格式的結束月份
 *                   duration:
 *                     type: integer
 *                     description: 停留天數
 *                   availableMonths:
 *                     type: array
 *                     items:
 *                       type: string
 *                   travelingWith:
 *                     type: object
 *                     properties:
 *                       partner:
 *                         type: boolean
 *                       children:
 *                         type: boolean
 *                       pets:
 *                         type: boolean
 *                       details:
 *                         type: string
 *                   specialRequirements:
 *                     type: string
 *                   dietaryRestrictions:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: array
 *                         items:
 *                           type: string
 *                       otherDetails:
 *                         type: string
 *                       vegetarianType:
 *                         type: string
 *                   languages:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         language:
 *                           type: string
 *                         level:
 *                           type: string
 *                   relevantExperience:
 *                     type: string
 *                   motivation:
 *                     type: string
 *                   nationality:
 *                     type: string
 *                   visaType:
 *                     type: string
 *                   allergies:
 *                     type: string
 *                   drivingLicense:
 *                     type: object
 *                   workExperience:
 *                     type: array
 *                   physicalCondition:
 *                     type: string
 *                   skills:
 *                     type: string
 *                   preferredWorkHours:
 *                     type: string
 *                   accommodationNeeds:
 *                     type: string
 *                   culturalInterests:
 *                     type: array
 *                   learningGoals:
 *                     type: array
 *                   contribution:
 *                     type: string
 *                   adaptabilityRatings:
 *                     type: object
 *                   photos:
 *                     type: array
 *                   videoIntroduction:
 *                     type: object
 *                   additionalNotes:
 *                     type: string
 *                   sourceChannel:
 *                     type: string
 *                   termsAgreed:
 *                     type: boolean
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

    console.log('===== 申請創建開始 =====');
    const { opportunityId, hostId, timeSlotId, applicationDetails } = req.body;

    // 輸出請求體的關鍵部分
    console.log('請求體摘要:', {
      opportunityId,
      hostId,
      timeSlotId,
      'applicationDetails.message': applicationDetails?.message?.substring(0, 20) + '...',
      'applicationDetails.languages': applicationDetails?.languages,
      'applicationDetails.languages類型': typeof applicationDetails?.languages,
      'applicationDetails.languages是否數組': Array.isArray(applicationDetails?.languages),
      'applicationDetails.dietaryRestrictions': applicationDetails?.dietaryRestrictions,
      'applicationDetails.dietaryRestrictions類型': typeof applicationDetails?.dietaryRestrictions,
      'applicationDetails.photoDescriptions': applicationDetails?.photoDescriptions,
      'applicationDetails.photoDescriptions類型': typeof applicationDetails?.photoDescriptions,
      'applicationDetails.videoIntroduction': applicationDetails?.videoIntroduction,
      'applicationDetails.videoIntroduction類型': typeof applicationDetails?.videoIntroduction
    });

    // 驗證必填欄位
    if (!opportunityId || !applicationDetails || !applicationDetails.message || !applicationDetails.startMonth || !applicationDetails.duration) {
      console.log('缺少必填欄位:', {
        hasOpportunityId: !!opportunityId,
        hasApplicationDetails: !!applicationDetails,
        hasMessage: !!applicationDetails?.message,
        hasStartMonth: !!applicationDetails?.startMonth,
        hasDuration: !!applicationDetails?.duration
      });
      return res.status(400).json({ success: false, message: '缺少必填欄位' });
    }

    // 檢查語言欄位是否至少有一個
    if (!applicationDetails.languages || !Array.isArray(applicationDetails.languages) || applicationDetails.languages.length === 0) {
      console.log('語言欄位驗證失敗:', {
        hasLanguages: !!applicationDetails.languages,
        isArray: Array.isArray(applicationDetails.languages),
        length: applicationDetails.languages ? applicationDetails.languages.length : 0
      });
      return res.status(400).json({ success: false, message: '請至少選擇一種語言能力' });
    }

    // 檢查工作機會是否存在
    console.log('嘗試查詢工作機會:', {
      opportunityId,
      idType: typeof opportunityId,
      idLength: opportunityId ? opportunityId.length : 0,
      isValidObjectId: opportunityId && /^[0-9a-fA-F]{24}$/.test(opportunityId)
    });

    let opportunity;
    try {
      opportunity = await Opportunity.findById(opportunityId).exec();

      if (!opportunity) {
        console.log('工作機會不存在:', opportunityId);

        // 嘗試使用其他方式查詢（用於診斷）
        const allOpportunities = await Opportunity.find({}).limit(5).select('_id title');
        console.log('資料庫中的工作機會樣本:', JSON.stringify(allOpportunities));

        return res.status(404).json({ success: false, message: '工作機會不存在' });
      }

      console.log('工作機會檢查通過:', {
        opportunityId: opportunity._id,
        title: opportunity.title,
        hostId: opportunity.hostId
      });
    } catch (error) {
      console.error('檢查工作機會時發生錯誤:', error);
      return res.status(500).json({ success: false, message: '檢查工作機會失敗', error: error instanceof Error ? error.message : String(error) });
    }

    console.log('工作機會檢查通過');

    // 檢查時段是否存在（如果提供了時段ID）
    if (timeSlotId) {
      const timeSlot = opportunity.timeSlots?.id(timeSlotId);
      if (!timeSlot) {
        console.log('時段不存在:', timeSlotId);
        return res.status(404).json({ success: false, message: '時段不存在' });
      }

      // 檢查時段是否開放申請
      if (timeSlot.status !== 'OPEN') {
        console.log('時段已不開放申請:', timeSlot.status);
        return res.status(400).json({ success: false, message: '該時段已不開放申請' });
      }

      // 檢查申請的月份是否在時段範圍內
      // 將 YYYY-MM 格式轉換為 Date 對象用於比較
      const startMonth = new Date(`${applicationDetails.startMonth}-01`);
      const endMonth = applicationDetails.endMonth
        ? new Date(`${applicationDetails.endMonth}-01`)
        : new Date(startMonth.getFullYear(), startMonth.getMonth() + Math.floor(applicationDetails.duration / 30), 1);

      const timeSlotStartMonth = new Date(`${timeSlot.startMonth}-01`);
      const timeSlotEndMonth = new Date(`${timeSlot.endMonth}-01`);

      console.log('月份範圍檢查:', {
        startMonth,
        endMonth,
        timeSlotStartMonth,
        timeSlotEndMonth,
        isStartValid: startMonth >= timeSlotStartMonth,
        isEndValid: endMonth <= timeSlotEndMonth
      });

      if (startMonth < timeSlotStartMonth || endMonth > timeSlotEndMonth) {
        return res.status(400).json({ success: false, message: '申請的月份範圍超出了時段的有效期' });
      }

      // 檢查停留時間是否符合最短要求
      console.log('停留時間檢查:', {
        duration: applicationDetails.duration,
        minimumStay: timeSlot.minimumStay,
        isValid: applicationDetails.duration >= timeSlot.minimumStay
      });

      if (applicationDetails.duration < timeSlot.minimumStay) {
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
      console.log('用戶已申請過該工作機會:', {
        userId,
        opportunityId,
        timeSlotId,
        existingApplicationId: existingApplication._id
      });
      return res.status(400).json({ success: false, message: '您已經申請過該工作機會的這個時段' });
    }

    // 處理可能導致驗證失敗的欄位

    // 記錄dietaryRestrictions的原始格式
    console.log('dietaryRestrictions 原始資料:', JSON.stringify(applicationDetails.dietaryRestrictions));

    // 嚴格檢查dietaryRestrictions的型別和內容
    if (applicationDetails.dietaryRestrictions === undefined || applicationDetails.dietaryRestrictions === null) {
      console.log('dietaryRestrictions不存在，創建預設值');
      applicationDetails.dietaryRestrictions = {
        type: [],
        otherDetails: '',
        vegetarianType: ''
      };
    } else {
      console.log('dietaryRestrictions型別檢查:',
        typeof applicationDetails.dietaryRestrictions,
        Array.isArray(applicationDetails.dietaryRestrictions),
        applicationDetails.dietaryRestrictions
      );

      try {
        // 對於JSON字串的處理
        if (typeof applicationDetails.dietaryRestrictions === 'string') {
          console.log('dietaryRestrictions是字串，嘗試將其解析為JSON...');
          try {
            const parsedDR = JSON.parse(applicationDetails.dietaryRestrictions);
            applicationDetails.dietaryRestrictions = parsedDR;
          } catch (e) {
            console.error('dietaryRestrictions字串無法解析為JSON:', e);
            applicationDetails.dietaryRestrictions = {
              type: (typeof applicationDetails.dietaryRestrictions === 'string' && applicationDetails.dietaryRestrictions.length > 0)
                ? [applicationDetails.dietaryRestrictions]
                : [],
              otherDetails: '',
              vegetarianType: ''
            };
          }
        }

        // 如果是陣列，轉換為正確的物件結構
        if (Array.isArray(applicationDetails.dietaryRestrictions)) {
          console.log('dietaryRestrictions是陣列，轉換為物件結構');
          applicationDetails.dietaryRestrictions = {
            type: applicationDetails.dietaryRestrictions,
            otherDetails: '',
            vegetarianType: ''
          };
        }

        // 最終確保它是預期的物件格式
        if (typeof applicationDetails.dietaryRestrictions !== 'object' ||
            applicationDetails.dietaryRestrictions === null ||
            Array.isArray(applicationDetails.dietaryRestrictions)) {
          console.error('dietaryRestrictions不是預期的物件格式，重置為預設值');
          applicationDetails.dietaryRestrictions = {
            type: [],
            otherDetails: '',
            vegetarianType: ''
          };
        } else {
          // 是物件，但需要確保內部欄位格式正確
          const tempDR = {
            type: [],
            otherDetails: '',
            vegetarianType: ''
          };

          // 處理type欄位
          if (applicationDetails.dietaryRestrictions.type !== undefined) {
            if (Array.isArray(applicationDetails.dietaryRestrictions.type)) {
              tempDR.type = applicationDetails.dietaryRestrictions.type;
            } else if (typeof applicationDetails.dietaryRestrictions.type === 'string') {
              tempDR.type = [applicationDetails.dietaryRestrictions.type];
            } else {
              console.warn('dietaryRestrictions.type格式異常:', typeof applicationDetails.dietaryRestrictions.type);
            }
          }

          // 處理otherDetails欄位
          if (applicationDetails.dietaryRestrictions.otherDetails !== undefined) {
            tempDR.otherDetails = String(applicationDetails.dietaryRestrictions.otherDetails);
          }

          // 處理vegetarianType欄位
          if (applicationDetails.dietaryRestrictions.vegetarianType !== undefined) {
            tempDR.vegetarianType = String(applicationDetails.dietaryRestrictions.vegetarianType);
          }

          applicationDetails.dietaryRestrictions = tempDR;
        }
      } catch (error) {
        console.error('處理dietaryRestrictions時發生未預期錯誤:', error);
        applicationDetails.dietaryRestrictions = {
          type: [],
          otherDetails: '',
          vegetarianType: ''
        };
      }
    }

    console.log('dietaryRestrictions處理後結果:', JSON.stringify(applicationDetails.dietaryRestrictions));
    console.log('dietaryRestrictions.type型別:', typeof applicationDetails.dietaryRestrictions.type);
    console.log('dietaryRestrictions.type是否為陣列:', Array.isArray(applicationDetails.dietaryRestrictions.type));

    // 確保languages是物件陣列
    if (applicationDetails.languages && typeof applicationDetails.languages[0] === 'string') {
      console.log('修正languages格式:', applicationDetails.languages);
      applicationDetails.languages = applicationDetails.languages.map((lang: string) => {
        const parts = lang.split('(');
        return {
          language: parts[0],
          level: parts.length > 1 ? parts[1].replace(')', '') : 'native'
        };
      });
    }

    // 確保photoDescriptions是物件而非陣列
    if (applicationDetails.photoDescriptions &&
        (Array.isArray(applicationDetails.photoDescriptions) ||
         typeof applicationDetails.photoDescriptions !== 'object')) {
      console.log('修正photoDescriptions格式:', applicationDetails.photoDescriptions);
      applicationDetails.photoDescriptions = {};
    }

    // 確保videoIntroduction是物件
    if (applicationDetails.videoIntroduction &&
        typeof applicationDetails.videoIntroduction === 'string') {
      console.log('修正videoIntroduction格式:', applicationDetails.videoIntroduction);
      applicationDetails.videoIntroduction = {
        url: applicationDetails.videoIntroduction
      };
    }

    // 創建申請前的最終檢查
    console.log('最終資料檢查:', {
      'dietaryRestrictions類型': typeof applicationDetails.dietaryRestrictions,
      'dietaryRestrictions.type類型': typeof applicationDetails.dietaryRestrictions?.type,
      'dietaryRestrictions.type是否陣列': Array.isArray(applicationDetails.dietaryRestrictions?.type),
      'dietaryRestrictions.type值': applicationDetails.dietaryRestrictions?.type,
      'languages類型': typeof applicationDetails.languages,
      'languages是否陣列': Array.isArray(applicationDetails.languages),
      'languages值': applicationDetails.languages,
      'photoDescriptions類型': typeof applicationDetails.photoDescriptions,
      'photoDescriptions是否物件': typeof applicationDetails.photoDescriptions === 'object' && !Array.isArray(applicationDetails.photoDescriptions),
      'videoIntroduction類型': typeof applicationDetails.videoIntroduction,
      'videoIntroduction是否物件': typeof applicationDetails.videoIntroduction === 'object'
    });

    // 創建申請
    console.log('準備創建申請...');
    const application = new Application({
      userId,
      opportunityId,
      hostId: hostId || opportunity.hostId, // 允許傳入 hostId 或從機會獲取
      timeSlotId,
      status: ApplicationStatus.PENDING,
      applicationDetails: {
        ...applicationDetails,
        // 確保必填欄位存在
        message: applicationDetails.message,
        startMonth: applicationDetails.startMonth,
        endMonth: applicationDetails.endMonth,
        duration: applicationDetails.duration,
        // 確保 termsAgreed 為布爾值
        termsAgreed: !!applicationDetails.termsAgreed
      }
    });

    try {
      // 保存申請
      console.log('保存申請...');
      await application.save();
      console.log('申請已成功保存:', application._id);

      // 更新時段的申請計數（如果適用）
      if (timeSlotId && opportunity.timeSlots) {
        const timeSlot = opportunity.timeSlots.id(timeSlotId);
        if (timeSlot) {
          console.log('更新時段申請計數...');
          timeSlot.appliedCount = (timeSlot.appliedCount || 0) + 1;
          await opportunity.save();
          console.log('時段申請計數已更新');
        }
      }

      // 返回成功響應
      console.log('===== 申請創建成功 =====');
      return res.status(201).json({
        success: true,
        data: { applicationId: application._id },
        message: '申請已成功提交'
      });
    } catch (error: any) {
      console.error('保存申請時發生錯誤:', error);

      // 提供更詳細的驗證錯誤信息
      if (error.name === 'ValidationError') {
        const validationErrors = Object.keys(error.errors).map(field => {
          return {
            field,
            message: error.errors[field].message,
            value: error.errors[field].value,
            kind: error.errors[field].kind
          };
        });

        console.log('驗證錯誤詳情:', validationErrors);

        return res.status(400).json({
          success: false,
          message: '申請資料驗證失敗',
          validationErrors
        });
      }

      throw error;
    }
  } catch (error: any) {
    console.error('創建申請錯誤:', error);
    return res.status(500).json({ success: false, message: '創建申請失敗', error: error.message });
  }
}