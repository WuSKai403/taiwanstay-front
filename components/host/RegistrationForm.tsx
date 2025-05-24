import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Tab } from '@headlessui/react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import BasicInfoStep from './steps/BasicInfoStep';
import LocationStep from './steps/LocationStep';
import MediaUploadStep from './steps/MediaUploadStep';
import ContactInfoStep from './steps/ContactInfoStep';
import AmenitiesStep from './steps/AmenitiesStep';
import FeaturesStep from './steps/FeaturesStep';
import PreviewStep from './steps/PreviewStep';
import { HostType } from '@/models/enums/HostType';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/router';

// 表單步驟
enum FormStep {
  BASIC_INFO = 0,
  LOCATION = 1,
  MEDIA_UPLOAD = 2,
  CONTACT_INFO = 3,
  AMENITIES = 4,
  FEATURES = 5,
  PREVIEW = 6
}

// 每個步驟的標題
const STEP_TITLES = [
  '基本資訊',
  '位置資訊',
  '照片及媒體',
  '聯絡資訊',
  '設施與服務',
  '特色與描述',
  '預覽與提交'
];

// 每個步驟的驗證模式
const validationSchema = z.object({
  // 基本資訊
  name: z.string().min(2, { message: '場所名稱至少需要2個字元' }).max(100, { message: '場所名稱不得超過100個字元' }),
  description: z.string().min(30, { message: '描述至少需要30個字元' }).max(2000, { message: '描述不得超過2000個字元' }),
  type: z.nativeEnum(HostType, {
    required_error: '請選擇場所類型',
    invalid_type_error: '請選擇有效的場所類型'
  }),
  category: z.string().min(1, { message: '請選擇類別' }),
  foundingYear: z.number().optional(),
  teamSize: z.string().optional(),
  languages: z.array(z.string()).min(1, { message: '請至少選擇一種語言' }),

  // 位置資訊
  location: z.object({
    country: z.string().default('台灣'),
    city: z.string().min(1, { message: '請選擇城市' }),
    district: z.string().min(1, { message: '請選擇區域' }),
    zipCode: z.string().min(1, { message: '請輸入郵遞區號' }),
    address: z.string().min(5, { message: '請輸入詳細地址，至少5個字元' }),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }),

  // 照片及媒體
  photos: z.array(z.any()).min(1, { message: '請至少上傳1張照片' }).max(5, { message: '最多上傳5張照片' }),
  photoDescriptions: z.array(z.string().max(100, { message: '照片描述最多100字' })).optional(),
  videoIntroduction: z.object({
    url: z.string().url({ message: '請輸入有效的視頻連結' }).optional().or(z.literal('')),
    description: z.string().max(200, { message: '視頻描述最多200字' }).optional(),
  }).optional(),
  additionalMedia: z.object({
    virtualTour: z.string().url({ message: '請輸入有效的連結' }).optional().or(z.literal('')).nullable(),
  }).optional(),

  // 聯絡資訊
  contact: z.object({
    person: z.string().min(2, { message: '請輸入聯絡人姓名，至少2個字元' }),
    title: z.string().min(1, { message: '請輸入職稱' }),
    phone: z.string().min(8, { message: '請輸入有效的電話號碼' }),
    email: z.string().email({ message: '請輸入有效的電子郵件地址' }),
    fax: z.string().optional(),
    website: z.string().optional(),
    contactHours: z.string().optional(),
    notes: z.string().optional(),
    social: z.object({
      facebook: z.string().optional(),
      instagram: z.string().optional(),
      line: z.string().optional(),
      other: z.string().optional(),
    }).optional(),
  }),

  // 設施與服務
  amenities: z.record(z.record(z.boolean())).optional(),
  customAmenities: z.array(z.string()).optional(),
  amenitiesNotes: z.string().max(500, { message: '備註最多500字' }).optional(),
  workExchangeDescription: z.string().max(500, { message: '工作交流描述最多500字' }).optional(),

  // 特色與描述
  features: z.array(z.string()).max(5, { message: '最多選擇5個特色標籤' }),
  story: z.string().min(50, { message: '主人故事至少需要50個字' }).max(2000, { message: '主人故事不能超過2000個字' }),
  experience: z.string().max(1000, { message: '經驗描述最多1000字' }).optional(),
  environment: z.object({
    surroundings: z.string().min(30, { message: '環境描述至少需要30個字' }).max(1000, { message: '環境描述不能超過1000個字' }),
    accessibility: z.string().max(500, { message: '交通描述最多500字' }).optional(),
    nearbyAttractions: z.array(z.string()).max(10, { message: '最多添加10個附近景點' }).optional(),
  }),

  // 頂層通訊欄位(與後端映射)
  email: z.string().email({ message: '請輸入有效的電子郵件地址' }).optional(),
  mobile: z.string().min(1, { message: '請輸入聯絡電話' }).optional(),
});

