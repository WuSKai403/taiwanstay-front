import slugify from 'slugify';

/**
 * 根據名稱生成slug
 * @param name 原始名稱
 * @returns 生成的slug
 */
export async function generateSlug(name: string): Promise<string> {
  // 基本slug處理
  const baseSlug = slugify(name, {
    lower: true,       // 轉換為小寫
    strict: true,      // 嚴格模式，移除所有特殊字符
    locale: 'zh-TW'    // 使用中文台灣語言環境
  });

  // 在實際應用中，這裡應該檢查slug是否已存在
  // 目前，我們簡單地加上時間戳保證唯一性
  const timestamp = new Date().getTime().toString().slice(-4);
  return `${baseSlug}-${timestamp}`;
}

/**
 * 將任意字串轉換為URL友好的格式
 * @param text 要轉換的字串
 * @returns 處理後的URL友好字串
 */
export function toUrlFriendly(text: string): string {
  return slugify(text, {
    lower: true,
    strict: true,
    locale: 'zh-TW'
  });
}