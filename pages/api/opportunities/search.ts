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
  },
  {
    id: 'opp-004',
    title: '生態導覽員',
    slug: 'eco-tour-guide',
    description: '負責帶領遊客進行生態導覽，介紹當地自然環境和生態系統。需要有良好的溝通能力和環境知識。',
    workHours: 15,
    accommodation: '提供獨立房間，含早餐',
    benefits: ['生態保育培訓', '戶外活動機會', '專業導覽技巧學習'],
    requirements: ['對自然生態有興趣', '良好的溝通表達能力', '能夠進行中英文導覽', '可工作至少1個月'],
    startDate: '2023-08-01',
    endDate: '2023-11-30',
    hostId: 'host-004',
    hostName: '綠島生態保育中心',
    location: {
      address: '台東縣綠島鄉生態路789號',
      city: '台東縣',
      region: '東部',
      coordinates: [121.4900, 22.6600]
    },
    type: OpportunityType.CONSERVATION,
    workType: WorkType.TOUR_GUIDE,
    status: OpportunityStatus.ACTIVE,
    createdAt: '2023-05-15T09:20:00Z',
    updatedAt: '2023-05-15T09:20:00Z'
  },
  {
    id: 'opp-005',
    title: '藝術工作室助理',
    slug: 'art-studio-assistant',
    description: '協助藝術工作室日常運作，包括材料準備、作品整理、客戶接待等。有機會學習各種藝術技巧和創作過程。',
    workHours: 20,
    accommodation: '提供共享公寓，不含餐食',
    benefits: ['藝術創作指導', '展覽參與機會', '藝術社群交流'],
    requirements: ['對藝術有熱情', '基本美術基礎', '細心負責', '可工作至少3週'],
    startDate: '2023-07-15',
    endDate: '2023-10-15',
    hostId: 'host-005',
    hostName: '島嶼藝術工作室',
    location: {
      address: '台南市中西區藝術街456號',
      city: '台南市',
      region: '南部',
      coordinates: [120.2100, 22.9900]
    },
    type: OpportunityType.CREATIVE,
    workType: WorkType.CREATIVE,
    status: OpportunityStatus.ACTIVE,
    createdAt: '2023-05-20T13:45:00Z',
    updatedAt: '2023-05-20T13:45:00Z'
  }
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '方法不允許' });
  }

  try {
    // 從查詢參數中獲取搜尋條件
    const {
      q,                  // 關鍵詞搜尋
      type,               // 機會類型
      region,             // 地區
      city,               // 城市
      workType,           // 工作類型
      minHours,           // 最少工作時數
      maxHours,           // 最多工作時數
      startDateFrom,      // 開始日期範圍（從）
      startDateTo,        // 開始日期範圍（到）
      endDateFrom,        // 結束日期範圍（從）
      endDateTo,          // 結束日期範圍（到）
      accommodationType,  // 住宿類型（獨立/共享）
      status,             // 狀態
      sort = 'newest',    // 排序方式
      page = '1',         // 頁碼
      limit = '10'        // 每頁數量
    } = req.query;

    // 在實際應用中，這裡會查詢數據庫
    // 這裡我們使用模擬數據並應用複雜的篩選
    let filteredOpportunities = [...mockOpportunities];

    // 關鍵詞搜尋（標題、描述、主人名稱、地址）
    if (q) {
      const keyword = String(q).toLowerCase();
      filteredOpportunities = filteredOpportunities.filter(opp =>
        opp.title.toLowerCase().includes(keyword) ||
        opp.description.toLowerCase().includes(keyword) ||
        opp.hostName.toLowerCase().includes(keyword) ||
        opp.location.address.toLowerCase().includes(keyword)
      );
    }

    // 機會類型篩選
    if (type) {
      filteredOpportunities = filteredOpportunities.filter(opp =>
        opp.type === type
      );
    }

    // 地區篩選
    if (region) {
      filteredOpportunities = filteredOpportunities.filter(opp =>
        opp.location.region === region
      );
    }

    // 城市篩選
    if (city) {
      filteredOpportunities = filteredOpportunities.filter(opp =>
        opp.location.city === city
      );
    }

    // 工作類型篩選
    if (workType) {
      filteredOpportunities = filteredOpportunities.filter(opp =>
        opp.workType === workType
      );
    }

    // 工作時數範圍篩選
    if (minHours) {
      const min = parseInt(String(minHours), 10);
      filteredOpportunities = filteredOpportunities.filter(opp =>
        opp.workHours >= min
      );
    }

    if (maxHours) {
      const max = parseInt(String(maxHours), 10);
      filteredOpportunities = filteredOpportunities.filter(opp =>
        opp.workHours <= max
      );
    }

    // 開始日期範圍篩選
    if (startDateFrom) {
      const fromDate = new Date(String(startDateFrom));
      filteredOpportunities = filteredOpportunities.filter(opp =>
        new Date(opp.startDate) >= fromDate
      );
    }

    if (startDateTo) {
      const toDate = new Date(String(startDateTo));
      filteredOpportunities = filteredOpportunities.filter(opp =>
        new Date(opp.startDate) <= toDate
      );
    }

    // 結束日期範圍篩選
    if (endDateFrom) {
      const fromDate = new Date(String(endDateFrom));
      filteredOpportunities = filteredOpportunities.filter(opp =>
        new Date(opp.endDate) >= fromDate
      );
    }

    if (endDateTo) {
      const toDate = new Date(String(endDateTo));
      filteredOpportunities = filteredOpportunities.filter(opp =>
        new Date(opp.endDate) <= toDate
      );
    }

    // 住宿類型篩選（簡單實現，實際應用中可能需要更複雜的邏輯）
    if (accommodationType) {
      const accomType = String(accommodationType).toLowerCase();
      filteredOpportunities = filteredOpportunities.filter(opp =>
        opp.accommodation.toLowerCase().includes(accomType)
      );
    }

    // 狀態篩選
    if (status) {
      filteredOpportunities = filteredOpportunities.filter(opp =>
        opp.status === status
      );
    }

    // 排序
    switch (sort) {
      case 'newest':
        filteredOpportunities.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case 'oldest':
        filteredOpportunities.sort((a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
      case 'startingSoon':
        filteredOpportunities.sort((a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        );
        break;
      case 'longDuration':
        filteredOpportunities.sort((a, b) => {
          const aDuration = new Date(a.endDate).getTime() - new Date(a.startDate).getTime();
          const bDuration = new Date(b.endDate).getTime() - new Date(b.startDate).getTime();
          return bDuration - aDuration;
        });
        break;
      case 'shortDuration':
        filteredOpportunities.sort((a, b) => {
          const aDuration = new Date(a.endDate).getTime() - new Date(a.startDate).getTime();
          const bDuration = new Date(b.endDate).getTime() - new Date(b.startDate).getTime();
          return aDuration - bDuration;
        });
        break;
      case 'lessWorkHours':
        filteredOpportunities.sort((a, b) => a.workHours - b.workHours);
        break;
      case 'moreWorkHours':
        filteredOpportunities.sort((a, b) => b.workHours - a.workHours);
        break;
    }

    // 分頁處理
    const pageNum = parseInt(String(page), 10);
    const limitNum = parseInt(String(limit), 10);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = pageNum * limitNum;
    const paginatedOpportunities = filteredOpportunities.slice(startIndex, endIndex);

    // 返回結果
    return res.status(200).json({
      opportunities: paginatedOpportunities,
      pagination: {
        total: filteredOpportunities.length,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(filteredOpportunities.length / limitNum)
      },
      filters: {
        q,
        type,
        region,
        city,
        workType,
        minHours,
        maxHours,
        startDateFrom,
        startDateTo,
        endDateFrom,
        endDateTo,
        accommodationType,
        status,
        sort
      }
    });
  } catch (error) {
    console.error('搜尋工作機會失敗:', error);
    return res.status(500).json({ message: '搜尋工作機會時發生錯誤' });
  }
}
