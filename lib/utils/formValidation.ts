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
        // 獲取第一個錯誤的路徑，嘗試先查找完整路徑對應的元素
        const firstErrorPathFull = zodErrors[0].path.join('.');
        let firstErrorField = document.getElementById(firstErrorPathFull);

        // 如果找不到完整路徑對應的元素，則嘗試查找子路徑
        if (!firstErrorField) {
          for (let i = 0; i < zodErrors[0].path.length; i++) {
            const pathPart = zodErrors[0].path[i];
            const fieldId = typeof pathPart === 'string' ? pathPart : String(pathPart);
            const field = document.getElementById(fieldId);
            if (field) {
              firstErrorField = field;
              break;
            }
          }
        }

        // 如果找到了錯誤字段，滾動到該字段
        if (firstErrorField) {
          console.log('滾動到錯誤字段:', firstErrorField.id);
          firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
          firstErrorField.focus();
        } else {
          // 如果找不到特定元素，尋找元素內包含錯誤信息的元素
          const errorPath = zodErrors[0].path.join('.');
          const errorSelector = `[data-error-path="${errorPath}"], [data-field="${errorPath}"], [name="${errorPath}"]`;
          const errorElement = document.querySelector(errorSelector);

          if (errorElement) {
            console.log('滾動到錯誤元素:', errorSelector);
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else {
            console.warn('找不到錯誤字段元素:', errorPath);
          }
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

      // 輸出重要欄位進行偵錯
      console.log('步驟驗證 - 當前表單值:', {
        contactInfo: currentData.contactInfo,
        contactEmail: currentData.contactInfo?.contactEmail,
        contactMobile: currentData.contactInfo?.contactMobile,
      });

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

      // 確保contactInfo物件存在且內部欄位有值
      if (processedData.contactInfo) {
        // 如果聯絡資訊欄位是空字串，設定為null
        if (processedData.contactInfo.contactEmail === '') {
          processedData.contactInfo.contactEmail = null;
        }
        if (processedData.contactInfo.contactMobile === '') {
          processedData.contactInfo.contactMobile = null;
        }
      }

      // 輸出處理後的資料
      console.log('步驟驗證 - 處理後的表單值:', {
        contactInfo: processedData.contactInfo,
        contactEmail: processedData.contactInfo?.contactEmail,
        contactMobile: processedData.contactInfo?.contactMobile,
      });

      // 使用提供的schema驗證數據
      // 修改: 使用 schema.parse 而非 schema.parseAsync，因為 schema 可能不支持 parseAsync
      if (schema && typeof schema.parse === 'function') {
        schema.parse(processedData);
      } else if (schema && typeof schema.parseAsync === 'function') {
        await schema.parseAsync(processedData);
      } else if (schema) {
        // 如果 schema 既沒有 parse 也沒有 parseAsync 方法，嘗試直接使用 schema 作為函數
        if (typeof schema === 'function') {
          schema(processedData);
        } else {
          console.warn('提供的 schema 無法驗證數據，跳過驗證');
        }
      }

      // 驗證通過，執行成功回調
      if (onSuccess) {
        onSuccess();
      }

      return true;
    } catch (error) {
      // 輸出驗證錯誤以便偵錯
      console.error('步驟驗證錯誤詳情:', error);

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