// 獲取本地保存的草稿
const getSavedDraft = () => {
  if (typeof window !== 'undefined') {
    const savedData = localStorage.getItem('hostRegistrationDraft');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        // 確保日期等特殊格式的數據正確轉換
        return parsedData;
      } catch (error) {
        console.error('解析本地保存的草稿失敗', error);
      }
    }
  }
  return undefined;
};

// 保存草稿到本地
const saveDraftToLocalStorage = (data: any) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('hostRegistrationDraft', JSON.stringify(data));
  }
};

// 表單類型
type FormData = z.infer<typeof validationSchema>;

const HostRegistrationForm: React.FC = () => {
  // 初始步驟
  const [activeStep, setActiveStep] = useState<FormStep>(FormStep.BASIC_INFO);
  // 表單狀態
  const [formStatus, setFormStatus] = useState<'editing' | 'submitting' | 'success' | 'error'>('editing');
  // 步驟完成狀態
  const [completedSteps, setCompletedSteps] = useState<boolean[]>(Array(STEP_TITLES.length).fill(false));
  // 自動保存計時器
  const [saveTimer, setSaveTimer] = useState<NodeJS.Timeout | null>(null);
  // 顯示草稿加載訊息
  const [showDraftLoaded, setShowDraftLoaded] = useState(false);

  // 初始化表單
  const methods = useForm<FormData>({
    resolver: zodResolver(validationSchema),
    mode: 'onChange',
    defaultValues: {
      languages: [],
      location: {
        country: '台灣',
      },
      photos: [],
      photoDescriptions: [],
      videoIntroduction: { url: '', description: '' },
      additionalMedia: { virtualTour: '' },
      amenities: {},
      customAmenities: [],
      workExchangeDescription: '',
      features: [],
      environment: {
        surroundings: '',
        accessibility: '',
        nearbyAttractions: []
      },
      email: '',
      mobile: '',
    },
  });

  const { handleSubmit, formState, reset, trigger, watch, setValue, setError } = methods;
  const { isValid, errors } = formState;

  // 監聽表單變更，自動保存草稿
  const formValues = watch();
  useEffect(() => {
    // 清除之前的計時器
    if (saveTimer) clearTimeout(saveTimer);

    // 設置新的計時器，延遲2秒保存
    const timer = setTimeout(() => {
      saveDraftToLocalStorage(formValues);
    }, 2000);

    setSaveTimer(timer);

    // 組件卸載時清除計時器
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [formValues]);

  // 組件加載時，嘗試從本地存儲加載草稿
  useEffect(() => {
    const savedDraft = getSavedDraft();
    if (savedDraft) {
      reset(savedDraft);
      setShowDraftLoaded(true);
      setTimeout(() => {
        setShowDraftLoaded(false);
      }, 3000);
    }
  }, [reset]);

  // 驗證當前步驟並更新完成狀態
  const validateStep = async (step: FormStep) => {
    try {
      let validData;

      switch (step) {
        case FormStep.BASIC_INFO:
          validData = await trigger(['name', 'description', 'type', 'category', 'languages']);
          break;
        case FormStep.LOCATION:
          validData = await trigger(['location.city', 'location.district', 'location.address', 'location.zipCode']);
          break;
        case FormStep.MEDIA_UPLOAD:
          validData = await trigger(['photos']);
          break;
        case FormStep.CONTACT_INFO:
          // 改進驗證邏輯，同時驗證 contact 欄位和頂層的 email 與 mobile 欄位
          const contactData = watch();
          // 將 contact.email 和 contact.phone 的值賦給頂層欄位
          if (contactData.contact?.email && !contactData.email) {
            setValue('email', contactData.contact.email);
          }
          if (contactData.contact?.phone && !contactData.mobile) {
            setValue('mobile', contactData.contact.phone);
          }

          // 執行驗證
          validData = validationSchema.parse(contactData);
          break;
        case FormStep.AMENITIES:
          // 設施是選填的，所以只要沒有明顯錯誤就通過
          validData = !errors.amenities && !errors.amenitiesNotes && !errors.workExchangeDescription;
          break;
        case FormStep.FEATURES:
          // 驗證特色與描述
          validData = await trigger(['features', 'story', 'environment.surroundings']);
          break;
        case FormStep.PREVIEW:
          // 預覽步驟會檢查整個表單
          validData = await trigger();
          break;
      }

      // 更新完成狀態
      const newCompletedSteps = [...completedSteps];
      newCompletedSteps[step] = !!validData;
      setCompletedSteps(newCompletedSteps);

      return { isValid: true, data: validData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          // 處理錯誤路徑
          const path = err.path.join('.');
          formattedErrors[path] = err.message;

          // 特殊處理 email 和 mobile 欄位的錯誤
          if (path === 'email' && !formattedErrors['contact.email']) {
            setError('contact.email', {
              type: 'manual',
              message: err.message
            });
          }
          if (path === 'mobile' && !formattedErrors['contact.phone']) {
            setError('contact.phone', {
              type: 'manual',
              message: err.message
            });
          }
        });

        // 顯示第一個錯誤
        const firstErrorKey = Object.keys(formattedErrors)[0];
        if (firstErrorKey) {
          toast.error(`驗證失敗: ${formattedErrors[firstErrorKey]}`);
        }

        return { isValid: false, errors: formattedErrors };
      }

      console.error('驗證錯誤:', error);
      toast.error('表單驗證失敗，請檢查輸入內容');
      return { isValid: false };
    }
  };

  // 切換步驟時驗證當前步驟
  const handleStepChange = async (newStep: FormStep) => {
    // 如果是向前移動，需要先驗證當前步驟
    if (newStep > activeStep) {
      const isCurrentStepValid = await validateStep(activeStep);
      if (!isCurrentStepValid.isValid) {
        return; // 如果當前步驟驗證失敗，則不允許前進
      }
    }

    // 更新活動步驟
    setActiveStep(newStep);
  };

  // 處理下一步
  const handleNext = async () => {
    if (activeStep < STEP_TITLES.length - 1) {
      await handleStepChange(activeStep + 1);
    }
  };

  // 處理上一步
  const handlePrevious = () => {
    if (activeStep > 0) {
      handleStepChange(activeStep - 1);
    }
  };

  // 提交表單
  const onSubmit = async (data: FormData) => {
    try {
      setFormStatus('submitting');

      // 確保頂層欄位包含必要數據
      if (data.contact?.email && !data.email) {
        data.email = data.contact.email;
      }

      if (data.contact?.phone && !data.mobile) {
        data.mobile = data.contact.phone;
      }

      console.log('提交表單數據:', data);

      // 發送表單數據到API
      // 這裡模擬API調用
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('表單提交成功', data);

      // 更新狀態為成功
      setFormStatus('success');

      // 清除本地儲存的草稿
      localStorage.removeItem('hostRegistrationDraft');

    } catch (error) {
      console.error('提交表單失敗', error);
      setFormStatus('error');
    }
  };

  // 渲染頂部步驟導航
  const renderStepNav = () => {
    return (
      <div className="pb-4">
        <Tab.Group selectedIndex={activeStep} onChange={(index) => handleStepChange(index as FormStep)}>
          <Tab.List className="flex space-x-1 rounded-xl bg-primary-100 p-1">
            {STEP_TITLES.map((title, index) => (
              <Tab
                key={index}
                className={({ selected }) =>
                  `relative w-full rounded-lg py-2.5 text-sm font-medium leading-5
                  ${
                    completedSteps[index]
                      ? 'text-primary-700 hover:bg-white/[0.12] hover:text-primary-800'
                      : selected
                      ? 'bg-white shadow text-primary-700'
                      : 'text-gray-500 hover:bg-white/[0.12] hover:text-primary-600'
                  }
                  transition-all duration-100
                  ${index < activeStep ? 'cursor-pointer' : ''}`
                }
                disabled={index > activeStep && !completedSteps[index - 1]}
              >
                <div className="flex items-center justify-center">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full mr-2 bg-primary-100 text-primary-800">
                    {completedSteps[index] ? (
                      <CheckCircleIcon className="w-5 h-5" />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <span className="hidden sm:inline">{title}</span>
                </div>
              </Tab>
            ))}
          </Tab.List>
        </Tab.Group>
      </div>
    );
  };

  // 渲染表單步驟
  const renderFormSteps = () => {
    switch (activeStep) {
      case FormStep.BASIC_INFO:
        return <BasicInfoStep />;
      case FormStep.LOCATION:
        return <LocationStep />;
      case FormStep.MEDIA_UPLOAD:
        return <MediaUploadStep />;
      case FormStep.CONTACT_INFO:
        return <ContactInfoStep />;
      case FormStep.AMENITIES:
        return <AmenitiesStep />;
      case FormStep.FEATURES:
        return <FeaturesStep />;
      case FormStep.PREVIEW:
        return <PreviewStep />;
      default:
        return <BasicInfoStep />;
    }
  };

  // 渲染表單動作按鈕
  const renderFormActions = () => {
    return (
      <div className="mt-8 pt-5 border-t border-gray-200">
        <div className="flex justify-between">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={activeStep === 0}
            className={`${
              activeStep === 0 ? 'opacity-50 cursor-not-allowed' : ''
            } px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
          >
            上一步
          </button>

          {activeStep < STEP_TITLES.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              下一步
            </button>
          ) : (
            <button
              type="submit"
              disabled={formStatus === 'submitting' || !isValid}
              className={`${
                formStatus === 'submitting' || !isValid ? 'opacity-50 cursor-not-allowed' : ''
              } inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
            >
              {formStatus === 'submitting' ? '提交中...' : '提交申請'}
            </button>
          )}
        </div>
      </div>
    );
  };

  // 渲染草稿加載提示
  const renderDraftLoadedNotification = () => {
    if (!showDraftLoaded) return null;

    return (
      <div className="fixed bottom-4 right-4 bg-green-50 p-4 rounded-md shadow-lg border border-green-200 text-green-800 flex items-center">
        <CheckCircleIcon className="h-5 w-5 mr-2 text-green-500" />
        已自動載入您先前的草稿
      </div>
    );
  };

  // 渲染成功或錯誤訊息
  const renderResultMessage = () => {
    if (formStatus === 'success') {
      return (
        <div className="text-center py-10">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <CheckCircleIcon className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">申請已提交</h3>
          <p className="mt-1 text-sm text-gray-500">
            感謝您的申請，我們將審核您提供的資訊，並在審核通過後儘快與您聯繫。
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={() => {
                reset(); // 重置表單
                setActiveStep(FormStep.BASIC_INFO); // 重置步驟
                setCompletedSteps(Array(STEP_TITLES.length).fill(false)); // 重置完成狀態
                setFormStatus('editing'); // 重置表單狀態
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              返回首頁
            </button>
          </div>
        </div>
      );
    }

    if (formStatus === 'error') {
      return (
        <div className="text-center py-10">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <ExclamationCircleIcon className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">提交失敗</h3>
          <p className="mt-1 text-sm text-gray-500">抱歉，提交申請時發生錯誤。請稍後再試。</p>
          <div className="mt-6">
            <button
              type="button"
              onClick={() => setFormStatus('editing')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              重試
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  // 主要渲染函數
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
      {/* 標題 */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          場所註冊申請
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          註冊您的場所，成為我們的合作伙伴，拓展您的業務並接觸更多潛在客戶。
        </p>
      </div>

      {/* 結果訊息（成功或錯誤） */}
      {formStatus === 'success' || formStatus === 'error' ? (
        renderResultMessage()
      ) : (
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* 步驟導航 */}
            {renderStepNav()}

            {/* 表單內容 */}
            <div className="bg-white shadow rounded-lg p-6">
              {renderFormSteps()}

              {/* 表單按鈕 */}
              {renderFormActions()}
            </div>

            {/* 草稿保存提示 */}
            <p className="text-sm text-gray-500 text-center italic">
              您的填寫進度將自動保存為草稿，可隨時返回繼續填寫。
            </p>
          </form>
        </FormProvider>
      )}

      {/* 草稿加載通知 */}
      {renderDraftLoadedNotification()}
    </div>
  );
};

export default HostRegistrationForm;