import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/mongodb';
import { Opportunity, Host } from '../../../models/index';
import { OpportunityStatus, OpportunityType, TimeSlotStatus } from '../../../models/enums';
import mongoose from 'mongoose';
import { ApiError } from '@/lib/errors';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '@/lib/dbConnect';
import { validateOpportunityDraft } from '@/lib/schemas/opportunityDraft';

// 創建工作機會草稿的 API 端點
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 只允許 POST 請求
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: '方法不允許' });
  }

  try {
    // 連接到數據庫
    await connectToDatabase();

    // 使用 getServerSession 獲取用戶會話
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({
        success: false,
        message: '未授權，請先登入'
      });
    }

    // 檢查用戶是否是主辦方
    const host = await Host.findOne({ userId: session.user.id });

    if (!host) {
      return res.status(403).json({
        success: false,
        message: '只有認證的主辦方可以創建機會'
      });
    }

    // 獲取請求數據
    const opportunityData = req.body;

    // 使用草稿驗證函數，只驗證標題
    const validationResult = validateOpportunityDraft(opportunityData);

    if (!validationResult.isValid) {
      return res.status(400).json({
        success: false,
        message: '草稿驗證失敗',
        errors: validationResult.errors
      });
    }

    // 基於原始數據創建新的乾淨物件
    // 使用最小化的必要欄位集合，而不是複製整個數據結構
    const cleanedData = {
      // 基本資訊
      title: opportunityData.title,
      description: opportunityData.description || '',
      shortDescription: opportunityData.shortDescription || '',
      type: opportunityData.type || 'FARMING',
      status: OpportunityStatus.DRAFT,

      // 必須的 ID 和時間戳記
      hostId: host._id,
      publicId: new mongoose.Types.ObjectId().toString(),
      slug: opportunityData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') +
        '-' +
        Date.now().toString().slice(-6),
      createdAt: new Date(),
      updatedAt: new Date(),

      // 基本的空欄位結構
      workDetails: {
        tasks: [],
        skills: [],
        learningOpportunities: [],
        physicalDemand: 'medium',
        languages: [],
        availableMonths: []
      },

      hasTimeSlots: true,
      timeSlots: [{
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        defaultCapacity: 1,
        minimumStay: 7,
        description: '',
        status: 'OPEN',
        appliedCount: 0,
        confirmedCount: 0
      }],

      benefits: {
        accommodation: { provided: false },
        meals: { provided: false },
        stipend: { provided: false },
        otherBenefits: []
      },

      requirements: {
        acceptsCouples: false,
        acceptsFamilies: false,
        acceptsPets: false,
        drivingLicense: {
          carRequired: false,
          motorcycleRequired: false,
          otherRequired: false
        }
      },

      // 不包含任何座標的位置欄位
      location: {
        address: opportunityData.location?.address || '',
        city: opportunityData.location?.city || '',
        district: opportunityData.location?.district || '',
        country: 'Taiwan',
        coordinates: opportunityData.location?.coordinates || null
      },

      // 其他必要的統計和狀態欄位
      media: { gallery: [], videos: [] },
      applicationProcess: { questions: [], currentApplications: 0 },
      impact: { sustainableDevelopmentGoals: [] },
      ratings: {
        overall: 0,
        workEnvironment: 0,
        accommodation: 0,
        food: 0,
        hostHospitality: 0,
        learningOpportunities: 0,
        reviewCount: 0
      },
      stats: {
        views: 0,
        applications: 0,
        bookmarks: 0,
        shares: 0
      }
    };

    // 建立新機會草稿
    const newOpportunity = new Opportunity({
      hostId: cleanedData.hostId,
      title: cleanedData.title || '未命名機會草稿',
      description: cleanedData.description || '',
      shortDescription: cleanedData.shortDescription || '',
      publicId: cleanedData.publicId,
      slug: cleanedData.slug,
      type: cleanedData.type || OpportunityType.OTHER,
      status: OpportunityStatus.DRAFT,
      location: {
        city: cleanedData.location?.city || '',
        district: cleanedData.location?.district || '',
        country: cleanedData.location?.country || 'Taiwan',
        address: cleanedData.location?.address || '',
        coordinates: cleanedData.location?.coordinates || null
      },
      workDetails: {
        tasks: cleanedData.workDetails?.tasks || [],
        skills: cleanedData.workDetails?.skills || [],
        physicalDemand: cleanedData.workDetails?.physicalDemand || 'medium',
        languages: cleanedData.workDetails?.languages || ['Chinese'],
      },
      // 新增時間段管理欄位，替換 workTimeSettings
      hasTimeSlots: cleanedData.hasTimeSlots || true,
      timeSlots: cleanedData.timeSlots || [{
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        defaultCapacity: 1,
        minimumStay: 7,
        description: '',
        status: TimeSlotStatus.OPEN,
        appliedCount: 0,
        confirmedCount: 0
      }],
      benefits: {
        accommodation: cleanedData.benefits?.accommodation || { provided: false },
        meals: cleanedData.benefits?.meals || { provided: false },
        stipend: cleanedData.benefits?.stipend || { provided: false },
      },
      requirements: cleanedData.requirements || {},
      media: cleanedData.media || {}
    });

    // 創建新機會草稿 - 使用原生MongoDB操作，跳過Schema驗證和索引
    if (!mongoose.connection || !mongoose.connection.db) {
      throw new Error('MongoDB 連接未初始化');
    }
    const db = mongoose.connection.db;
    const result = await db.collection('opportunities').insertOne(cleanedData);

    if (!result.acknowledged) {
      throw new Error('儲存草稿失敗');
    }

    console.log(`草稿已儲存，ID: ${result.insertedId}, 標題: ${cleanedData.title}`);

    return res.status(201).json({
      success: true,
      message: '草稿已儲存',
      _id: result.insertedId,
      opportunity: JSON.parse(JSON.stringify(cleanedData))
    });
  } catch (error: any) {
    console.error('儲存草稿時出錯:', error);
    return res.status(500).json({
      success: false,
      message: '服務器錯誤',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}