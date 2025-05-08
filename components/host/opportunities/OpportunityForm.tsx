import { useState, useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { Tab } from '@headlessui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { OpportunityType } from '@/models/enums';

import Button from '@/components/common/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { OpportunityStatus } from '@/models/enums';
import { typeNameMap } from '@/components/opportunity/constants';

// 導入標籤組件
import BasicInfoTab from '@/components/host/opportunities/tabs/BasicInfoTab';
import DetailInfoTab from '@/components/host/opportunities/tabs/DetailInfoTab';
import TimeManagementTab from '@/components/host/opportunities/tabs/TimeManagementTab';
import MediaUploadTab from '@/components/host/opportunities/tabs/MediaUploadTab';
import PreviewTab from '@/components/host/opportunities/tabs/PreviewTab';

// 我們直接從 pages/hosts/[hostId]/opportunities/[opportunityId]/index.tsx 引入表單架構
// 因為 lib/schemas/opportunity.ts 中的架構可能與實際使用不一致
// 基本表單驗證架構
export const opportunitySchema = z.object({
  title: z.string().min(5, { message: '標題至少需要5個字符' }).max(100, { message: '標題不能超過100個字符' }),
  shortDescription: z.string().min(10, { message: '簡短描述至少需要10個字符' }).max(200, { message: '簡短描述不能超過200個字符' }),
  description: z.string().min(20, { message: '詳細描述至少需要20個字符' }),
  type: z.nativeEnum(OpportunityType),
  location: z.object({
    address: z.string().optional(),
    city: z.string().min(1, { message: '請選擇城市' }),
    district: z.string().min(1, { message: '請選擇區域' }),
    region: z.string().optional(),
    country: z.string().default('Taiwan'),
    zipCode: z.string().optional(),
    coordinates: z.array(z.number()).length(2).optional().or(z.null()),
    showExactLocation: z.boolean().default(false).optional(),
  }),
  workDetails: z.object({
    tasks: z.array(z.string()).min(1, { message: '請至少添加一個工作任務' }),
    skills: z.array(z.string()).optional(),
    learningOpportunities: z.array(z.string()).optional(),
    physicalDemand: z.enum(['low', 'medium', 'high']).optional(),
    languages: z.array(z.string()).optional(),
    availableMonths: z.array(z.number()).optional(),
  }),
  benefits: z.object({
    accommodation: z.object({
      provided: z.boolean(),
      type: z.enum(['private_room', 'shared_room', 'dormitory', 'camping', 'other']).optional(),
      description: z.string().optional(),
    }),
    meals: z.object({
      provided: z.boolean(),
      count: z.number().min(0).max(3).optional(),
      description: z.string().optional(),
    }),
    stipend: z.object({
      provided: z.boolean(),
      amount: z.number().optional(),
      currency: z.string().optional(),
      frequency: z.string().optional(),
    }).optional(),
    otherBenefits: z.array(z.string()).optional(),
  }),
  requirements: z.object({
    minAge: z.number().min(16).max(100).optional(),
    acceptsCouples: z.boolean().optional(),
    acceptsFamilies: z.boolean().optional(),
    acceptsPets: z.boolean().optional(),
    drivingLicense: z.object({
      carRequired: z.boolean().default(false),
      motorcycleRequired: z.boolean().default(false),
      otherRequired: z.boolean().default(false),
      otherDescription: z.string().optional(),
    }).optional(),
    otherRequirements: z.array(z.string()).optional(),
  }).optional(),
  media: z.object({
    images: z.array(z.object({
      publicId: z.string().optional(),
      secureUrl: z.string().optional(),
      previewUrl: z.string().optional(),
      thumbnailUrl: z.string().optional(),
      version: z.string().optional(),
      url: z.string().optional(),
      alt: z.string().optional(),
      format: z.string().optional(),
      width: z.number().optional(),
      height: z.number().optional(),
    })).optional(),
    descriptions: z.array(z.string()).optional(),
    coverImage: z.object({
      publicId: z.string().optional(),
      secureUrl: z.string().min(1, { message: '請上傳封面圖片' }),
      previewUrl: z.string().optional(),
      thumbnailUrl: z.string().optional(),
      version: z.string().optional(),
      url: z.string().optional(),
      alt: z.string().optional(),
      format: z.string().optional(),
      width: z.number().optional(),
      height: z.number().optional(),
    }).optional(),
    videoUrl: z.string().optional(),
    videoDescription: z.string().optional(),
    virtualTour: z.string().optional(),
  }).optional(),
  hasTimeSlots: z.boolean().default(true),
  timeSlots: z.array(z.object({
    id: z.string().optional(),
    startDate: z.string().min(1, "請選擇開始日期"),
    endDate: z.string().min(1, "請選擇結束日期"),
    defaultCapacity: z.number().min(1, "容量至少為1人").optional(),
    minimumStay: z.number().min(1, "最短停留時間至少為1天").optional(),
    appliedCount: z.number().optional(),
    confirmedCount: z.number().optional(),
    status: z.string().optional(),
    description: z.string().optional(),
  })).min(1, "請至少添加一個時間段"),
});

export type OpportunityFormData = z.infer<typeof opportunitySchema>;

// 定義 OpportunityForm 組件的 props
interface OpportunityFormProps {
  initialData?: OpportunityFormData; // 初始表單數據
  isNewOpportunity: boolean; // 是否為新增機會
  onSubmit: (data: OpportunityFormData) => Promise<void>;
  onPublish?: () => Promise<void>; // 可選的發布功能
  onPreview?: (opportunitySlug: string) => void; // 可選的預覽功能
  onSubmitForReview?: (data: OpportunityFormData) => Promise<void>; // 修改 - 送出審核功能接收表單數據
  saveDraft?: (data: Partial<OpportunityFormData>) => Promise<void>; // 新增 - 儲存草稿功能
  onCancel: () => void; // 取消操作
  isSubmitting: boolean; // 是否正在提交
  isPublishing?: boolean; // 是否正在發布
  isSubmittingForReview?: boolean; // 新增 - 是否正在送出審核
  isSubmittingDraft?: boolean; // 新增 - 是否正在儲存草稿
  opportunity?: any; // 機會數據（用於顯示狀態等）
}

// OpportunityForm 組件
export default function OpportunityForm({
  initialData,
  isNewOpportunity,
  onSubmit,
  onPublish,
  onPreview,
  onSubmitForReview, // 新增 - 送出審核功能
  saveDraft, // 新增 - 儲存草稿功能
  onCancel,
  isSubmitting,
  isPublishing,
  isSubmittingForReview, // 新增 - 是否正在送出審核
  isSubmittingDraft, // 新增 - 是否正在儲存草稿
  opportunity,
}: OpportunityFormProps) {
  const [activeTab, setActiveTab] = useState(0);
  // 新增錯誤通知狀態
  const [showErrorNotification, setShowErrorNotification] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorFields, setErrorFields] = useState<string[]>([]);

  // 統一使用同一個表單邏輯，不再區分新增/編輯
  const methods = useForm<OpportunityFormData>({
    resolver: zodResolver(opportunitySchema),
    defaultValues: initialData || {
      title: '',
      type: OpportunityType.FARMING,
      shortDescription: '',
      description: '',
      location: {
        address: '',
        city: '',
        district: '',
        country: 'Taiwan',
        zipCode: '',
        coordinates: null,
        showExactLocation: false,
      },
      workDetails: {
        tasks: [],
        skills: [],
        learningOpportunities: [],
        physicalDemand: 'medium',
        languages: [],
        availableMonths: [],
      },
      benefits: {
        accommodation: {
          provided: false,
        },
        meals: {
          provided: false,
        },
        stipend: {
          provided: false,
        },
      },
      requirements: {
        acceptsCouples: false,
        acceptsFamilies: false,
        acceptsPets: false,
        drivingLicense: {
          carRequired: false,
          motorcycleRequired: false,
          otherRequired: false,
        },
      },
      hasTimeSlots: true,
      timeSlots: [],
      media: {
        images: [],
        descriptions: [], // 確保是數組類型
        coverImage: undefined, // 初始為 undefined
        videoUrl: '',
        videoDescription: '',
        virtualTour: '',
      },
    },
    // 設置表單驗證模式
    mode: 'onChange',     // 當欄位值改變時立即驗證
    reValidateMode: 'onChange',  // 在錯誤後，當值改變時重新驗證
    criteriaMode: 'all',  // 返回所有驗證錯誤信息
    shouldFocusError: true, // 自動聚焦到第一個錯誤
  });

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty, isValid, touchedFields },
  } = methods;

  // 當初始數據更新時重置表單
  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  // 標籤頁定義
  const tabs = [
    { name: '基本資訊', component: BasicInfoTab },
    { name: '詳細資訊', component: DetailInfoTab },
    { name: '時間管理', component: TimeManagementTab },
    { name: '圖片上傳', component: MediaUploadTab },
    { name: '預覽', component: PreviewTab },
  ];

  // 處理下一步按鈕點擊 - 改進版本，加入驗證
  const handleNextTab = async () => {
    if (activeTab < tabs.length - 1) {
      // 獲取當前頁籤需要驗證的欄位
      const fieldsToValidate = getTabFields(activeTab);

      console.log('準備驗證當前頁籤欄位:', fieldsToValidate);

      // 特別處理媒體頁籤
      if (activeTab === 3) { // 媒體頁籤
        const formData = methods.getValues();
        console.log('===== 媒體頁籤詳細結構 =====');
        console.log('媒體數據完整結構:', JSON.stringify(formData.media, null, 2));

        // 單獨檢查封面圖片
        if (formData.media && formData.media.coverImage) {
          console.log('封面圖片詳細資訊:', {
            類型: typeof formData.media.coverImage,
            是否為空: formData.media.coverImage === null,
            屬性: Object.keys(formData.media.coverImage),
            secureUrl: formData.media.coverImage.secureUrl,
            secureUrl類型: typeof formData.media.coverImage.secureUrl,
            secureUrl長度: formData.media.coverImage.secureUrl ? formData.media.coverImage.secureUrl.length : 0
          });
        } else {
          console.log('錯誤: 封面圖片不存在或為null');
        }

        // 檢查圖片集
        if (formData.media && formData.media.images) {
          console.log('圖片集合詳細資訊:', {
            類型: typeof formData.media.images,
            長度: formData.media.images.length,
            是否為陣列: Array.isArray(formData.media.images),
            元素類型: formData.media.images.length > 0 ? typeof formData.media.images[0] : '無元素'
          });

          // 檢查每個圖片
          formData.media.images.forEach((img, index) => {
            console.log(`圖片 ${index} 詳細資訊:`, {
              類型: typeof img,
              屬性: img ? Object.keys(img) : '無屬性',
              secureUrl存在: Boolean(img && img.secureUrl),
              secureUrl類型: img && img.secureUrl ? typeof img.secureUrl : '無secureUrl',
              secureUrl長度: img && img.secureUrl ? img.secureUrl.length : 0
            });
          });
        } else {
          console.log('注意: 圖片集為空或未定義');
        }
      }

      // 由於 trigger 方法的類型限制，我們只能傳入單個欄位或不傳參數進行全驗證
      // 這裡我們改為不傳參數進行全驗證
      const isTabValid = await methods.trigger();

      console.log('驗證結果:', isTabValid ? '通過' : '失敗', '錯誤:', Object.keys(methods.formState.errors));

      // 輸出表單所有錯誤詳細資訊
      if (!isTabValid) {
        const allErrors = methods.formState.errors;
        console.log('所有表單錯誤詳細內容:', JSON.stringify(allErrors, null, 2));
      }

      // 檢查當前頁籤是否有錯誤
      const hasTabErrors = Object.keys(methods.formState.errors).some(fieldName =>
        fieldsToValidate.some(field => fieldName.startsWith(field))
      );

      if (!hasTabErrors) {
        // 當前頁籤沒有錯誤，切換到下一個頁籤
        setActiveTab(activeTab + 1);
      } else {
        // 驗證失敗，顯示錯誤訊息
        const tabErrors = Object.entries(methods.formState.errors)
          .filter(([field]) => fieldsToValidate.some(f => field.startsWith(f)))
          .map(([field, error]) => `${getReadableFieldName(field)}: ${(error as any)?.message || '欄位填寫不正確'}`);

        console.log('當前頁籤錯誤:', tabErrors);

        setErrorMessage(`請修正以下問題後再繼續：\n${tabErrors.join('\n')}`);
        setErrorFields(tabErrors.map(e => e.split(':')[0].trim()));
        setShowErrorNotification(true);
      }
    }
  };

  // 處理上一步按鈕點擊
  const handlePrevTab = () => {
    if (activeTab > 0) {
      setActiveTab(activeTab - 1);
    }
  };

  // 獲取可讀性更好的欄位名稱
  const getReadableFieldName = (fieldName: string): string => {
    const fieldMappings: Record<string, string> = {
      'title': '標題',
      'shortDescription': '簡短描述',
      'description': '詳細描述',
      'type': '機會類型',
      'location.city': '城市',
      'location.district': '地區',
      'workDetails.tasks': '工作任務',
      'media.coverImage.secureUrl': '封面圖片',
      'media.images': '圖片集',
      // 可以添加更多欄位對應
    };

    // 嘗試從映射中獲取名稱，若無則美化原始欄位名
    return fieldMappings[fieldName] ||
      fieldName.split('.').pop()?.replace(/([A-Z])/g, ' $1').trim() ||
      fieldName;
  };

  // 獲取指定頁籤中需要驗證的欄位
  const getTabFields = (tabIndex: number): string[] => {
    switch (tabIndex) {
      case 0: // 基本資訊
        return ['title', 'shortDescription', 'type', 'location'];
      case 1: // 詳細資訊
        return ['description', 'workDetails', 'requirements', 'benefits'];
      case 2: // 時間管理
        return ['timeSlots', 'hasTimeSlots'];
      case 3: // 圖片上傳
        return ['media'];
      default:
        return [];
    }
  };

  // 處理送出審核 - 完全重寫，優化驗證邏輯，添加更多日誌
  const handleSubmitForReview = async () => {
    console.log('===== 送出審核按鈕被點擊 =====');

    // 清除舊的錯誤通知
    setShowErrorNotification(false);

    try {
      // 打印整個表單數據用於除錯
      const formData = methods.getValues();
      console.log('表單完整數據:', JSON.stringify({
        title: formData.title,
        shortDescription: formData.shortDescription,
        type: formData.type,
        location: formData.location,
        workDetails: formData.workDetails,
        benefits: formData.benefits || {},
        requirements: formData.requirements || {},
        hasTimeSlots: formData.hasTimeSlots,
        timeSlots: (formData.timeSlots || []).length,
        media: {
          coverImage: formData.media?.coverImage ? Boolean(formData.media.coverImage.secureUrl) : null,
          images: formData.media?.images ? formData.media.images.length : 0
        }
      }, null, 2));

      // 手動前置檢查 - 特別處理媒體資料
      console.log('手動檢查媒體資料...');
      if (!formData.media) {
        console.error('錯誤: 缺少媒體資料!');
        setErrorMessage('送出審核失敗：缺少媒體資料');
        setErrorFields(['media']);
        setShowErrorNotification(true);
        setActiveTab(3); // 切換到媒體頁籤
        return;
      }

      console.log('媒體資料檢查:', {
        media: formData.media,
        hasCoverImage: Boolean(formData.media.coverImage),
        coverImageDetails: formData.media.coverImage ? {
          hasUrl: Boolean(formData.media.coverImage.secureUrl),
          publicId: (formData.media.coverImage as any)?.publicId || '未知',
        } : '缺少封面圖片',
        images: formData.media.images ? formData.media.images.length : 0
      });

      // 特別檢查封面圖片
      if (!formData.media.coverImage || !formData.media.coverImage.secureUrl) {
        console.error('錯誤: 缺少封面圖片!');
        setErrorMessage('送出審核失敗：請上傳封面圖片');
        setErrorFields(['media.coverImage']);
        setShowErrorNotification(true);

        // 切換到圖片上傳頁籤
        if (activeTab !== 3) {
          setActiveTab(3);
        }
        return;
      }

      // 確認圖片有 URL
      if (formData.media.images && formData.media.images.length > 0) {
        // 檢查每張圖片是否都有 URL
        const imagesWithoutUrl = formData.media.images.filter(img => !img || !img.secureUrl);
        if (imagesWithoutUrl.length > 0) {
          console.error(`錯誤: ${imagesWithoutUrl.length} 張圖片缺少 URL!`);
          // 嘗試移除無效圖片
          formData.media.images = formData.media.images.filter(img => img && img.secureUrl);
          console.log(`已過濾掉 ${imagesWithoutUrl.length} 張無效圖片，剩餘 ${formData.media.images.length} 張`);

          if (formData.media.images.length === 0) {
            // 如果所有圖片都無效，添加一個警告但不阻止提交
            console.warn('所有圖片都無效，但會繼續提交');
          }

          // 更新 form values
          methods.setValue('media.images', formData.media.images);
        }
      }

      // 檢查時間段設置
      console.log('檢查時間段設置...');
      if (!formData.hasTimeSlots || !formData.timeSlots || formData.timeSlots.length === 0) {
        console.error('錯誤: 缺少時間段設置!');
        setErrorMessage('送出審核失敗：請至少添加一個時間段');
        setErrorFields(['timeSlots']);
        setShowErrorNotification(true);

        // 切換到時間管理頁籤
        if (activeTab !== 2) {
          setActiveTab(2);
        }
        return;
      }

      // 檢查每個時間段的必填欄位
      const invalidTimeSlots = formData.timeSlots.filter(
        slot => !slot.startDate || !slot.endDate || !slot.defaultCapacity || !slot.minimumStay
      );

      if (invalidTimeSlots.length > 0) {
        console.error(`錯誤: ${invalidTimeSlots.length} 個時間段缺少必填資料!`);
        setErrorMessage('送出審核失敗：請完成所有時間段的必填欄位');
        setErrorFields(['timeSlots']);
        setShowErrorNotification(true);

        // 切換到時間管理頁籤
        if (activeTab !== 2) {
          setActiveTab(2);
        }
        return;
      }

      // 觸發所有表單欄位的驗證
      console.log('開始進行表單完整驗證...');
      const isValid = await methods.trigger();
      console.log('表單驗證結果:', isValid ? '通過' : '失敗');

      if (!isValid) {
        // 收集所有驗證錯誤
        const formErrors = methods.formState.errors;
        console.error('表單驗證失敗:', formErrors);

        // 打印所有錯誤詳情
        Object.entries(formErrors).forEach(([field, error]) => {
          console.error(`欄位 ${field} 錯誤:`, (error as any)?.message);
        });

        // 將錯誤格式化為用戶友好的訊息
        const errorMessages = Object.entries(formErrors).map(([field, error]) => {
          return `${getReadableFieldName(field)}: ${(error as any)?.message || '欄位填寫不正確'}`;
        });

        // 找出第一個錯誤所在的頁籤
        const errorTabMap = new Map<number, string[]>();

        // 對每個錯誤欄位分組到對應頁籤
        Object.keys(formErrors).forEach(fieldName => {
          const tabIndex = getTabWithError(fieldName);
          console.log(`欄位 ${fieldName} 對應頁籤:`, tabIndex);
          if (!errorTabMap.has(tabIndex)) {
            errorTabMap.set(tabIndex, []);
          }
          errorTabMap.get(tabIndex)?.push(fieldName);
        });

        // 設置錯誤通知
        setErrorMessage(`送出審核失敗，請修正以下問題：\n${errorMessages.join('\n')}`);
        setErrorFields(Object.keys(formErrors));
        setShowErrorNotification(true);

        // 找出有最多錯誤的頁籤，或是第一個有錯誤的頁籤
        let maxErrorCount = 0;
        let tabWithMostErrors = activeTab;

        errorTabMap.forEach((fields, tabIndex) => {
          console.log(`頁籤 ${tabIndex} (${tabs[tabIndex].name}) 有 ${fields.length} 個錯誤`);
          if (fields.length > maxErrorCount) {
            maxErrorCount = fields.length;
            tabWithMostErrors = tabIndex;
          }
        });

        // 如果當前不在錯誤最多的頁籤，詢問用戶是否要切換
        if (tabWithMostErrors !== activeTab) {
          if (confirm(`在「${tabs[tabWithMostErrors].name}」頁籤中發現 ${errorTabMap.get(tabWithMostErrors)?.length} 個錯誤，是否立即前往修正？`)) {
            setActiveTab(tabWithMostErrors);
          }
        }

        return;
      }

      // 表單驗證通過，請求用戶確認
      if (confirm('確定要送出審核嗎？送出後將進入審核流程，審核通過後會自動發布。')) {
        if (onSubmitForReview) {
          try {
            console.log('開始調用 onSubmitForReview');
            const finalData = methods.getValues();

            // 確保媒體數據的完整性
            if (finalData.media) {
              // 確保 descriptions 是陣列類型
              if (finalData.media.descriptions && !Array.isArray(finalData.media.descriptions)) {
                console.log('將 descriptions 從對象轉換為陣列');
                const descriptionsObj = finalData.media.descriptions;
                const descriptionsArray = Object.keys(descriptionsObj).map(key => descriptionsObj[key]);
                finalData.media.descriptions = descriptionsArray;
              }

              console.log('最終提交前檢查媒體資料:', {
                hasCoverImage: Boolean(finalData.media.coverImage),
                coverImageUrl: finalData.media.coverImage ? Boolean(finalData.media.coverImage.secureUrl) : false,
                imagesCount: finalData.media.images ? finalData.media.images.length : 0,
                descriptionsType: finalData.media.descriptions ?
                  (Array.isArray(finalData.media.descriptions) ? 'array' : 'object') : 'none',
                descriptionsLength: finalData.media.descriptions ?
                  (Array.isArray(finalData.media.descriptions) ? finalData.media.descriptions.length : Object.keys(finalData.media.descriptions).length) : 0
              });
            }

            await onSubmitForReview(finalData);
            console.log('送出審核處理完成');
          } catch (error) {
            console.error('送出審核時發生錯誤:', error);

            // 顯示更詳細的錯誤信息
            let errorMsg = '送出審核失敗';
            if (error instanceof Error) {
              errorMsg += `：${error.message}`;
              console.error('錯誤詳情:', error.stack);
            }

            setErrorMessage(errorMsg);
            setShowErrorNotification(true);
          }
        } else {
          console.warn('onSubmitForReview 函數未定義');
          setErrorMessage('系統錯誤：送出審核功能未正確配置');
          setShowErrorNotification(true);
        }
      }
    } catch (error) {
      console.error('送出審核處理過程中發生意外錯誤:', error);
      console.error('錯誤詳情:', error instanceof Error ? error.stack : '無法獲取錯誤詳情');
      setErrorMessage('處理送出審核請求時發生系統錯誤，請稍後再試');
      setShowErrorNotification(true);
    }
  };

  // 根據錯誤字段判斷錯誤所在的頁籤 (保留原有邏輯，但添加更詳細的媒體錯誤處理)
  const getTabWithError = (fieldName: string): number => {
    // 基本資訊頁籤的字段
    if (['title', 'shortDescription', 'type', 'location'].some(field => fieldName.startsWith(field))) {
      return 0;
    }

    // 詳細資訊頁籤的字段
    if (['description', 'workDetails', 'requirements', 'benefits'].some(field => fieldName.startsWith(field))) {
      return 1;
    }

    // 時間管理頁籤的字段 - 優先處理 timeSlots 相關錯誤
    if (['timeSlots', 'hasTimeSlots'].some(field => fieldName.startsWith(field))) {
      return 2;
    }

    // 圖片上傳頁籤的字段 - 添加更詳細的分類
    if (fieldName.startsWith('media')) {
      // 特別處理不同類型的媒體錯誤
      if (fieldName === 'media.coverImage.secureUrl' || fieldName === 'media.coverImage') {
        return 3; // 封面圖片錯誤
      }
      if (fieldName.startsWith('media.images')) {
        return 3; // 圖片集錯誤
      }
      return 3; // 其他媒體相關錯誤
    }

    // 預設返回當前頁籤
    return activeTab;
  };

  // 渲染導航按鈕
  const renderTabNavigation = () => {
    // 獲取表單數據的函數
    const getFormData = () => {
      return methods.getValues();
    };

    // 處理儲存草稿
    const handleSaveDraft = () => {
      if (saveDraft) {
        const currentData = getFormData();
        saveDraft(currentData);
      }
    };

    return (
      <div className="flex justify-between mt-8 pt-4 border-t border-gray-200">
        <Button
          type="button"
          variant="white"
          onClick={activeTab === 0 ? onCancel : handlePrevTab}
        >
          {activeTab === 0 ? '返回' : '上一步'}
        </Button>
        <div className="flex space-x-2">
          {/* 儲存草稿按鈕 - 不需要表單驗證 */}
          {isNewOpportunity && saveDraft && (
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveDraft}
              loading={isSubmittingDraft}
            >
              儲存草稿
            </Button>
          )}

          {/* 完整儲存按鈕 - 需要表單驗證 */}
          {(!isNewOpportunity || !saveDraft) && (
            <Button
              type="button"
              variant="primary"
              onClick={handleSubmit(onSubmit)}
              loading={isSubmitting}
            >
              儲存
            </Button>
          )}
          {activeTab === tabs.length - 1 && (
            <>
              {/* 新增 - 送出審核按鈕，直接使用表單數據 */}
              {isNewOpportunity && onSubmitForReview && (
                <Button
                  type="button"
                  variant="success"
                  onClick={handleSubmitForReview}
                  loading={isSubmittingForReview}
                >
                  送出審核
                </Button>
              )}

              {/* 已有機會的發佈按鈕 */}
              {!isNewOpportunity && opportunity?.status === OpportunityStatus.DRAFT && onPublish && (
                <Button
                  type="button"
                  variant="success"
                  onClick={onPublish}
                  loading={isPublishing}
                >
                  發布
                </Button>
              )}
            </>
          )}
          {activeTab < tabs.length - 1 && (
            <Button
              type="button"
              variant="secondary"
              onClick={handleNextTab}
            >
              下一步
            </Button>
          )}
        </div>
      </div>
    );
  };

  // 錯誤通知組件
  const renderErrorNotification = () => {
    if (!showErrorNotification) return null;

    return (
      <div className="fixed bottom-4 right-4 bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-lg max-w-lg z-50">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-red-800">表單驗證錯誤</p>
            <div className="mt-1 text-sm text-red-700 whitespace-pre-line">
              {errorMessage}
            </div>
            <button
              onClick={() => setShowErrorNotification(false)}
              className="mt-2 text-sm font-medium text-red-800 hover:text-red-900"
            >
              關閉
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <FormProvider {...methods}>
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">
            {isNewOpportunity ? '新增工作機會' : '編輯工作機會'}
          </h1>
          {!isNewOpportunity && opportunity && (
            <div className="flex items-center">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                opportunity.status === OpportunityStatus.ACTIVE
                  ? 'bg-green-100 text-green-800'
                  : opportunity.status === OpportunityStatus.PENDING
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
              }`}>
                {opportunity.status === OpportunityStatus.ACTIVE
                  ? '已發布'
                  : opportunity.status === OpportunityStatus.PENDING
                    ? '審核中'
                    : '草稿'}
              </span>
            </div>
          )}
        </div>

        <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
          <Tab.List className="flex space-x-1 rounded-xl bg-white p-1 border border-gray-200 shadow-sm mb-6">
            {tabs.map((tab, index) => (
              <Tab
                key={tab.name}
                className={({ selected }) =>
                  `w-full rounded-lg py-2.5 text-sm font-medium leading-5 focus:outline-none relative
                  ${
                    selected
                      ? 'bg-primary-500 text-white shadow'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }
                  ${
                    // 顯示有錯誤的頁籤指示
                    errorFields.some(field => getTabWithError(field) === index)
                      ? 'before:content-[""] before:absolute before:top-0 before:right-0 before:w-2 before:h-2 before:bg-red-500 before:rounded-full'
                      : ''
                  }`
                }
              >
                {tab.name}
              </Tab>
            ))}
          </Tab.List>
          <Tab.Panels className="mt-2">
            {/* 基本資訊表單 */}
            <Tab.Panel className="rounded-xl bg-white p-6 border border-gray-200 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">基本資訊</h2>
              <BasicInfoTab
                control={control}
                register={register}
                errors={errors}
                watch={watch}
                setValue={setValue}
              />
              {renderTabNavigation()}
            </Tab.Panel>

            {/* 詳細資訊表單 */}
            <Tab.Panel className="rounded-xl bg-white p-6 border border-gray-200 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">詳細資訊</h2>
              <DetailInfoTab
                control={control}
                register={register}
                errors={errors}
                watch={watch}
                setValue={setValue}
              />
              {renderTabNavigation()}
            </Tab.Panel>

            {/* 時間管理表單 */}
            <Tab.Panel className="rounded-xl bg-white p-6 border border-gray-200 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">時間管理</h2>
              <TimeManagementTab
                control={control}
                register={register}
                errors={errors}
                watch={watch}
                setValue={setValue}
              />
              {renderTabNavigation()}
            </Tab.Panel>

            {/* 圖片上傳表單 */}
            <Tab.Panel className="rounded-xl bg-white p-6 border border-gray-200 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">圖片上傳</h2>
              <MediaUploadTab
                control={control}
                register={register}
                errors={errors}
                watch={watch}
                setValue={setValue}
              />
              {renderTabNavigation()}
            </Tab.Panel>

            {/* 預覽頁面 */}
            <Tab.Panel className="rounded-xl bg-white p-6 border border-gray-200 shadow-sm">
              <PreviewTab
                control={control}
                watch={watch}
              />
              {renderTabNavigation()}
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>

        {/* 顯示錯誤通知 */}
        {renderErrorNotification()}
      </div>
    </FormProvider>
  );
}