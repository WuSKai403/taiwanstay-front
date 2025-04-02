import React, { useRef, useEffect, useState } from 'react';
import { UseFormTrigger, FieldValues, FieldErrors } from 'react-hook-form';

interface FormStepControllerProps<T extends FieldValues> {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  onSaveDraft?: () => void;
  onSubmit?: () => void;
  isLastStep: boolean;
  isValid: boolean;
  isSubmitting?: boolean;
  trigger: UseFormTrigger<T>;
  errors: FieldErrors<T>;
  stepFieldNames: string[];
  className?: string;
}

const FormStepController = <T extends FieldValues>({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onSaveDraft,
  onSubmit,
  isLastStep,
  isValid,
  isSubmitting = false,
  trigger,
  errors,
  stepFieldNames,
  className = ''
}: FormStepControllerProps<T>) => {
  const [isValidating, setIsValidating] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // 處理下一步點擊
  const handleNextClick = async () => {
    setIsValidating(true);

    // 觸發當前步驟的所有欄位驗證
    const result = await trigger(stepFieldNames as any);

    if (result) {
      // 如果驗證通過
      onNext();
    } else {
      // 如果驗證失敗，找到第一個錯誤欄位並滾動到該位置
      scrollToFirstError();
    }

    setIsValidating(false);
  };

  // 處理提交
  const handleSubmit = async () => {
    setIsValidating(true);

    // 觸發當前步驟的所有欄位驗證
    const result = await trigger(stepFieldNames as any);

    if (result) {
      // 如果驗證通過
      onSubmit?.();
    } else {
      // 如果驗證失敗，找到第一個錯誤欄位並滾動到該位置
      scrollToFirstError();
    }

    setIsValidating(false);
  };

  // 滾動到第一個錯誤欄位
  const scrollToFirstError = () => {
    if (Object.keys(errors).length === 0) return;

    // 嘗試找到第一個錯誤欄位的元素
    const firstErrorField = stepFieldNames.find(fieldName =>
      errors[fieldName as keyof typeof errors]
    );

    if (firstErrorField) {
      // 尋找包含錯誤欄位的元素
      const errorElement = document.querySelector(`[name="${firstErrorField}"], #${firstErrorField}`);

      if (errorElement) {
        // 加入高亮樣式
        errorElement.classList.add('error-highlight');

        // 滾動到錯誤欄位
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // 嘗試聚焦元素
        try {
          (errorElement as HTMLElement).focus();
        } catch (e) {
          console.log('無法聚焦元素', e);
        }

        // 移除高亮效果（延遲 2 秒）
        setTimeout(() => {
          errorElement.classList.remove('error-highlight');
        }, 2000);
      }
    }
  };

  return (
    <div className={`mt-8 ${className}`}>
      <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 sm:justify-between">
        <button
          type="button"
          onClick={onPrevious}
          className={`w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 ${
            currentStep === 0 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={currentStep === 0}
        >
          上一步
        </button>

        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          {onSaveDraft && (
            <button
              type="button"
              onClick={onSaveDraft}
              className="w-full sm:w-auto px-4 py-2 border border-primary-300 rounded-md shadow-sm text-sm font-medium text-primary-700 bg-white hover:bg-primary-50"
            >
              儲存草稿
            </button>
          )}

          {!isLastStep ? (
            <button
              ref={buttonRef}
              type="button"
              onClick={handleNextClick}
              className={`w-full sm:w-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                isValid ? 'bg-primary-600 hover:bg-primary-700' : 'bg-primary-400'
              } transition-colors duration-200 ${isValidating ? 'opacity-70 cursor-wait' : ''}`}
              disabled={isValidating}
            >
              下一步
              {!isValid && <span className="hidden sm:inline ml-1">（請填寫必填欄位）</span>}
            </button>
          ) : (
            <button
              ref={buttonRef}
              type="button"
              onClick={handleSubmit}
              className={`w-full sm:w-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                isValid ? 'bg-primary-600 hover:bg-primary-700' : 'bg-primary-400'
              } transition-colors duration-200 ${isSubmitting || isValidating ? 'opacity-70 cursor-wait' : ''}`}
              disabled={isSubmitting || isValidating}
            >
              {isSubmitting ? '提交中...' : '提交申請'}
              {!isValid && <span className="hidden sm:inline ml-1">（請填寫必填欄位）</span>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormStepController;