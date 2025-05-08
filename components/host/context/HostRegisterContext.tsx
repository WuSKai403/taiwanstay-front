import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useForm, FormProvider, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  hostRegisterSchema,
  hostBasicInfoSchema,
  hostLocationSchema,
  hostMediaSchema,
  hostContactInfoSchema,
  hostFeaturesSchema,
  amenitiesSchema,
  HostRegisterFormData
} from '@/lib/schemas/host';
import { handleFormValidationError, createStepValidator, createFormSubmitter } from '@/lib/utils/formValidation';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { HostStatus } from '@/models/enums/HostStatus';
import { z } from 'zod';
import { generateSlug } from '@/lib/utils/slugUtils';

// 定義每個步驟的名稱
export const HOST_REGISTER_STEPS = {
  BASIC_INFO: 0,
  LOCATION: 1,
  MEDIA: 2,
  CONTACT: 3,
  FEATURES: 4,
  AMENITIES: 5,
  PREVIEW: 6
};

const TOTAL_STEPS = Object.keys(HOST_REGISTER_STEPS).length;

// 定義步驟標題和描述
export const STEP_CONFIG = [
  {
    title: '基本資訊',
    description: '請提供您的主人基本資訊，讓旅行者了解您的類型與特色。',
    schema: hostBasicInfoSchema
  },
  {
    title: '位置資訊',
    description: '請提供您的位置資訊，幫助旅行者找到您。',
    schema: z.object({
      location: hostLocationSchema
    })
  },
  {
    title: '媒體上傳',
    description: '上傳照片和視頻，展示您的場所環境。',
    schema: hostMediaSchema
  },
  {
    title: '聯絡資訊',
    description: '提供您的聯絡方式，讓旅行者能與您取得聯繫。',
    schema: z.object({
      contactInfo: hostContactInfoSchema
    })
  },
  {
    title: '特色與描述',
    description: '描述您的場所特色和環境，幫助申請者更深入了解您提供的體驗。',
    schema: z.object({
      features: hostFeaturesSchema
    })
  },
  {
    title: '設施與服務',
    description: '描述您提供的設施與服務，幫助旅行者了解您的環境與條件。',
    schema: z.object({
      amenities: amenitiesSchema
    })
  },
  {
    title: '預覽與提交',
    description: '檢查所有填寫的資訊，確認無誤後提交。',
    schema: null // 預覽步驟沒有獨立的驗證
  }
];

// 定義 Context 的類型
interface HostRegisterContextType {
  formData: Partial<HostRegisterFormData>;
  methods: any; // react-hook-form 的 methods
  currentStep: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  isSubmitting: boolean;
  submitError: string | null;
  goToStep: (step: number) => void;
  nextStep: () => Promise<boolean>;
  prevStep: () => void;
  saveDraft: () => Promise<void>;
  submitForm: () => Promise<boolean>;
  resetForm: () => void;
  updateFormData: (data: Partial<HostRegisterFormData>) => void;
  stepProgress: number; // 總體進度百分比
}

// 創建 Context，提供一個默認值以避免 undefined 檢查
const defaultContextValue: HostRegisterContextType = {
  formData: {},
  methods: {},
  currentStep: 0,
  isFirstStep: true,
  isLastStep: false,
  isSubmitting: false,
  submitError: null,
  goToStep: () => {},
  nextStep: async () => false,
  prevStep: () => {},
  saveDraft: async () => {},
  submitForm: async () => false,
  resetForm: () => {},
  updateFormData: () => {},
  stepProgress: 0
};

// 創建 Context
const HostRegisterContext = createContext<HostRegisterContextType>(defaultContextValue);

// 本地存儲鍵
const DRAFT_STORAGE_KEY = 'hostRegisterDraft';

// Provider 組件
export const HostRegisterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [currentStep, setCurrentStep] = useState(HOST_REGISTER_STEPS.BASIC_INFO);
  const [completedSteps, setCompletedSteps] = useState<boolean[]>(Array(TOTAL_STEPS).fill(false));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isExistingHost, setIsExistingHost] = useState(false);

  // 使用 React Hook Form
  const methods = useForm<HostRegisterFormData>({
    resolver: zodResolver(hostRegisterSchema),
    mode: 'onChange',
    defaultValues: {
      name: "",
      description: "",
      type: undefined,
      category: "",
      location: {
        country: "TW",
        city: "",
        district: "",
        zipCode: "",
        address: "",
        coordinates: {
          type: "Point",
          coordinates: [121.5, 25.0] // 默認台北座標
        },
        showExactLocation: true
      },
      photos: [],
      photoDescriptions: [],
      videoIntroduction: {
        url: "",
        description: ""
      },
      additionalMedia: {
        virtualTour: ""
      },
      email: "",
      mobile: "",
      contactInfo: {
        contactEmail: "",
        contactMobile: "",
        socialMedia: {}
      },
      features: {
        features: [],
        story: "",
        experience: "",
        environment: {
          surroundings: "",
          accessibility: "",
          nearbyAttractions: []
        }
      },
      amenities: {
        basics: {},
        accommodation: {},
        workExchange: {},
        lifestyle: {},
        activities: {},
        customAmenities: [],
        amenitiesNotes: "",
        workExchangeDescription: ""
      },
      details: {
        languages: [],
        rules: [],
        providesAccommodation: true,
        providesMeals: false
      }
    }
  });

  const { getValues, setValue, reset, formState: { errors } } = methods;

  // 檢查用戶是否處於編輯模式 (EDITING 狀態)，並加載現有數據
  useEffect(() => {
    const fetchExistingHostData = async () => {
      if (sessionStatus === 'authenticated' && session?.user?.hostId) {
        try {
          const response = await fetch('/api/hosts/me');

          if (response.ok) {
            const data = await response.json();

            if (data.success && data.host && data.host.status === HostStatus.EDITING) {
              setIsExistingHost(true);
              console.log('載入現有主人資料:', data.host);

              // 預處理資料以符合表單結構
              const hostData = data.host;

              // 填充基本資料
              setValue('name', hostData.name);
              setValue('description', hostData.description);
              setValue('type', hostData.type);
              setValue('category', hostData.category);

              // 填充位置資訊
              if (hostData.location) {
                setValue('location', {
                  address: hostData.location.address || '',
                  city: hostData.location.city || '',
                  district: hostData.location.district || '',
                  zipCode: hostData.location.zipCode || '',
                  country: 'TW',
                  coordinates: hostData.location.coordinates || {
                    type: 'Point',
                    coordinates: [0, 0]
                  },
                  showExactLocation: hostData.location.showExactLocation ?? true
                });
              }

              // 填充聯絡資訊
              setValue('email', hostData.email || '');
              setValue('mobile', hostData.mobile || '');

              if (hostData.contactInfo) {
                setValue('contactInfo', {
                  contactEmail: hostData.contactInfo.contactEmail || hostData.contactInfo.email || hostData.email || '',
                  phone: hostData.contactInfo.phone || '',
                  contactMobile: hostData.contactInfo.contactMobile || hostData.contactInfo.mobile || hostData.mobile || '',
                  website: hostData.contactInfo.website || '',
                  contactHours: hostData.contactInfo.contactHours || '',
                  socialMedia: hostData.contactInfo.socialMedia || {
                    facebook: '',
                    instagram: '',
                    line: ''
                  }
                });
              }

              // 填充媒體資訊
              if (hostData.photos) {
                // 使用新結構
                setValue('photos', hostData.photos);
                setValue('photoDescriptions', hostData.photoDescriptions || []);
                setValue('videoIntroduction', hostData.videoIntroduction || { url: '', description: '' });
                setValue('additionalMedia', hostData.additionalMedia || { virtualTour: '' });
              } else {
                // 默認空值
                setValue('photos', []);
                setValue('photoDescriptions', []);
                setValue('videoIntroduction', { url: '', description: '' });
                setValue('additionalMedia', { virtualTour: '' });
              }

              // 填充設施與服務
              if (hostData.amenities) {
                setValue('amenities', hostData.amenities);
              }

              // 填充特點與描述
              if (hostData.features) {
                setValue('features', {
                  features: hostData.features.features || [],
                  story: hostData.features.story || '',
                  experience: hostData.features.experience || '',
                  environment: hostData.features.environment || {
                    surroundings: '',
                    accessibility: '',
                    nearbyAttractions: []
                  }
                });
              }

              // 填充詳細資訊
              if (hostData.details) {
                setValue('details', hostData.details);
              }

              toast.success('已載入您先前的主人申請資料，請繼續完成編輯');
            }
          }
        } catch (error) {
          console.error('獲取現有主人資料失敗:', error);
        }
      }
    };

    fetchExistingHostData();
  }, [sessionStatus, session, setValue]);

  // 載入本地存儲的草稿
  useEffect(() => {
    const loadSavedDraft = () => {
      try {
        const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (savedDraft) {
          const parsedDraft = JSON.parse(savedDraft) as Partial<HostRegisterFormData>;

          // 為每個欄位設置值
          Object.entries(parsedDraft).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              setValue(key as any, value);
            }
          });

          console.log('已載入草稿');
        }
      } catch (error) {
        console.error('載入草稿失敗:', error);
      }
    };

    loadSavedDraft();
  }, [setValue]);

  // 保存草稿到本地存儲
  const saveDraft = async () => {
    try {
      const currentData = getValues();

      // 預處理數據，移除 NaN 值
      const cleanData = { ...currentData } as Record<string, any>;
      Object.entries(cleanData).forEach(([key, value]) => {
        if (typeof value === 'number' && isNaN(value)) {
          cleanData[key] = null;
        }
      });

      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(cleanData));
      console.log('已保存草稿');
    } catch (error) {
      console.error('保存草稿失敗:', error);
    }
  };

  // 自動保存
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      saveDraft();
    }, 30000); // 每 30 秒自動保存一次

    return () => clearInterval(autoSaveInterval);
  }, []);

  // 重置表單
  const resetForm = () => {
    reset();
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setCurrentStep(HOST_REGISTER_STEPS.BASIC_INFO);
  };

  // 更新表單數據
  const updateFormData = (data: Partial<HostRegisterFormData>) => {
    Object.entries(data).forEach(([key, value]) => {
      setValue(key as any, value);
    });
  };

  // 前往指定步驟
  const goToStep = (step: number) => {
    if (step >= 0 && step < TOTAL_STEPS) {
      setCurrentStep(step);
    }
  };

  // 創建通用的步驟驗證器
  const validateStep = createStepValidator(methods);

  // 前往下一步
  const nextStep = async (): Promise<boolean> => {
    // 如果是最後一步，直接返回
    if (currentStep === HOST_REGISTER_STEPS.PREVIEW) {
      return true;
    }

    // 獲取當前步驟的驗證模式
    const stepSchema = STEP_CONFIG[currentStep].schema;
    if (!stepSchema) {
      // 如果沒有驗證模式（預覽步驟），直接前進
      setCurrentStep(prev => Math.min(prev + 1, TOTAL_STEPS - 1));
      return true;
    }

    try {
      // 獲取目前表單數據並輸出以便偵錯
      const formValues = getValues();
      console.log('驗證步驟前的表單數據:', {
        step: currentStep,
        title: STEP_CONFIG[currentStep].title,
        'contactInfo.contactEmail': formValues.contactInfo?.contactEmail,
        'contactInfo.contactMobile': formValues.contactInfo?.contactMobile
      });

      // 使用通用步驟驗證器驗證當前步驟
      const isValid = await validateStep(stepSchema, async () => {
        // 驗證通過，保存草稿並前進
        await saveDraft();
        setCurrentStep(prev => Math.min(prev + 1, TOTAL_STEPS - 1));
      });

      return isValid;
    } catch (error) {
      console.error('驗證步驟時發生錯誤:', error);
      return false;
    }
  };

  // 返回上一步
  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  // 表單提交處理函數
  const handleFormSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // 檢查表單是否有效 - 使用完整的 hostRegisterSchema 進行最終驗證
      const isValid = await validateStep(hostRegisterSchema, async () => {
        console.log('表單驗證成功，即將提交');
      });

      if (!isValid) {
        setIsSubmitting(false);
        return false;
      }

      // 準備提交資料
      const formData = getValues() as any;

      // 詳細記錄表單數據
      console.log('[前端] 提交表單數據:', {
        name: formData.name,
        type: formData.type,
        photos: formData.photos,
        photoDescriptions: formData.photoDescriptions,
        photosLength: formData.photos?.length,
        photosType: typeof formData.photos,
        firstPhoto: formData.photos?.[0],
      });

      // 檢查是否存在舊格式的媒體欄位，如果存在則移除它
      if (formData.media) {
        console.log('[前端] 發現舊的 media 欄位，將移除此欄位');
        delete formData.media;
      }

      // 轉換照片欄位格式: publicId -> publicId, secureUrl -> secureUrl
      if (formData.photos && Array.isArray(formData.photos) && formData.photos.length > 0) {
        formData.photos = formData.photos.map((photo: any) => {
          if (!photo) return null;

          // 創建一個新對象，保留所有現有屬性
          const newPhoto: any = { ...photo };

          // 轉換字段名稱
          if (photo.publicId && !photo.publicId) {
            newPhoto.publicId = photo.publicId;
            delete newPhoto.publicId;
          }

          if (photo.secureUrl && !photo.secureUrl) {
            newPhoto.secureUrl = photo.secureUrl;
            delete newPhoto.secureUrl;
          }

          // 確保所有必要欄位存在
          if (!newPhoto.publicId || !newPhoto.secureUrl) {
            console.error('[前端] 照片缺少必要欄位:', newPhoto);
            return null;
          }

          return newPhoto;
        }).filter(Boolean); // 過濾掉空值

        console.log('[前端] 格式轉換後的照片:', formData.photos);
      }

      // 自動生成 slug 欄位（如果沒有的話）
      if (formData.name && (!formData.slug || formData.slug.trim() === '')) {
        // 使用通用的 slug 生成函數
        formData.slug = generateSlug(
          formData.name,
          formData.type,
          formData.location?.city,
          formData.category
        );
        console.log('自動生成 SEO 友善的 slug:', formData.slug);
      }

      // 選擇正確的API路徑和方法
      let apiUrl = '/api/hosts';
      let method = 'POST';

      // 如果是現有主人編輯資料，使用PUT方法
      if (isExistingHost && session?.user?.hostId) {
        apiUrl = `/api/hosts/${session.user.hostId}`;
        method = 'PUT';
      }

      // 提交表單資料到 API
      const response = await fetch(apiUrl, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[前端] API錯誤響應:', errorData);

        // 根據錯誤類型提供更具體的錯誤訊息
        if (errorData.status) {
          switch (errorData.status) {
            case 'pending':
              throw new Error('您的主人申請已提交，正在審核中');
            case 'active':
              // 如果已是主人，可以跳轉到主人頁面
              toast.success('您已是註冊主人');
              router.push(`/hosts/${errorData.hostId}/dashboard`);
              return true;
            case 'rejected':
              throw new Error('您的主人申請已被拒絕，請聯繫客服瞭解詳情');
            case 'data_inconsistency':
              throw new Error('系統資料不一致，請聯繫客服處理');
            default:
              throw new Error(errorData.message || '主人註冊失敗');
          }
        } else {
          throw new Error(errorData.message || '主人註冊失敗');
        }
      }

      // 成功處理
      const data = await response.json();
      console.log('[前端] 主人註冊成功:', data);

      // 提交成功後，導向至主人中心
      if (data.host && data.host._id) {
        toast.success('主人註冊成功！');
        router.push(`/hosts/${data.host._id}/dashboard`);
      } else {
        toast.success('主人申請提交成功！審核通過後可登入主人中心');
        router.push('/profile');
      }

      return true;
    } catch (error: any) {
      console.error('[前端] 主人註冊錯誤:', error);
      setSubmitError(error.message || '提交發生錯誤');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // 計算總體進度
  const stepProgress = Math.min(Math.round(((currentStep + 1) / TOTAL_STEPS) * 100), 100);

  // 判斷是否為首尾步驟
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === TOTAL_STEPS - 1;

  // 使用 useMemo 優化 Context 值的創建，避免不必要的重渲染
  const contextValue = useMemo<HostRegisterContextType>(() => ({
    formData: getValues(),
    methods,
    currentStep,
    isFirstStep,
    isLastStep,
    isSubmitting,
    submitError,
    goToStep,
    nextStep,
    prevStep,
    saveDraft,
    submitForm: handleFormSubmit,
    resetForm,
    updateFormData,
    stepProgress
  }), [
    currentStep,
    isFirstStep,
    isLastStep,
    isSubmitting,
    submitError,
    stepProgress,
    methods
  ]);

  return (
    <HostRegisterContext.Provider value={contextValue}>
      <FormProvider {...methods}>
        {children}
      </FormProvider>
    </HostRegisterContext.Provider>
  );
};

// 自定義 Hook 以便使用此 Context
export const useHostRegister = () => {
  const context = useContext(HostRegisterContext);
  if (!context) {
    throw new Error('useHostRegister 必須在 HostRegisterProvider 內使用');
  }
  return context;
};

export default HostRegisterContext;