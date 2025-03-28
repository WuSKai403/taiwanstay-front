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
      status = OpportunityStatus.ACTIVE, // 默認只搜尋活躍的機會
      near,               // 附近位置搜尋 (經度,緯度)
      distance,           // 搜尋半徑 (公里)
      sort = 'newest',    // 排序方式
      page = '1',         // 頁碼
      limit = '10'        // 每頁數量
    } = req.query;

    // 構建查詢條件
    const query: any = {};

    // 默認只搜尋活躍的機會
    query.status = status;

    // 關鍵詞搜尋（標題、描述、簡短描述）
    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { shortDescription: { $regex: q, $options: 'i' } }
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
    if (sort === 'newest') {
      sortOption = { createdAt: -1 };
    } else if (sort === 'oldest') {
      sortOption = { createdAt: 1 };
    } else if (sort === 'popular') {
      sortOption = { 'stats.views': -1 };
    } else if (sort === 'rating') {
      sortOption = { 'ratings.overall': -1 };
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
              lat: coordinates[1],
              lng: coordinates[0]
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
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('搜尋工作機會失敗:', error);
    return res.status(500).json({ message: '搜尋工作機會時發生錯誤' });
  }
}
