import React from 'react';
import { useFormContext } from 'react-hook-form';
import { useHostRegister } from '../context/HostRegisterContext';

const ContactInfoStep: React.FC = () => {
  const {
    register,
    setValue,
    getValues,
    formState: { errors }
  } = useFormContext();

  // 讀取現有的值，將 contact.* 的值自動映射到頂層的 email 和 mobile
  React.useEffect(() => {
    const contactEmail = getValues('contact.email');
    const contactPhone = getValues('contact.phone');

    if (contactEmail) {
      setValue('email', contactEmail);
    }

    if (contactPhone) {
      setValue('mobile', contactPhone);
    }
  }, [getValues, setValue]);

  // 同步欄位變更
  const syncEmailValue = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue('email', e.target.value);
  };

  const syncMobileValue = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue('mobile', e.target.value);
  };

  return (
    <div className="space-y-8">
      {/* 必填欄位說明 */}
      <div className="pb-2 border-b border-gray-200">
        <p className="text-sm text-gray-500">
          <span className="text-red-500">*</span> 表示必填欄位
        </p>
      </div>

      {/* 主要聯絡人資訊 */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">主要聯絡人</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700 mb-1">
              聯絡人姓名 <span className="text-red-500">*</span>
            </label>
            <input
              id="contactPerson"
              type="text"
              {...register('contact.person')}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              placeholder="請輸入聯絡人全名"
            />
            {errors.contact && (errors.contact as any)?.person?.message && (
              <p className="mt-1 text-sm text-red-600">{(errors.contact as any)?.person?.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="contactTitle" className="block text-sm font-medium text-gray-700 mb-1">
              職稱 <span className="text-red-500">*</span>
            </label>
            <input
              id="contactTitle"
              type="text"
              {...register('contact.title')}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              placeholder="例如：創辦人、營運總監"
            />
            {errors.contact && (errors.contact as any)?.title?.message && (
              <p className="mt-1 text-sm text-red-600">{(errors.contact as any)?.title?.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* 聯絡方式 */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">聯絡方式</h3>
        <div className="space-y-6">
          {/* 電話 */}
          <div>
            <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-1">
              聯絡電話 <span className="text-red-500">*</span>
            </label>
            <input
              id="contactPhone"
              type="tel"
              {...register('contact.phone')}
              onChange={(e) => {
                register('contact.phone').onChange(e);
                syncMobileValue(e);
              }}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              placeholder="+886 2 1234 5678"
            />
            {/* 隱藏欄位用於與後端映射 */}
            <input type="hidden" {...register('mobile')} />
            {errors.contact && (errors.contact as any)?.phone && (
              <p className="mt-1 text-sm text-red-600">{(errors.contact as any).phone.message}</p>
            )}
            {errors.mobile && (
              <p className="mt-1 text-sm text-red-600">{(errors.mobile as any).message}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              請提供可直接聯繫的電話號碼，包含國碼與區碼
            </p>
          </div>

          {/* 電子郵件 */}
          <div>
            <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-1">
              電子郵件 <span className="text-red-500">*</span>
            </label>
            <input
              id="contactEmail"
              type="email"
              {...register('contact.email')}
              onChange={(e) => {
                register('contact.email').onChange(e);
                syncEmailValue(e);
              }}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              placeholder="contact@example.com"
            />
            {/* 隱藏欄位用於與後端映射 */}
            <input type="hidden" {...register('email')} />
            {errors.contact && (errors.contact as any)?.email && (
              <p className="mt-1 text-sm text-red-600">{(errors.contact as any).email.message}</p>
            )}
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{(errors.email as any).message}</p>
            )}
          </div>
        </div>
      </div>

      {/* 網站與社群連結 */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">網站與社群連結</h3>
        <div className="space-y-6">
          {/* 官方網站 */}
          <div>
            <label htmlFor="websiteUrl" className="block text-sm font-medium text-gray-700 mb-1">
              官方網站 (選填)
            </label>
            <div className="flex rounded-md shadow-sm">
              <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500 sm:text-sm">
                https://
              </span>
              <input
                id="websiteUrl"
                type="text"
                {...register('contact.website')}
                className="block w-full flex-1 rounded-none rounded-r-md border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                placeholder="www.example.com"
              />
            </div>
            {errors.contact && (errors.contact as any)?.website && (
              <p className="mt-1 text-sm text-red-600">{(errors.contact as any).website.message}</p>
            )}
          </div>

          {/* 社群媒體連結 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="facebookUrl" className="block text-sm font-medium text-gray-700 mb-1">
                Facebook (選填)
              </label>
              <div className="flex rounded-md shadow-sm">
                <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500 sm:text-sm">
                  facebook.com/
                </span>
                <input
                  id="facebookUrl"
                  type="text"
                  {...register('contact.social.facebook')}
                  className="block w-full flex-1 rounded-none rounded-r-md border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                  placeholder="yourpage"
                />
              </div>
              {errors.contact && (errors.contact as any)?.social?.facebook && (
                <p className="mt-1 text-sm text-red-600">{(errors.contact as any)?.social?.facebook?.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="instagramUrl" className="block text-sm font-medium text-gray-700 mb-1">
                Instagram (選填)
              </label>
              <div className="flex rounded-md shadow-sm">
                <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500 sm:text-sm">
                  instagram.com/
                </span>
                <input
                  id="instagramUrl"
                  type="text"
                  {...register('contact.social.instagram')}
                  className="block w-full flex-1 rounded-none rounded-r-md border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                  placeholder="youraccount"
                />
              </div>
              {errors.contact && (errors.contact as any)?.social?.instagram && (
                <p className="mt-1 text-sm text-red-600">{(errors.contact as any)?.social?.instagram?.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="lineUrl" className="block text-sm font-medium text-gray-700 mb-1">
                LINE 官方帳號 (選填)
              </label>
              <input
                id="lineUrl"
                type="text"
                {...register('contact.social.line')}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="LINE官方帳號連結或ID"
              />
              {errors.contact && (errors.contact as any)?.social?.line && (
                <p className="mt-1 text-sm text-red-600">{(errors.contact as any)?.social?.line?.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="otherSocial" className="block text-sm font-medium text-gray-700 mb-1">
                其他社群連結 (選填)
              </label>
              <input
                id="otherSocial"
                type="text"
                {...register('contact.social.other')}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="其他社群媒體連結"
              />
              {errors.contact && (errors.contact as any)?.social?.other && (
                <p className="mt-1 text-sm text-red-600">{(errors.contact as any)?.social?.other?.message}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 聯絡備註 */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">其他聯絡資訊</h3>
        <div className="space-y-6">
          <div>
            <label htmlFor="contactNotes" className="block text-sm font-medium text-gray-700 mb-1">
              聯絡注意事項 (選填)
            </label>
            <textarea
              id="contactNotes"
              {...register('contact.notes')}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              rows={3}
              placeholder="其他希望申請人了解的聯絡相關注意事項"
            />
            {errors.contact && (errors.contact as any)?.notes && (
              <p className="mt-1 text-sm text-red-600">{(errors.contact as any).notes.message}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactInfoStep;