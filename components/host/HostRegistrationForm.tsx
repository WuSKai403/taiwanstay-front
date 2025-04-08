import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import PhotoUploadStep from './PhotoUploadStep';
import { hostPhotoSchema, HostPhotoData } from '@/lib/schemas/host';

// 完整註冊表單包括照片及其他資料
interface HostRegistrationFormData extends HostPhotoData {
  // 其他主機註冊表單資料可以在這裡添加
}

const HostRegistrationForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3; // 假設有三個步驟

  // 設置表單
  const methods = useForm<HostRegistrationFormData>({
    defaultValues: {
      photos: [],
      photoDescriptions: [],
      videoIntroduction: '',
      additionalNotes: '',
    },
    resolver: zodResolver(hostPhotoSchema) // 使用 Zod 驗證器
  });

  const {
    handleSubmit,
    register,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = methods;

  // 處理表單提交
  const onSubmit = async (data: HostRegistrationFormData) => {
    console.log('提交的數據:', data);
    // 這裡處理提交邏輯
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
                {/* 這裡是基本資料表單欄位 */}
                <p className="text-gray-600 italic">
                  (基本資料表單欄位在此實現)
                </p>
              </div>
            )}

            {currentStep === 2 && (
              <div>
                <h3 className="text-xl font-medium mb-4">房源照片</h3>
                <PhotoUploadStep
                  register={register}
                  control={control}
                  watch={watch}
                  setValue={setValue}
                  errors={errors}
                />
              </div>
            )}

            {currentStep === 3 && (
              <div>
                <h3 className="text-xl font-medium mb-4">確認資料</h3>
                {/* 這裡是資料預覽和確認頁面 */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium">房源照片：</p>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {watch('photos').map((photo, index) => (
                      <div key={index} className="relative h-24">
                        <img
                          src={photo.previewUrl}
                          alt={`房源照片 ${index + 1}`}
                          className="h-full w-full object-cover rounded"
                        />
                      </div>
                    ))}
                  </div>

                  {watch('videoIntroduction') && (
                    <div className="mt-4">
                      <p className="font-medium">視頻連結：</p>
                      <p className="text-blue-600">{watch('videoIntroduction')}</p>
                    </div>
                  )}

                  {watch('additionalNotes') && (
                    <div className="mt-4">
                      <p className="font-medium">附加備註：</p>
                      <p className="text-gray-700">{watch('additionalNotes')}</p>
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