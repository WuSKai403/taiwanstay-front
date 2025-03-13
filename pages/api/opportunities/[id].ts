import { NextApiRequest, NextApiResponse } from 'next';
import { OpportunityStatus, OpportunityType, WorkType } from '../../../models/enums';

// 模擬數據 - 在實際應用中，這些數據會來自數據庫
const mockOpportunities = [
  {
    id: 'opp-001',
    title: '民宿櫃檯接待人員',
    slug: 'minsu-front-desk',
    description: '負責民宿櫃檯接待、訂房管理、客戶服務等工作。提供舒適住宿環境，每週工作5天，每天4小時。',
    workHours: 20,
    accommodation: '提供獨立單人房，含三餐',
    benefits: ['免費WiFi', '可使用公共設施', '機會學習當地文化'],
    requirements: ['基本英語溝通能力', '親切有禮的服務態度', '可工作至少1個月'],
    startDate: '2023-06-01',
    endDate: '2023-09-30',
    hostId: 'host-001',
    hostName: '山海民宿',
    location: {
      address: '宜蘭縣礁溪鄉溫泉路123號',
      city: '宜蘭縣',
      region: '北部',
      coordinates: [121.7683, 24.8256]
    },
    type: OpportunityType.HOSPITALITY,
    workType: WorkType.RECEPTION,
    status: OpportunityStatus.ACTIVE,
    createdAt: '2023-05-01T08:00:00Z',
    updatedAt: '2023-05-01T08:00:00Z'
  },
  {
    id: 'opp-002',
    title: '有機農場助理',
    slug: 'organic-farm-assistant',
    description: '協助有機農場日常運作，包括種植、收穫、包裝等工作。體驗有機農業生活，學習永續農業知識。',
    workHours: 25,
    accommodation: '提供共享房間，含三餐素食',
    benefits: ['有機蔬果供應', '農業技術培訓', '寧靜的鄉村環境'],
    requirements: ['喜愛戶外工作', '基本體力', '對有機農業有興趣', '可工作至少2週'],
    startDate: '2023-07-01',
    endDate: '2023-10-31',
    hostId: 'host-002',
    hostName: '綠野有機農場',
    location: {
      address: '花蓮縣壽豐鄉農場路456號',
      city: '花蓮縣',
      region: '東部',
      coordinates: [121.6008, 23.8874]
    },
    type: OpportunityType.FARMING,
    workType: WorkType.FARMING,
    status: OpportunityStatus.ACTIVE,
    createdAt: '2023-05-05T10:30:00Z',
    updatedAt: '2023-05-05T10:30:00Z'
  },
  {
    id: 'opp-003',
    title: '咖啡廳服務人員',
    slug: 'cafe-service-staff',
    description: '負責點餐、製作飲品、清潔等工作。位於熱門觀光區，能接觸各地旅客，提升服務和語言能力。',
    workHours: 18,
    accommodation: '提供員工宿舍，不含餐食但有員工餐點折扣',
    benefits: ['專業咖啡師培訓', '國際旅客交流機會', '優美的工作環境'],
    requirements: ['基本英語溝通能力', '有餐飲服務經驗優先', '可工作至少3週'],
    startDate: '2023-06-15',
    endDate: '2023-08-31',
    hostId: 'host-003',
    hostName: '山角咖啡',
    location: {
      address: '台北市信義區松山路789號',
      city: '台北市',
      region: '北部',
      coordinates: [121.5654, 25.0330]
    },
    type: OpportunityType.HOSPITALITY,
    workType: WorkType.FOOD_SERVICE,
    status: OpportunityStatus.ACTIVE,
    createdAt: '2023-05-10T14:15:00Z',
    updatedAt: '2023-05-10T14:15:00Z'
  }
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: '無效的工作機會ID' });
  }

  switch (req.method) {
    case 'GET':
      return getOpportunity(req, res, id);
    case 'PUT':
      return updateOpportunity(req, res, id);
    case 'DELETE':
      return deleteOpportunity(req, res, id);
    default:
      return res.status(405).json({ message: '方法不允許' });
  }
}

// 獲取單個工作機會
async function getOpportunity(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    // 在實際應用中，這裡會查詢數據庫
    // 這裡我們使用模擬數據
    const opportunity = mockOpportunities.find(opp => opp.id === id);

    if (!opportunity) {
      return res.status(404).json({ message: '找不到該工作機會' });
    }

    return res.status(200).json({ opportunity });
  } catch (error) {
    console.error('獲取工作機會失敗:', error);
    return res.status(500).json({ message: '獲取工作機會時發生錯誤' });
  }
}

// 更新工作機會
async function updateOpportunity(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    // 在實際應用中，這裡會驗證用戶身份和權限
    // 並更新數據庫中的數據

    // 檢查工作機會是否存在
    const opportunityIndex = mockOpportunities.findIndex(opp => opp.id === id);

    if (opportunityIndex === -1) {
      return res.status(404).json({ message: '找不到該工作機會' });
    }

    const {
      title,
      description,
      workHours,
      accommodation,
      benefits,
      requirements,
      startDate,
      endDate,
      location,
      type,
      workType,
      status
    } = req.body;

    // 基本驗證
    if (!title || !description || !workHours || !accommodation || !startDate || !endDate) {
      return res.status(400).json({ message: '缺少必要欄位' });
    }

    // 在實際應用中，這裡會更新數據庫
    // 這裡我們只返回模擬的成功響應
    const updatedOpportunity = {
      ...mockOpportunities[opportunityIndex],
      title,
      slug: title.toLowerCase().replace(/\s+/g, '-'),
      description,
      workHours,
      accommodation,
      benefits: benefits || mockOpportunities[opportunityIndex].benefits,
      requirements: requirements || mockOpportunities[opportunityIndex].requirements,
      startDate,
      endDate,
      location: location || mockOpportunities[opportunityIndex].location,
      type: type || mockOpportunities[opportunityIndex].type,
      workType: workType || mockOpportunities[opportunityIndex].workType,
      status: status || mockOpportunities[opportunityIndex].status,
      updatedAt: new Date().toISOString()
    };

    // 在實際應用中，這裡會保存到數據庫
    mockOpportunities[opportunityIndex] = updatedOpportunity;

    return res.status(200).json({
      message: '工作機會更新成功',
      opportunity: updatedOpportunity
    });
  } catch (error) {
    console.error('更新工作機會失敗:', error);
    return res.status(500).json({ message: '更新工作機會時發生錯誤' });
  }
}

// 刪除工作機會
async function deleteOpportunity(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    // 在實際應用中，這裡會驗證用戶身份和權限
    // 並從數據庫中刪除數據

    // 檢查工作機會是否存在
    const opportunityIndex = mockOpportunities.findIndex(opp => opp.id === id);

    if (opportunityIndex === -1) {
      return res.status(404).json({ message: '找不到該工作機會' });
    }

    // 在實際應用中，這裡會從數據庫中刪除
    // 這裡我們只返回模擬的成功響應

    return res.status(200).json({
      message: '工作機會刪除成功',
      id
    });
  } catch (error) {
    console.error('刪除工作機會失敗:', error);
    return res.status(500).json({ message: '刪除工作機會時發生錯誤' });
  }
}