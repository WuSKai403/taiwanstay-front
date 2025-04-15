/**
 * 圖片緩存服務 - 使用 IndexedDB 緩存圖片數據
 *
 * 主要功能:
 * 1. 將圖片數據以二進制形式存儲在 IndexedDB 中
 * 2. 獲取緩存的圖片數據，減少重複下載
 * 3. 自動清理過期的緩存項目
 */

interface ImageCacheEntry {
  id?: number;
  public_id: string;
  url: string;
  blob_data?: Blob;
  type: 'thumbnail' | 'preview' | 'original';
  timestamp: number;
  expires: number;
}

interface ImageCacheConfig {
  dbName: string;
  version: number;
  storeName: string;
  // 不同類型圖片的過期時間（毫秒）
  expiryTime: {
    thumbnail: number;
    preview: number;
    original: number;
  };
}

// 緩存配置
const CONFIG: ImageCacheConfig = {
  dbName: 'taiwanstay_image_cache',
  version: 1,
  storeName: 'images',
  expiryTime: {
    thumbnail: 24 * 60 * 60 * 1000, // 24小時
    preview: 3 * 24 * 60 * 60 * 1000, // 3天
    original: 7 * 24 * 60 * 60 * 1000, // 7天
  }
};

// 單例模式確保只打開一個數據庫連接
let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * 初始化數據庫
 */
const initDB = (): Promise<IDBDatabase> => {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      // 檢查瀏覽器支持
      if (!window.indexedDB) {
        console.warn('您的瀏覽器不支持 IndexedDB，圖片緩存將不可用');
        reject(new Error('IndexedDB not supported'));
        return;
      }

      const request = indexedDB.open(CONFIG.dbName, CONFIG.version);

      request.onerror = (event) => {
        console.error('無法打開 IndexedDB:', (event.target as IDBOpenDBRequest).error);
        reject((event.target as IDBOpenDBRequest).error);
      };

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        console.log('%c[IndexedDB] - 成功連接到圖片緩存數據庫', 'background:#4CAF50;color:white;padding:3px 6px;border-radius:3px;');

        // 數據庫關閉時清除緩存
        db.onclose = () => {
          dbPromise = null;
        };

        resolve(db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 創建對象存儲
        if (!db.objectStoreNames.contains(CONFIG.storeName)) {
          const objectStore = db.createObjectStore(CONFIG.storeName, {
            keyPath: 'id',
            autoIncrement: true
          });

          // 創建索引
          objectStore.createIndex('public_id_type', ['public_id', 'type'], { unique: true });
          objectStore.createIndex('expires', 'expires', { unique: false });

          console.log('%c[IndexedDB] - 已創建圖片緩存表', 'background:#2196F3;color:white;padding:3px 6px;border-radius:3px;');
        }
      };
    });
  }

  return dbPromise;
};

/**
 * 生成緩存鍵
 */
const generateCacheKey = (public_id: string, type: 'thumbnail' | 'preview' | 'original'): string => {
  return `${public_id}_${type}`;
};

/**
 * 將圖片緩存到 IndexedDB
 * @param public_id 圖片的public_id
 * @param url 圖片的URL
 * @param type 圖片類型 (縮略圖/預覽圖/原圖)
 * @returns Promise<boolean> 緩存是否成功
 */
