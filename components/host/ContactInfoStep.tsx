import React from 'react';
import { useFormContext } from 'react-hook-form';
import { HostRegisterFormData } from '@/lib/schemas/host';

const ContactInfoStep: React.FC = () => {
  const { register, formState: { errors } } = useFormContext<HostRegisterFormData>();

  return (
    <div className="space-y-6">
      <h4 className="text-lg font-medium">聯絡資訊</h4>

      {/* 電子郵件 */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          電子郵件 <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          id="email"
          {...register('email')}
          placeholder="請輸入電子郵件"
          className="w-full p-2 border rounded focus:ring-primary-500 focus:border-primary-500"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      {/* 手機號碼 */}
      <div>
        <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-1">
          手機號碼 <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          id="mobile"
          {...register('mobile')}
          placeholder="請輸入手機號碼"
          className="w-full p-2 border rounded focus:ring-primary-500 focus:border-primary-500"
        />
        {errors.mobile && (
          <p className="mt-1 text-sm text-red-600">{errors.mobile.message}</p>
        )}
      </div>

      {/* 電話號碼（選填） */}
      <div>
        <label htmlFor="contactInfo.phone" className="block text-sm font-medium text-gray-700 mb-1">
          電話號碼（選填）
        </label>
        <input
          type="tel"
          id="contactInfo.phone"
          {...register('contactInfo.phone')}
          placeholder="請輸入市話"
          className="w-full p-2 border rounded focus:ring-primary-500 focus:border-primary-500"
        />
        {errors.contactInfo?.phone && (
          <p className="mt-1 text-sm text-red-600">{errors.contactInfo.phone.message}</p>
        )}
      </div>

      {/* 網站（選填） */}
      <div>
        <label htmlFor="contactInfo.website" className="block text-sm font-medium text-gray-700 mb-1">
          網站（選填）
        </label>
        <input
          type="url"
          id="contactInfo.website"
          {...register('contactInfo.website')}
          placeholder="請輸入網站連結"
          className="w-full p-2 border rounded focus:ring-primary-500 focus:border-primary-500"
        />
        {errors.contactInfo?.website && (
          <p className="mt-1 text-sm text-red-600">{errors.contactInfo.website.message}</p>
        )}
      </div>

      {/* 偏好聯絡方式 */}
      <div>
        <label htmlFor="contactInfo.preferredContactMethod" className="block text-sm font-medium text-gray-700 mb-1">
          偏好聯絡方式
        </label>
        <select
          id="contactInfo.preferredContactMethod"
          {...register('contactInfo.preferredContactMethod')}
          className="w-full p-2 border rounded focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="email">電子郵件</option>
          <option value="phone">電話</option>
          <option value="mobile">手機</option>
          <option value="line">Line</option>
        </select>
        {errors.contactInfo?.preferredContactMethod && (
          <p className="mt-1 text-sm text-red-600">{errors.contactInfo.preferredContactMethod.message}</p>
        )}
      </div>

      {/* 社交媒體 - Facebook */}
      <div>
        <label htmlFor="contactInfo.socialMedia.facebook" className="block text-sm font-medium text-gray-700 mb-1">
          Facebook（選填）
        </label>
        <input
          type="url"
          id="contactInfo.socialMedia.facebook"
          {...register('contactInfo.socialMedia.facebook')}
          placeholder="請輸入Facebook連結"
          className="w-full p-2 border rounded focus:ring-primary-500 focus:border-primary-500"
        />
        {errors.contactInfo?.socialMedia?.facebook && (
          <p className="mt-1 text-sm text-red-600">{errors.contactInfo.socialMedia.facebook.message}</p>
        )}
      </div>

      {/* 社交媒體 - Instagram */}
      <div>
        <label htmlFor="contactInfo.socialMedia.instagram" className="block text-sm font-medium text-gray-700 mb-1">
          Instagram（選填）
        </label>
        <input
          type="url"
          id="contactInfo.socialMedia.instagram"
          {...register('contactInfo.socialMedia.instagram')}
          placeholder="請輸入Instagram連結"
          className="w-full p-2 border rounded focus:ring-primary-500 focus:border-primary-500"
        />
        {errors.contactInfo?.socialMedia?.instagram && (
          <p className="mt-1 text-sm text-red-600">{errors.contactInfo.socialMedia.instagram.message}</p>
        )}
      </div>

      {/* 社交媒體 - Line */}
      <div>
        <label htmlFor="contactInfo.socialMedia.line" className="block text-sm font-medium text-gray-700 mb-1">
          Line ID（選填）
        </label>
        <input
          type="text"
          id="contactInfo.socialMedia.line"
          {...register('contactInfo.socialMedia.line')}
          placeholder="請輸入Line ID"
          className="w-full p-2 border rounded focus:ring-primary-500 focus:border-primary-500"
        />
        {errors.contactInfo?.socialMedia?.line && (
          <p className="mt-1 text-sm text-red-600">{errors.contactInfo.socialMedia.line.message}</p>
        )}
      </div>
    </div>
  );
};

export default ContactInfoStep;