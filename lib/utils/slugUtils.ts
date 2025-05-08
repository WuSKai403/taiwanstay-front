/**
 * 生成 SEO 友善的 slug
 * @param title 標題
 * @param type 類型
 * @param city 城市
 * @param category 類別 (可選)
 * @returns 生成的 slug
 */
export function generateSlug(
  title: string,
  type?: string,
  city?: string,
  category?: string
): string {
  // 第一步：處理名稱
  const nameBase = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // 移除特殊字符
    .replace(/\s+/g, '-') // 將空格替換為連字符
    .replace(/--+/g, '-') // 替換多個連字符為一個
    .trim(); // 移除首尾空格

  // 第二步：處理中文字符的情況（保留英文和數字，移除純中文或其他非英文字符）
  let slugBase = nameBase;

  // 如果 slug 主要是中文（沒有多少英文字符）
  if (slugBase.length < 2 || slugBase.replace(/[a-z0-9-]/g, '').length > slugBase.length * 0.5) {
    // 使用類別作為前綴，提高 SEO 相關性
    if (type) {
      const typePrefix = type.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
      slugBase = typePrefix + '-' + slugBase;
    }

    if (category) {
      const categoryPart = category.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
      if (categoryPart && categoryPart.length > 0) {
        slugBase = slugBase + '-' + categoryPart;
      }
    }
  }

  // 第三步：添加位置信息以增強 SEO 相關性
  if (city) {
    const cityPart = city
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');

    if (cityPart && cityPart.length > 0 && !slugBase.includes(cityPart)) {
      slugBase = slugBase + '-' + cityPart;
    }
  }

  // 第四步：確保 slug 長度適中（不要太長）
  if (slugBase.length > 50) {
    slugBase = slugBase.substring(0, 50);
    // 確保不會在單詞中間切斷
    if (slugBase.lastIndexOf('-') > 0) {
      slugBase = slugBase.substring(0, slugBase.lastIndexOf('-'));
    }
  }

  // 第五步：添加短隨機字串確保唯一性（使用時間戳的一部分 + 隨機字符）
  const uniqueSuffix = Date.now().toString().slice(-4) +
                       Math.random().toString(36).substring(2, 5);

  // 組合最終的 slug
  const finalSlug = `${slugBase}-${uniqueSuffix}`;

  // 最後確保沒有開頭或結尾的連字符
  return finalSlug.replace(/^-+|-+$/g, '');
}