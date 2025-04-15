import React, { useEffect } from 'react';
import { useFormContext, FieldError } from 'react-hook-form';
import { useHostRegister } from '../context/HostRegisterContext';
import { HostRegisterFormData } from '@/lib/schemas/host';

// 添加URL解析函數
const extractSocialMediaUsername = (url: string, platform: 'facebook' | 'instagram' | 'line'): string => {
  if (!url) return '';

  try {
    // 檢查是否是完整URL
    if (url.includes('http://') || url.includes('https://') ||
        url.includes('facebook.com/') || url.includes('fb.com/') ||
        url.includes('instagram.com/') || url.includes('line.me/')) {

      // 處理URL格式
      let cleanUrl = url.trim();
      const urlObj = new URL(cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`);

      // 根據不同平台提取用戶名/ID
      switch (platform) {
        case 'facebook':
          // 從 facebook.com/username 或 facebook.com/pages/username 提取username
          const fbPath = urlObj.pathname.split('/').filter(Boolean);
          // 如果路徑包含 'pages'，取下一個部分
          if (fbPath.includes('pages') && fbPath.length > fbPath.indexOf('pages') + 1) {
            return fbPath[fbPath.indexOf('pages') + 1];
          }
          // 否則取第一個部分
          return fbPath[0] || '';

        case 'instagram':
          // 從 instagram.com/username 提取username
          const igPath = urlObj.pathname.split('/').filter(Boolean);
          return igPath[0] || '';

        case 'line':
          // 從line連結中提取ID
          return urlObj.pathname.replace(/^\//, '') || '';

        default:
          return '';
      }
    } else {
      // 如果不是完整URL，假設用戶直接輸入ID/用戶名
      return url;
    }
  } catch (error) {
    console.error('解析社群媒體連結錯誤:', error);
    // 如果解析失敗，返回原始輸入值，讓用戶自行修改
    return url;
  }
};

const ContactInfoStep: React.FC = () => {
  const {
    register,
    setValue,
    formState: { errors },
    watch,
    trigger
  } = useFormContext<HostRegisterFormData>();

  // 監視聯絡資訊欄位
  const contactEmail = watch('contactInfo.contactEmail');
  const contactMobile = watch('contactInfo.contactMobile');

  // 監視社群媒體欄位
  const fbUrl = watch('contactInfo.socialMedia.facebook');
  const igUrl = watch('contactInfo.socialMedia.instagram');
  const lineId = watch('contactInfo.socialMedia.line');

  // 處理Facebook URL變更
  const handleFacebookChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 嘗試提取用戶名，無論是完整URL還是純ID
    const username = extractSocialMediaUsername(value, 'facebook');
    setValue('contactInfo.socialMedia.facebook', username);

    // 記錄處理過程
    if (value !== username) {
      console.log('%c[URL處理] - 處理Facebook URL', 'background:#4267B2;color:white;padding:3px 6px;border-radius:3px;', {
        原始URL: value,
        處理後: username,
        時間: new Date().toLocaleString()
      });
    }
  };

  // 處理Instagram URL變更
  const handleInstagramChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 嘗試提取用戶名，無論是完整URL還是純ID
    const username = extractSocialMediaUsername(value, 'instagram');
    setValue('contactInfo.socialMedia.instagram', username);

    // 記錄處理過程
    if (value !== username) {
      console.log('%c[URL處理] - 處理Instagram URL', 'background:#C13584;color:white;padding:3px 6px;border-radius:3px;', {
        原始URL: value,
        處理後: username,
        時間: new Date().toLocaleString()
      });
    }
  };

  // 處理LINE URL/ID變更
  const handleLineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 嘗試提取ID，無論是完整URL還是純ID
    const lineId = extractSocialMediaUsername(value, 'line');
    setValue('contactInfo.socialMedia.line', lineId);

    // 記錄處理過程
    if (value !== lineId) {
      console.log('%c[URL處理] - 處理LINE URL', 'background:#00B900;color:white;padding:3px 6px;border-radius:3px;', {
        原始URL: value,
        處理後: lineId,
        時間: new Date().toLocaleString()
      });
    }
  };

  // 安全獲取錯誤訊息
  const getErrorMessage = (path: string): string | undefined => {
    try {
      const keys = path.split('.');
      let current: any = errors;

      for (const key of keys) {
        if (current && current[key]) {
          current = current[key];
        } else {
          return undefined;
        }
      }

      return current.message as string | undefined;
    } catch (e) {
      return undefined;
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">聯絡方式</h3>

      {/* 聯絡電話 */}
      <div>
        <label htmlFor="contactMobile" className="block text-sm font-medium text-gray-700">
          聯絡電話 <span className="text-red-500">*</span>
        </label>
        <input
          id="contactMobile"
          type="tel"
          {...register('contactInfo.contactMobile', { required: "聯絡電話為必填項目" })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          placeholder="+886921123456"
        />
        {getErrorMessage('contactInfo.contactMobile') && (
          <p className="mt-1 text-sm text-red-600">{getErrorMessage('contactInfo.contactMobile')}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          請提供可直接聯繫的電話號碼，包含國碼與區碼
        </p>
      </div>

      {/* 電子郵件 */}
      <div>
        <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700">
          電子郵件 <span className="text-red-500">*</span>
        </label>
        <input
          id="contactEmail"
          type="email"
          {...register('contactInfo.contactEmail', {
            required: "電子郵件為必填項目",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "請輸入有效的電子郵件地址"
            }
          })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
        />
        {getErrorMessage('contactInfo.contactEmail') && (
          <p className="mt-1 text-sm text-red-600">{getErrorMessage('contactInfo.contactEmail')}</p>
        )}
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">網站與社群連結</h3>

        {/* 官方網站 */}
        <div className="mb-4">
          <label htmlFor="website" className="block text-sm font-medium text-gray-700">
            官方網站 (選填)
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
              https://
            </span>
            <input
              type="text"
              id="website"
              {...register('contactInfo.website')}
              className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border-gray-300 focus:border-primary-500 focus:ring-primary-500"
              placeholder="www.example.com"
            />
          </div>
          {getErrorMessage('contactInfo.website') && (
            <p className="mt-1 text-sm text-red-600">{getErrorMessage('contactInfo.website')}</p>
          )}
        </div>

        {/* Facebook */}
        <div className="mb-4">
          <label htmlFor="facebook" className="block text-sm font-medium text-gray-700">
            Facebook (選填)
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
              facebook.com/
            </span>
            <input
              type="text"
              id="facebook"
              value={fbUrl || ''}
              onChange={handleFacebookChange}
              className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border-gray-300 focus:border-primary-500 focus:ring-primary-500"
              placeholder="你的Facebook頁面名稱"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            您可以輸入完整連結或直接輸入用戶名，系統會自動提取
          </p>
        </div>

        {/* Instagram */}
        <div className="mb-4">
          <label htmlFor="instagram" className="block text-sm font-medium text-gray-700">
            Instagram (選填)
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
              instagram.com/
            </span>
            <input
              type="text"
              id="instagram"
              value={igUrl || ''}
              onChange={handleInstagramChange}
              className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border-gray-300 focus:border-primary-500 focus:ring-primary-500"
              placeholder="你的Instagram用戶名"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            您可以輸入完整連結或直接輸入用戶名，系統會自動提取
          </p>
        </div>

        {/* LINE */}
        <div>
          <label htmlFor="line" className="block text-sm font-medium text-gray-700">
            LINE ID (選填)
          </label>
          <input
            type="text"
            id="line"
            value={lineId || ''}
            onChange={handleLineChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            placeholder="您的LINE ID"
          />
          <p className="mt-1 text-xs text-gray-500">
            您可以輸入LINE ID或完整連結
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContactInfoStep;