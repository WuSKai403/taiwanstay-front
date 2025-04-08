import { UseFormReturn } from 'react-hook-form';
import { ZodError } from 'zod';

/**
 * 處理表單驗證錯誤的通用工具函數
 *
 * @param error - 捕獲的錯誤對象，通常是ZodError
 * @param methods - react-hook-form的methods對象
 * @param options - 配置選項
 * @returns 是否有錯誤
 */
export const handleFormValidationError = (
  error: unknown,
  methods: UseFormReturn<any>,
  options?: {
    errorMessage?: string;
    scrollToFirstError?: boolean;
    setSubmitted?: boolean;
  }
) => {
  const {
    errorMessage = '請修正表單中的錯誤後再繼續',
    scrollToFirstError = true,
    setSubmitted = true
  } = options || {};

  console.error('表單驗證失敗:', error);

  // 如果設置了setSubmitted，標記表單為已提交狀態，觸發所有錯誤顯示
  if (setSubmitted) {
    methods.setError('root.serverError', {
      type: 'manual',
      message: errorMessage
    });
  }

  // 強制觸發所有字段的驗證
  Object.keys(methods.formState.errors).forEach(key => {
    methods.trigger(key as any);
  });

  // 如果是Zod驗證錯誤，分別設置每個字段的錯誤
  if (error instanceof ZodError) {
    const zodErrors = error.errors;
    zodErrors.forEach((err) => {
      if (err.path && err.path.length > 0) {
        const fieldName = err.path.join('.');

        // 處理 NaN 錯誤 - 將字段設置為 null
        if (err.code === 'invalid_type' && err.received === 'nan') {
          methods.setValue(fieldName as any, null);
        }

        methods.setError(fieldName as any, {
          type: 'manual',
          message: err.message
        });
      }
    });

    // 滾動到第一個錯誤字段的位置
    if (scrollToFirstError && zodErrors.length > 0 && zodErrors[0].path) {
      setTimeout(() => {
        const firstErrorPath = zodErrors[0].path[0];
        // 確保路徑是字符串
        const fieldId = typeof firstErrorPath === 'string'
          ? firstErrorPath
          : String(firstErrorPath);

        const firstErrorField = document.getElementById(fieldId);
        if (firstErrorField) {
          firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
          firstErrorField.focus();
        }
      }, 100); // 略微延遲以確保DOM已更新
    }
  }

  return true;
};

/**
 * 創建通用的表單步驟驗證處理器
 * 適用於使用wizard/步驟式表單的場景
 */
export const createStepValidator = (methods: UseFormReturn<any>) => {
  return async (schema: any, onSuccess?: () => void): Promise<boolean> => {
    try {
      // 獲取當前表單數據
      const currentData = methods.getValues();

      // 預處理數據，確保數字欄位不包含 NaN 或空字符串
      const processedData = { ...currentData };
      Object.entries(processedData).forEach(([key, value]) => {
        // 將空字符串轉換為 null
        if (value === '') {
          processedData[key] = null;
        }
        // 將 NaN 值轉換為 null
        if (typeof value === 'number' && isNaN(value)) {
          processedData[key] = null;
        }
      });

      // 使用提供的schema驗證數據
      await schema.parseAsync(processedData);

      // 驗證通過，執行成功回調
      if (onSuccess) {
        onSuccess();
      }

      return true;
    } catch (error) {
      // 處理驗證錯誤
      handleFormValidationError(error, methods);
      return false;
    }
  };
};

/**
 * 創建通用的表單提交處理器
 */
export const createFormSubmitter = <T>(methods: UseFormReturn<any>) => {
  return async (
    apiEndpoint: string,
    options?: {
      method?: 'POST' | 'PUT';
      transformData?: (data: any) => any;
      onSuccess?: (data: T) => void;
      onError?: (error: Error) => void;
    }
  ): Promise<{ success: boolean; data?: T; error?: Error }> => {
    const {
      method = 'POST',
      transformData,
      onSuccess,
      onError
    } = options || {};

    let result: { success: boolean; data?: T; error?: Error } = { success: false };

    try {
      // 使用handleSubmit執行表單驗證並獲取結果
      await methods.handleSubmit(async (data) => {
        try {
          // 轉換數據（如果需要）
          const submitData = transformData ? transformData(data) : data;

          // 發送API請求
          const response = await fetch(apiEndpoint, {
            method,
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(submitData),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || '表單提交失敗');
          }

          const responseData = await response.json() as T;

          // 執行成功回調
          if (onSuccess) {
            onSuccess(responseData);
          }

          result = { success: true, data: responseData };
        } catch (error: any) {
          const err = error instanceof Error ? error : new Error(String(error));
          result = { success: false, error: err };
          throw err; // 重新拋出以便外層捕獲
        }
      })();
    } catch (error: any) {
      console.error('表單提交失敗:', error);

      // 執行錯誤回調
      if (onError && error instanceof Error) {
        onError(error);
      }

      if (!result.error) {
        result.error = error instanceof Error ? error : new Error(String(error));
      }
    }

    return result;
  };
};