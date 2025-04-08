import React from 'react';
import { useFormContext } from 'react-hook-form';

interface FormErrorSummaryProps {
  title?: string;
  className?: string;
  showWhen?: 'always' | 'submitted' | 'dirty';
  excludeFields?: string[];
  includeFields?: string[];
}

/**
 * 通用表單錯誤摘要元件
 * 用於顯示表單中所有的驗證錯誤，特別適用於多步驟表單
 */
const FormErrorSummary: React.FC<FormErrorSummaryProps> = ({
  title = '請修正以下錯誤：',
  className = '',
  showWhen = 'submitted',
  excludeFields = [],
  includeFields = []
}) => {
  // 使用 try-catch 包裹 useFormContext 以防止可能的錯誤
  try {
    const formMethods = useFormContext();

    // 檢查 formMethods 是否存在且有效
    if (!formMethods || typeof formMethods !== 'object') {
      console.warn('FormErrorSummary: 找不到表單上下文，請確保在 FormProvider 內使用此組件');
      return null;
    }

    const { formState } = formMethods;
    const { errors, isSubmitted, isDirty } = formState || { errors: {}, isSubmitted: false, isDirty: false };

    // 決定是否顯示錯誤摘要
    const shouldShow = (
      (showWhen === 'always') ||
      (showWhen === 'submitted' && isSubmitted) ||
      (showWhen === 'dirty' && isDirty)
    ) && Object.keys(errors).length > 0;

    if (!shouldShow) {
      return null;
    }

    // 獲取錯誤信息並過濾
    const errorList: { field: string; message: string }[] = [];

    // 遞歸獲取嵌套錯誤
    const extractErrors = (obj: any, prefix = '') => {
      if (!obj || typeof obj !== 'object') return;

      for (const key in obj) {
        if (key === 'message' && typeof obj.message === 'string') {
          const fieldName = prefix.endsWith('.')
            ? prefix.slice(0, -1)
            : prefix;

          // 檢查是否應該包含或排除該欄位
          if (
            (includeFields.length === 0 || includeFields.includes(fieldName)) &&
            !excludeFields.includes(fieldName) &&
            fieldName !== 'root.serverError'
          ) {
            errorList.push({
              field: fieldName,
              message: obj.message
            });
          }
        } else if (obj[key] && typeof obj[key] === 'object') {
          extractErrors(obj[key], `${prefix}${key}.`);
        }
      }
    };

    extractErrors(errors);

    return (
      <div className={`p-4 bg-red-50 border border-red-200 rounded-md mb-6 ${className}`}>
        <p className="text-red-600 font-medium">{title}</p>
        {errorList.length > 0 && (
          <ul className="mt-2 list-disc pl-5 space-y-1">
            {errorList.map((error, index) => (
              <li key={index} className="text-sm text-red-600">
                {error.field}: {error.message}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  } catch (error) {
    console.error('FormErrorSummary 渲染錯誤:', error);
    return null; // 出錯時返回空
  }
};

export default FormErrorSummary;