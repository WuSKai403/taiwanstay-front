import React from 'react';
import { useRouter } from 'next/router';
import {
  useHostRegister,
  HOST_REGISTER_STEPS,
  STEP_CONFIG
} from './context/HostRegisterContext';
import { toast } from 'react-hot-toast';

// 步驟組件導入
import BasicInfoStep from './steps/BasicInfoStep';
import LocationStep from './steps/LocationStep';
import MediaUploadStep from './steps/MediaUploadStep';
import ContactInfoStep from './steps/ContactInfoStep';
import FeaturesStep from './steps/FeaturesStep';
import AmenitiesStep from './steps/AmenitiesStep';
import PreviewStep from './steps/PreviewStep';

const HostRegisterWizard: React.FC = () => {
  const router = useRouter();
  const {
    currentStep,
    isFirstStep,
    isLastStep,
    isSubmitting,
    submitError,
    nextStep,
    prevStep,
    goToStep,
    submitForm,
    stepProgress
  } = useHostRegister();

  // 處理下一步按鈕點擊
  const handleNextClick = async () => {
    const success = await nextStep();
    if (success && isLastStep) {
      // 如果是最後一步且驗證通過，自動滾動到頁面頂部
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // 處理提交按鈕點擊
  const handleSubmitClick = async () => {
    const success = await submitForm();
    // 提交成功後跳轉到主人中心
    if (success) {
      // 顯示成功訊息
      toast.success('主人申請已提交成功，等待審核！');

      // 獲取用戶資料
      try {
        const response = await fetch(`/api/user/profile`);
        if (response.ok) {
          const data = await response.json();
          if (data.profile?.hostId) {
            // 導向至主人中心儀表板
            router.push(`/hosts/${data.profile.hostId}/dashboard`);
            return;
          }
        }
      } catch (error) {
        console.error('獲取用戶資料失敗:', error);
      }

      // 如果獲取主人ID失敗，則導向至個人資料頁面
      router.push('/profile');
    }
  };

  // 取消註冊返回上一頁
  const handleCancelClick = () => {
    if (window.confirm('確定要取消註冊嗎？您的草稿將會保留，可以稍後繼續填寫。')) {
      router.back();
    }
  };

  // 渲染當前步驟內容
  const renderStepContent = () => {
    switch (currentStep) {
      case HOST_REGISTER_STEPS.BASIC_INFO:
        return <BasicInfoStep />;
      case HOST_REGISTER_STEPS.LOCATION:
        return <LocationStep />;
      case HOST_REGISTER_STEPS.MEDIA:
        return <MediaUploadStep />;
      case HOST_REGISTER_STEPS.CONTACT:
        return <ContactInfoStep />;
      case HOST_REGISTER_STEPS.FEATURES:
        return <FeaturesStep />;
      case HOST_REGISTER_STEPS.AMENITIES:
        return <AmenitiesStep />;
      case HOST_REGISTER_STEPS.PREVIEW:
        return <PreviewStep />;
      default:
        return <div>未知步驟</div>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 進度指示器 */}
      <div className="mb-8">
        <div className="relative pt-1">
          <div className="flex mb-4 items-center justify-between">
            <div>
              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-primary-600 bg-primary-100">
                進度
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold inline-block text-primary-600">
                {stepProgress}%
              </span>
            </div>
          </div>
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-primary-100">
            <div
              style={{ width: `${stepProgress}%` }}
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary-600 transition-all duration-300"
            ></div>
          </div>
        </div>
      </div>

      {/* 步驟標籤 */}
      <div className="mb-8">
        <div className="flex flex-wrap -mx-2 justify-between">
          {STEP_CONFIG.map((step, index) => (
            <div key={index} className="px-2 mb-4 sm:mb-0">
              <button
                onClick={() => goToStep(index)}
                disabled={index > currentStep}
                className={`flex flex-col items-center ${
                  index === currentStep
                    ? 'text-primary-600'
                    : index < currentStep
                    ? 'text-green-600 cursor-pointer'
                    : 'text-gray-400 cursor-not-allowed'
                }`}
              >
                <div
                  className={`w-8 h-8 flex items-center justify-center rounded-full mb-1 ${
                    index === currentStep
                      ? 'bg-primary-600 text-white'
                      : index < currentStep
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {index < currentStep ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <span className="text-xs sm:text-sm font-medium">{step.title}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 步驟標題和描述 */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          {STEP_CONFIG[currentStep].title}
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          {STEP_CONFIG[currentStep].description}
        </p>
      </div>

      {/* 顯示提交錯誤 */}
      {submitError && (
        <div className="mb-6 p-4 bg-red-50 rounded-md border-l-4 border-red-500">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{submitError}</p>
            </div>
          </div>
        </div>
      )}

      {/* 步驟內容 */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
        <div className="p-6">
          {renderStepContent()}
        </div>
      </div>

      {/* 按鈕組 */}
      <div className="flex justify-between">
        <div>
          {isFirstStep ? (
            <button
              type="button"
              onClick={handleCancelClick}
              className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              取消
            </button>
          ) : (
            <button
              type="button"
              onClick={prevStep}
              className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              上一步
            </button>
          )}
        </div>

        <div>
          {isLastStep ? (
            <button
              type="button"
              onClick={handleSubmitClick}
              disabled={isSubmitting}
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {isSubmitting ? '提交中...' : '提交申請'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNextClick}
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              下一步
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default HostRegisterWizard;