import { NextApiRequest, NextApiResponse } from 'next';
import { Opportunity } from '../../../models/index';
import { OpportunityStatus } from '../../../models/enums/OpportunityStatus';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '方法不允許' });
  }

  try {
    // 從查詢參數中獲取搜尋條件
    const {
      q,                  // 關鍵詞搜尋
      search,             // 另一個關鍵詞搜尋參數名 (前端使用)
      type,               // 機會類型
      region,             // 地區
      city,               // 城市
      country,            // 國家
      workType,           // 工作類型
      minHours,           // 最少工作時數
      maxHours,           // 最多工作時數
      startDateFrom,      // 開始日期範圍（從）
      startDateTo,        // 開始日期範圍（到）
      endDateFrom,        // 結束日期範圍（從）
      endDateTo,          // 結束日期範圍（到）
      minStay,            // 最短停留時間
      maxStay,            // 最長停留時間
      accommodationType,  // 住宿類型
      mealsProvided,      // 是否提供餐食
      stipendProvided,    // 是否提供津貼
      availableMonths,    // 可用月份 - 新格式為 "YYYY-MM,YYYY-MM,..."
      status = OpportunityStatus.ACTIVE, // 默認只搜尋活躍的機會
      near,               // 附近位置搜尋 (經度,緯度)
      distance,           // 搜尋半徑 (公里)
      sort = 'newest',    // 排序方式
      page = '1',         // 頁碼
      limit = '10'        // 每頁數量
    } = req.query;

    // 構建查詢條件
    let query: any = {};

    // 默認只搜尋活躍的機會
    query.status = status;

    // 關鍵詞搜尋（標題、描述、簡短描述）
    const searchTerm = q || search;
    if (searchTerm) {
      // 根據優先級分配不同的匹配條件
      // 標題和類型匹配是最高優先級
      const titleMatch = { title: { $regex: searchTerm, $options: 'i' } };
      const typeMatch = { type: { $regex: searchTerm, $options: 'i' } };
      const descMatch = { description: { $regex: searchTerm, $options: 'i' } };
      const shortDescMatch = { shortDescription: { $regex: searchTerm, $options: 'i' } };
      const cityMatch = { 'location.city': { $regex: searchTerm, $options: 'i' } };
      const regionMatch = { 'location.region': { $regex: searchTerm, $options: 'i' } };

      // 設置搜尋條件
      query.$or = [
        titleMatch, typeMatch, descMatch, shortDescMatch, cityMatch, regionMatch
      ];
    }

    // 機會類型篩選
    if (type) {
      query.type = type;
    }

    // 地區篩選
    if (region) {
      query['location.region'] = region;
    }

    // 城市篩選
    if (city) {
      query['location.city'] = city;
    }

    // 國家篩選
    if (country) {
      query['location.country'] = country;
    }

    // 工作類型篩選
    if (workType) {
      query['workDetails.workType'] = workType;
    }

    // 工作時數範圍篩選
    if (minHours) {
      query['workDetails.workHoursPerWeek'] = { $gte: parseInt(String(minHours), 10) };
    }

    if (maxHours) {
      if (query['workDetails.workHoursPerWeek']) {
        query['workDetails.workHoursPerWeek'].$lte = parseInt(String(maxHours), 10);
      } else {
        query['workDetails.workHoursPerWeek'] = { $lte: parseInt(String(maxHours), 10) };
      }
    }

    // 停留時間範圍篩選
    if (minStay) {
      query['workDetails.minimumStay'] = { $gte: parseInt(String(minStay), 10) };
    }

    if (maxStay) {
      query['workDetails.maximumStay'] = { $lte: parseInt(String(maxStay), 10) };
    }

    // 開始日期範圍篩選
    if (startDateFrom) {
      query['workDetails.startDate'] = { $gte: new Date(String(startDateFrom)) };
    }

    if (startDateTo) {
      if (query['workDetails.startDate']) {
        query['workDetails.startDate'].$lte = new Date(String(startDateTo));
      } else {
        query['workDetails.startDate'] = { $lte: new Date(String(startDateTo)) };
      }
    }

    // 結束日期範圍篩選
    if (endDateFrom) {
      query['workDetails.endDate'] = { $gte: new Date(String(endDateFrom)) };
    }

    if (endDateTo) {
      if (query['workDetails.endDate']) {
        query['workDetails.endDate'].$lte = new Date(String(endDateTo));
      } else {
        query['workDetails.endDate'] = { $lte: new Date(String(endDateTo)) };
      }
    }

    // 住宿類型篩選
    if (accommodationType) {
      query['benefits.accommodation.type'] = accommodationType;
    }

    // 是否提供餐食篩選
    if (mealsProvided === 'true') {
      query['benefits.meals.provided'] = true;
    }

    // 是否提供津貼篩選
    if (stipendProvided === 'true') {
      query['benefits.stipend.provided'] = true;
    }

    // 處理 availableMonths 參數
    if (availableMonths) {
      try {
        // 處理 availableMonths 參數 - 格式為 "YYYY-MM,YYYY-MM,..." 或 "YYYY-M,YYYY-M,..."
        const monthsArray = (availableMonths as string).split(',');
        console.log(`搜尋 API - 處理 availableMonths 參數: ${monthsArray.join(', ')}`);

        // 從 "YYYY-MM" 或 "YYYY-M" 格式中提取月份數字
        const monthNumbers = monthsArray
          .map(yearMonth => {
            if (!yearMonth || !yearMonth.includes('-')) return null;
            const parts = yearMonth.split('-');
            if (parts.length !== 2) return null;

            // 提取月份部分並轉換為數字
            const monthPart = parts[1];
            const monthNum = parseInt(monthPart, 10);

            // 驗證月份是否有效 (1-12)
            return monthNum >= 1 && monthNum <= 12 ? monthNum : null;
          })
          .filter((month): month is number => month !== null);

        if (monthNumbers.length > 0) {
          console.log(`搜尋 API - 找到有效月份: ${monthNumbers.join(', ')}`);

          // 添加數據庫查詢條件 - 尋找 workDetails.availableMonths 包含任一選中月份的機會
          query['workDetails.availableMonths'] = { $in: monthNumbers };
        } else {
          console.log('搜尋 API - 未找到有效月份，忽略月份篩選');
        }
      } catch (error) {
        console.error('搜尋 API - 處理 availableMonths 參數時出錯:', error);
      }
    } else {
      console.log('搜尋 API - 未提供 availableMonths 參數');
    }

    // 附近位置搜尋
    if (near && typeof near === 'string') {
      const [longitude, latitude] = near.split(',').map(coord => parseFloat(coord));

      if (!isNaN(longitude) && !isNaN(latitude) && distance) {
        const distanceInMeters = parseInt(String(distance), 10) * 1000; // 轉換為米

        query['location.coordinates'] = {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude]
            },
            $maxDistance: distanceInMeters
          }
        };
      }
    }

    // 計算總數
    const total = await Opportunity.countDocuments(query);

    // 分頁處理
    const pageNum = parseInt(String(page), 10);
    const limitNum = parseInt(String(limit), 10);
    const skip = (pageNum - 1) * limitNum;

    // 排序方式
    let sortOption: any = {};

    // 如果有搜尋關鍵字，先做一次檢索獲取相關性最高的結果
    if (searchTerm && (sort === 'newest' || sort === 'oldest' || !sort)) {
      // 當有搜尋關鍵字時，我們需要先檢查標題中包含關鍵字的，優先展示
      const titleMatchResults = await Opportunity.find({
        ...query,
        title: { $regex: searchTerm, $options: 'i' }
      }).select('_id');

      // 如果有標題匹配的結果，我們需要將它們排在前面
      if (titleMatchResults.length > 0) {
        const titleMatchIds = titleMatchResults.map(result => result._id);

        // 重建查詢，將標題匹配的排在前面
        query = {
          $or: [
            // 標題匹配的結果
            { _id: { $in: titleMatchIds } },
            // 其他匹配的結果
            { ...query, _id: { $nin: titleMatchIds } }
          ]
        };

        // 保持原本的時間排序作為第二層排序
        if (sort === 'oldest') {
          sortOption = { createdAt: 1 };
        } else {
          sortOption = { createdAt: -1 }; // 預設或 newest
        }
      } else {
        // 沒有標題匹配的結果，使用普通排序
        if (sort === 'oldest') {
          sortOption = { createdAt: 1 };
        } else {
          sortOption = { createdAt: -1 }; // 預設或 newest
        }
      }
    } else if (sort === 'newest') {
      sortOption = { createdAt: -1 };
    } else if (sort === 'oldest') {
      sortOption = { createdAt: 1 };
    } else if (sort === 'popular') {
      sortOption = { 'stats.views': -1 };
    } else if (sort === 'rating') {
      sortOption = { 'ratings.overall': -1 };
    } else {
      // 默認排序
      sortOption = { createdAt: -1 };
    }

    // 查詢工作機會列表
    const opportunities = await Opportunity.find(query)
      .populate('hostId', 'name description')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    // 獲取可用的篩選選項
    const availableTypes = await Opportunity.distinct('type', { status: OpportunityStatus.ACTIVE });
    const availableRegions = await Opportunity.distinct('location.region', { status: OpportunityStatus.ACTIVE });
    const availableCities = await Opportunity.distinct('location.city', { status: OpportunityStatus.ACTIVE });
    const availableCountries = await Opportunity.distinct('location.country', { status: OpportunityStatus.ACTIVE });

    // 返回結果
    return res.status(200).json({
      opportunities: opportunities.map(opp => {
        const coordinates = opp.location?.coordinates?.coordinates;
        return {
          id: opp._id,
          title: opp.title,
          slug: opp.slug,
          shortDescription: opp.shortDescription,
          type: opp.type,
          status: opp.status,
          location: {
            city: opp.location?.city,
            country: opp.location?.country,
            coordinates: coordinates ? {
              type: 'Point',
              coordinates: coordinates
            } : undefined
          },
          workDetails: {
            workHoursPerWeek: opp.workDetails?.workHoursPerWeek,
            workDaysPerWeek: opp.workDetails?.workDaysPerWeek,
            minimumStay: opp.workDetails?.minimumStay,
            maximumStay: opp.workDetails?.maximumStay,
            startDate: opp.workDetails?.startDate,
            endDate: opp.workDetails?.endDate,
            isOngoing: opp.workDetails?.isOngoing
          },
          benefits: {
            accommodation: opp.benefits?.accommodation,
            meals: opp.benefits?.meals,
            stipend: opp.benefits?.stipend
          },
          host: opp.hostId ? {
            id: (opp.hostId as any)._id,
            name: (opp.hostId as any).name,
            description: (opp.hostId as any).description
          } : null,
          ratings: opp.ratings,
          stats: {
            applications: opp.stats?.applications,
            bookmarks: opp.stats?.bookmarks
          },
          createdAt: opp.createdAt,
          updatedAt: opp.updatedAt
        };
      }),
      filters: {
        types: availableTypes,
        regions: availableRegions,
        cities: availableCities,
        countries: availableCountries
      },
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        currentPage: pageNum,
        hasNextPage: pageNum * limitNum < total,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error('搜尋工作機會失敗:', error);
    return res.status(500).json({ message: '搜尋工作機會時發生錯誤' });
  }
}