export const cacheImage = async (
  public_id: string,
  url: string,
  type: 'thumbnail' | 'preview' | 'original' = 'preview'
): Promise<boolean> => {
  if (!public_id || !url) {
    console.error('缺少 public_id 或 URL，無法緩存圖片');
    return false;
  }

  // 避免重複緩存檢查
  const existingImage = await getCachedImage(public_id, type);
  if (existingImage) {
    // 已存在緩存，不重複獲取
    return true;
  }

  try {
    // 獲取圖片數據
    const response = await fetch(url, { cache: 'force-cache' });
    if (!response.ok) {
      throw new Error(`獲取圖片失敗: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    const timestamp = Date.now();
    const expires = timestamp + CONFIG.expiryTime[type];

    const cacheEntry: ImageCacheEntry = {
      public_id,
      url,
      blob_data: blob,
      type,
      timestamp,
      expires
    };

    // 保存到 IndexedDB
    const db = await initDB();
    const transaction = db.transaction([CONFIG.storeName], 'readwrite');
    const store = transaction.objectStore(CONFIG.storeName);

    // 檢查是否已存在相同 public_id 和 type 的記錄
    const index = store.index('public_id_type');
    const existingRequest = index.get([public_id, type]);

    return new Promise((resolve, reject) => {
      existingRequest.onsuccess = () => {
        const existingEntry = existingRequest.result;

        if (existingEntry) {
          // 更新現有記錄
          existingEntry.blob_data = blob;
          existingEntry.url = url;
          existingEntry.timestamp = timestamp;
          existingEntry.expires = expires;

          const updateRequest = store.put(existingEntry);

          updateRequest.onsuccess = () => {
            console.log('%c[IndexedDB] - 已更新圖片緩存', 'background:#9C27B0;color:white;padding:3px 6px;border-radius:3px;', {
              public_id,
              type,
              大小: `${(blob.size / 1024).toFixed(2)} KB`,
              過期時間: new Date(expires).toLocaleString()
            });
            resolve(true);
          };

          updateRequest.onerror = (event) => {
            console.error('更新圖片緩存失敗:', (event.target as IDBRequest).error);
            reject((event.target as IDBRequest).error);
          };
        } else {
          // 添加新記錄
          const addRequest = store.add(cacheEntry);

          addRequest.onsuccess = () => {
            console.log('%c[IndexedDB] - 已添加圖片緩存', 'background:#3F51B5;color:white;padding:3px 6px;border-radius:3px;', {
              public_id,
              type,
              大小: `${(blob.size / 1024).toFixed(2)} KB`,
              過期時間: new Date(expires).toLocaleString()
            });
            resolve(true);
          };

          addRequest.onerror = (event) => {
            console.error('添加圖片緩存失敗:', (event.target as IDBRequest).error);
            reject((event.target as IDBRequest).error);
          };
        }
      };

      existingRequest.onerror = (event) => {
        console.error('查詢現有緩存失敗:', (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error);
      };

      transaction.onerror = (event) => {
        console.error('緩存圖片事務失敗:', (event.target as IDBTransaction).error);
        reject((event.target as IDBTransaction).error);
      };
    });
  } catch (error) {
    console.error('緩存圖片失敗:', error);
    return false;
  }
};

/**
 * 從 IndexedDB 獲取緩存的圖片
 * @param public_id 圖片的public_id
 * @param type 圖片類型 (縮略圖/預覽圖/原圖)
 * @returns Promise<string | null> 返回 blob URL 或 null
 */
export const getCachedImage = async (
  public_id: string,
  type: 'thumbnail' | 'preview' | 'original' = 'preview'
): Promise<string | null> => {
  if (!public_id) return null;

  try {
    const db = await initDB();
    const transaction = db.transaction([CONFIG.storeName], 'readonly');
    const store = transaction.objectStore(CONFIG.storeName);
    const index = store.index('public_id_type');

    return new Promise((resolve, reject) => {
      const request = index.get([public_id, type]);

      request.onsuccess = () => {
        const cacheEntry = request.result as ImageCacheEntry | undefined;

        if (!cacheEntry) {
          // 緩存未命中
          resolve(null);
          return;
        }

        // 檢查是否過期
        if (cacheEntry.expires < Date.now()) {
          console.log('%c[IndexedDB] - 緩存已過期', 'background:#FF9800;color:white;padding:3px 6px;border-radius:3px;', {
            public_id,
            type,
            過期時間: new Date(cacheEntry.expires).toLocaleString()
          });

          // 過期圖片將在清理過程中移除，當前返回 null
          resolve(null);
          return;
        }

        // 從 Blob 創建 URL
        if (cacheEntry.blob_data) {
          const objectURL = URL.createObjectURL(cacheEntry.blob_data);

          console.log('%c[IndexedDB] - 緩存命中!', 'background:#4CAF50;color:white;padding:3px 6px;border-radius:3px;', {
            public_id,
            type,
            大小: `${(cacheEntry.blob_data.size / 1024).toFixed(2)} KB`,
            建立時間: new Date(cacheEntry.timestamp).toLocaleString(),
            過期時間: new Date(cacheEntry.expires).toLocaleString()
          });

          resolve(objectURL);
        } else {
          console.warn('緩存項不含 Blob 數據:', public_id, type);
          resolve(null);
        }
      };

      request.onerror = (event) => {
        console.error('獲取緩存圖片失敗:', (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error);
      };
    });
  } catch (error) {
    console.error('獲取緩存圖片時出錯:', error);
    return null;
  }
};

/**
 * 清理過期的緩存項目
 */
export const cleanExpiredCache = async (): Promise<void> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([CONFIG.storeName], 'readwrite');
    const store = transaction.objectStore(CONFIG.storeName);
    const index = store.index('expires');
    const now = Date.now();

    const range = IDBKeyRange.upperBound(now);
    const cursorRequest = index.openCursor(range);

    let deletedCount = 0;

    cursorRequest.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result as IDBCursorWithValue | null;

      if (cursor) {
        // 刪除過期項
        const deleteRequest = cursor.delete();
        deleteRequest.onsuccess = () => {
          deletedCount++;
        };
        cursor.continue();
      } else if (deletedCount > 0) {
        console.log('%c[IndexedDB] - 已清理過期緩存', 'background:#607D8B;color:white;padding:3px 6px;border-radius:3px;', {
          刪除數量: deletedCount,
          時間: new Date().toLocaleString()
        });
      }
    };

    cursorRequest.onerror = (event) => {
      console.error('清理過期緩存失敗:', (event.target as IDBRequest).error);
    };
  } catch (error) {
    console.error('清理過期緩存時出錯:', error);
  }
};

// 在頁面加載時初始化數據庫並清理過期緩存
if (typeof window !== 'undefined') {
  // 確保在瀏覽器環境
  window.addEventListener('load', () => {
    cleanExpiredCache().catch(console.error);

    // 設置定時清理 (每小時)
    setInterval(() => {
      cleanExpiredCache().catch(console.error);
    }, 60 * 60 * 1000);
  });
}

// 導出接口以供使用
const ImageCache = {
  cacheImage,
  getCachedImage,
  cleanExpiredCache
};

export default ImageCache;
