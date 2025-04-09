import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import PhotoUploadStep from './PhotoUploadStep';
import BasicInfoStep from './BasicInfoStep';
import ContactInfoStep from './ContactInfoStep';
import { hostRegisterSchema, HostRegisterFormData } from '@/lib/schemas/host';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/router';
import { CloudinaryImageResource } from '@/lib/cloudinary/types';

interface PhotoWithCaption extends CloudinaryImageResource {
  caption?: string;
}

const HostRegistrationForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3; // 基本資料、照片上傳、確認資料
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 設置表單
  const methods = useForm<HostRegisterFormData>({
    defaultValues: {
      // 基本資訊
      name: '',
      description: '',
      type: undefined,
      category: '',

      // 位置資訊
      location: {
        address: '',
        city: '',
        district: '',
        zipCode: '',
        country: '台灣',
        coordinates: {
          type: 'Point',
          coordinates: [0, 0]
        },
        showExactLocation: true
      },

      // 聯絡資訊
      email: '',
      mobile: '',
      contactInfo: {
        email: '',
        phone: '',
        mobile: '',
        website: '',
        preferredContactMethod: 'email',
        contactHours: '',
        socialMedia: {
          facebook: '',
          instagram: '',
          line: ''
        }
      },

      // 媒體資訊
      media: {
        gallery: [],
        videos: [],
        additionalMedia: {
          virtualTour: '',
          presentation: undefined
        }
      },

      // 設施與服務
      amenities: {},

      // 特點與描述
      features: {
        features: []
      },

      // 詳細資訊
      details: {
        languages: [],
        rules: [],
        providesAccommodation: true,
        providesMeals: false
      }
    },
    resolver: zodResolver(hostRegisterSchema)
  });

  const { handleSubmit, formState: { errors } } = methods;

  // 處理表單提交
  const onSubmit = async (data: HostRegisterFormData) => {
    try {
      setIsSubmitting(true);

      // 準備提交數據
      const formData = {
        ...data,
        // 確保媒體資訊正確格式化
        media: {
          ...data.media,
          gallery: (data.media.gallery as PhotoWithCaption[]).map(img => ({
            publicId: img.public_id,
            secureUrl: img.secure_url,
            thumbnailUrl: img.thumbnailUrl,
            previewUrl: img.previewUrl,
            originalUrl: img.originalUrl || img.secure_url,
            description: img.caption || ''
          }))
        }
      };

      // 發送API請求
      const response = await apiClient.post('/api/hosts', formData);

      if (response.data.success) {
        toast.success('主人註冊申請提交成功！');
        // 導向到成功頁面
        router.push('/hosts/register-success');
      } else {
        toast.error(response.data.message || '提交失敗，請稍後再試');
      }
    } catch (error: any) {
      console.error('提交主人註冊失敗:', error);
      toast.error(error.response?.data?.message || '提交失敗，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 前往下一步
  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  // 返回上一步
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // 安全的 getValues 函數，支援嵌套路徑
  const safeGetValue = (path: string) => {
    const parts = path.split('.');
    let value: any = methods.getValues();

    for (const part of parts) {
      if (value === undefined || value === null) return '';
      value = value[part];
    }

    return value === undefined || value === null ? '' : value;
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">主機註冊</h2>

          {/* 步驟指示器 */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <React.Fragment key={index}>
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      index + 1 === currentStep
                        ? 'bg-primary-600 text-white'
                        : index + 1 < currentStep
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                    }`}>
                      {index + 1 < currentStep ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span className="text-xs mt-1">
                      {index + 1 === 1 && '基本資料'}
                      {index + 1 === 2 && '房源照片'}
                      {index + 1 === 3 && '確認送出'}
                    </span>
                  </div>

                  {index < totalSteps - 1 && (
                    <div className={`flex-1 h-1 mx-2 ${
                      index + 1 < currentStep ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* 表單步驟內容 */}
          <div className="mt-8">
            {currentStep === 1 && (
              <div>
                <h3 className="text-xl font-medium mb-4">基本資料</h3>
                <BasicInfoStep />
                <ContactInfoStep />
              </div>
            )}

            {currentStep === 2 && (
              <div>
                <h3 className="text-xl font-medium mb-4">房源照片</h3>
                <PhotoUploadStep />
              </div>
            )}

            {currentStep === 3 && (
              <div>
                <h3 className="text-xl font-medium mb-4">確認資料</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-700">基本資料</h4>
                    <p><span className="font-medium">名稱:</span> {safeGetValue('name')}</p>
                    <p><span className="font-medium">類型:</span> {safeGetValue('type')}</p>
                    <p><span className="font-medium">類別:</span> {safeGetValue('category')}</p>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-medium text-gray-700">聯絡方式</h4>
                    <p><span className="font-medium">Email:</span> {safeGetValue('email')}</p>
                    <p><span className="font-medium">手機:</span> {safeGetValue('mobile')}</p>
                    <p><span className="font-medium">地址:</span> {safeGetValue('location.address')}, {safeGetValue('location.district')}, {safeGetValue('location.city')}</p>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-medium text-gray-700">房源照片</h4>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {(safeGetValue('media.gallery') as PhotoWithCaption[]).map((photo, index) => (
                        <div key={index} className="relative h-24">
                          <img
                            src={photo.previewUrl || photo.secure_url}
                            alt={`房源照片 ${index + 1}`}
                            className="h-full w-full object-cover rounded"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {safeGetValue('media.videos')?.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-700">視頻連結</h4>
                      {safeGetValue('media.videos').map((video: {url: string}, index: number) => (
                        <p key={index} className="text-blue-600">{video.url}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 步驟控制按鈕 */}
          <div className="flex justify-between mt-8">
            <button
              type="button"
              onClick={prevStep}
              className={`px-4 py-2 border border-gray-300 rounded-md text-gray-700 ${
                currentStep === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
              }`}
              disabled={currentStep === 1}
            >
              上一步
            </button>

            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                下一步
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {isSubmitting ? '提交中...' : '提交註冊'}
              </button>
            )}
          </div>
        </div>
      </form>
    </FormProvider>
  );
};

export default HostRegistrationForm;