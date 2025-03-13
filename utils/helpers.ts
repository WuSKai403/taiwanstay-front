import { Opportunity } from '../models/index';

/**
 * 生成唯一的公開 ID
 * @param size ID 長度，預設為 10
 * @returns 生成的公開 ID
 */
export function generatePublicId(size: number = 10): string {
  // 使用簡單的隨機字符串生成方法替代 nanoid
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < size; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 將標題轉換為URL友好的slug
 * @param title 標題
 * @param publicId 公開 ID，如果提供則會生成 {publicId}-{slug} 格式
 * @returns 生成的slug
 */
export async function generateSlug(title: string, publicId?: string): Promise<string> {
  // 將標題轉換為小寫
  let slug = title.toLowerCase();

  // 替換非字母數字字符為連字符
  slug = slug.replace(/[^\w\u4e00-\u9fa5]+/g, '-');

  // 移除開頭和結尾的連字符
  slug = slug.replace(/^-+|-+$/g, '');

  // 將中文字符轉換為拼音或其他處理方式
  // 這裡簡單處理，實際應用可能需要更複雜的轉換
  slug = slug.replace(/[\u4e00-\u9fa5]/g, (match) => {
    // 這裡可以添加中文轉拼音的邏輯
    // 簡單示例，實際應用需要更完善的轉換
    return encodeURIComponent(match).replace(/%/g, '');
  });

  // 如果提供了 publicId，則生成 {publicId}-{slug} 格式
  if (publicId) {
    return `${publicId}-${slug}`;
  }

  // 確保slug是唯一的
  // 在實際應用中，可能需要檢查數據庫中是否已存在相同的slug

  return slug;
}

/**
 * 檢查字符串是否為有效的MongoDB ObjectId
 * @param id 要檢查的ID字符串
 * @returns 是否為有效的ObjectId
 */
export function isValidObjectId(id: string): boolean {
  const objectIdPattern = /^[0-9a-fA-F]{24}$/;
  return objectIdPattern.test(id);
}

/**
 * 格式化日期為YYYY-MM-DD格式
 * @param date 日期對象
 * @returns 格式化後的日期字符串
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * 將查詢參數轉換為MongoDB查詢條件
 * @param query 查詢參數對象
 * @returns MongoDB查詢條件
 */
export function buildMongoQuery(query: Record<string, any>): Record<string, any> {
  const mongoQuery: Record<string, any> = {};

  // 處理一般查詢參數
  Object.keys(query).forEach(key => {
    // 忽略分頁參數
    if (['page', 'limit', 'sort', 'order'].includes(key)) {
      return;
    }

    const value = query[key];

    // 處理特殊查詢操作符
    if (key.includes('_')) {
      const [field, operator] = key.split('_');

      switch (operator) {
        case 'gt':
          mongoQuery[field] = { ...mongoQuery[field], $gt: value };
          break;
        case 'gte':
          mongoQuery[field] = { ...mongoQuery[field], $gte: value };
          break;
        case 'lt':
          mongoQuery[field] = { ...mongoQuery[field], $lt: value };
          break;
        case 'lte':
          mongoQuery[field] = { ...mongoQuery[field], $lte: value };
          break;
        case 'ne':
          mongoQuery[field] = { ...mongoQuery[field], $ne: value };
          break;
        case 'in':
          mongoQuery[field] = { ...mongoQuery[field], $in: Array.isArray(value) ? value : [value] };
          break;
        default:
          mongoQuery[key] = value;
      }
    } else {
      // 處理一般查詢
      mongoQuery[key] = value;
    }
  });

  return mongoQuery;
}

/**
 * 計算分頁信息
 * @param page 頁碼
 * @param limit 每頁數量
 * @param total 總數量
 * @returns 分頁信息
 */
export function calculatePagination(page: number, limit: number, total: number) {
  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  return {
    totalItems: total,
    itemsPerPage: limit,
    totalPages,
    currentPage,
    hasNextPage,
    hasPrevPage
  };
}

/**
 * 計算兩個日期之間的天數
 * @param startDate 開始日期
 * @param endDate 結束日期
 * @returns 天數
 */
export function daysBetween(startDate: Date, endDate: Date): number {
  const oneDay = 24 * 60 * 60 * 1000; // 一天的毫秒數
  return Math.round(Math.abs((startDate.getTime() - endDate.getTime()) / oneDay));
}

/**
 * 檢查字符串是否為有效的電子郵件格式
 * @param email 電子郵件
 * @returns 是否有效
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 檢查密碼強度
 * @param password 密碼
 * @returns 是否足夠強
 */
export function isStrongPassword(password: string): boolean {
  // 至少8個字符，包含字母和數字
  return password.length >= 8 && /\d/.test(password) && /[a-zA-Z]/.test(password);
}

/**
 * 截斷文本
 * @param text 文本
 * @param maxLength 最大長度
 * @returns 截斷後的文本
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * 檢查是否為有效的GeoJSON座標
 * @param coordinates 座標數組
 * @returns 是否有效
 */
export function isValidGeoCoordinates(coordinates: any): boolean {
  return (
    Array.isArray(coordinates) &&
    coordinates.length === 2 &&
    typeof coordinates[0] === 'number' &&
    typeof coordinates[1] === 'number' &&
    coordinates[0] >= -180 &&
    coordinates[0] <= 180 &&
    coordinates[1] >= -90 &&
    coordinates[1] <= 90
  );
}