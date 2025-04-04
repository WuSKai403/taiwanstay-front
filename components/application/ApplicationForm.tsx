import React, { useState, useEffect, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CldUploadWidget } from 'next-cloudinary';
import Image from 'next/image';
import type { CloudinaryUploadWidgetResults, CloudinaryUploadWidgetInfo } from 'next-cloudinary';
import {
  getUploadPreset,
  getUploadFolder,
} from '@/lib/cloudinary/config';
import {
  getUploadParams,
  convertToImageResource
} from '@/lib/cloudinary/utils';
import type { CloudinaryImageResource } from '@/lib/cloudinary/types';
import {
  applicationFormSchema,
  type ApplicationFormData,
  type MonthSelection,
  type TimeSlot
} from '@/lib/schemas/application';
import { useQuery } from '@tanstack/react-query';
import { timeSlotSchema } from '@/lib/schemas/application';
import { formatYearMonth } from '@/lib/utils/dateUtils';

// 引入步驟組件
import {
  BasicInfoStep,
  PersonalInfoStep,
  WorkCapabilityStep,
  ExpectationsStep,
  PhotoUploadStep,
  FinalConfirmationStep
} from './steps';
import type { BasicInfoStepRef } from './steps/BasicInfoStep';

// 引入表單控制器組件
import FormStepController from '../ui/FormStepController';

interface TravelingWith {
  partner: boolean;
  children: boolean;
  pets: boolean;
  details: string;
}

interface FormStep {
  title: string;
  description: string;
  fields: string[];
  isValid: (data: ApplicationFormData) => boolean;
}

const formSteps: FormStep[] = [
  {
    title: '基本資訊',
    description: '請選擇您想要申請的時段和停留時間',
    fields: ['timeSlotId', 'startMonth', 'endMonth', 'duration', 'drivingLicense'],
    isValid: (data) => Boolean(data.startMonth && data.endMonth && data.duration >= 1)
  },
  {
    title: '個人資訊',
    description: '請告訴我們更多關於您的資訊',
    fields: ['languages', 'dietaryRestrictions', 'specialRequirements', 'allergies', 'nationality', 'visaType'],
    isValid: (data) => data.languages.length > 0 && Boolean(data.nationality)
  },
  {
    title: '工作能力',
    description: '請分享您的相關經驗和技能',
    fields: ['workExperience', 'skills', 'physicalCondition', 'physicalStrength', 'certifications'],
    isValid: (data) => true
  },
  {
    title: '期望與動機',
    description: '請告訴我們您的學習目標和期望',
    fields: ['motivation', 'learningGoals', 'accommodationNeeds', 'contribution', 'adaptabilityRatings'],
    isValid: (data) => Boolean(data.motivation && data.motivation.length >= 100)
  },
  {
    title: '照片上傳',
    description: '上傳相關照片（最多 5 張）',
    fields: ['photos', 'photoDescriptions', 'videoIntroduction'],
    isValid: (data) => data.photos.length > 0 && data.photos.length <= 5
  },
  {
    title: '最終確認',
    description: '請確認所有資訊並提交申請',
    fields: ['message', 'additionalNotes', 'sourceChannel', 'termsAgreed'],
    isValid: (data) => Boolean(data.message && data.message.length >= 50 && data.termsAgreed)
  }
];

interface Props {
  opportunity: {
    id: string;
    timeSlots?: TimeSlot[];
  };
  onSubmit: (data: ApplicationFormData) => Promise<void>;
  initialData?: Partial<ApplicationFormData>;
}

const ApplicationForm: React.FC<Props> = ({ opportunity, onSubmit, initialData }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedMonths, setSelectedMonths] = useState<MonthSelection[]>([]);
  const [isDraft, setIsDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const basicInfoStepRef = useRef<BasicInfoStepRef>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isDirty },
    trigger
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: {
      message: '',
      startMonth: '',
      endMonth: '',
      duration: 7,
      timeSlotId: opportunity.timeSlots && opportunity.timeSlots.length > 0
        ? opportunity.timeSlots[0].id
        : undefined,
      availableMonths: [],
      workExperience: [],
      physicalCondition: '',
      skills: '',
      preferredWorkHours: '',
      accommodationNeeds: '',
      culturalInterests: [],
      learningGoals: [],
      travelingWith: {
        partner: false,
        children: false,
        pets: false,
        details: ''
      },
      specialRequirements: '',
      dietaryRestrictions: {
        type: [],
        otherDetails: '',
        vegetarianType: ''
      },
      languages: [],
      relevantExperience: '',
      motivation: '',
      photos: [],
      drivingLicense: {
        motorcycle: false,
        car: false,
        none: false,
        other: {
          enabled: false,
          details: ''
        }
      },
      allergies: '',
      nationality: '',
      visaType: '',
      physicalStrength: 3,
      certifications: '',
      workawayExperiences: [],
      expectedSkills: [],
      contribution: '',
      adaptabilityRatings: {
        environmentAdaptation: 3,
        teamwork: 3,
        problemSolving: 3,
        independentWork: 3,
        stressManagement: 3
      },
      photoDescriptions: [],
      videoIntroduction: '',
      additionalNotes: '',
      sourceChannel: '',
      termsAgreed: false,
      ...initialData
    }
  });

  const { fields: workExperienceFields, append: appendWorkExperience, remove: removeWorkExperience } = useFieldArray({
    control,
    name: 'workExperience'
  });

  const { fields: languageFields, append: appendLanguage, remove: removeLanguage } = useFieldArray({
    control,
    name: 'languages'
  });

  // 使用 React Query 獲取並驗證時段資料
  const { data: validatedTimeSlots, error: timeSlotError } = useQuery({
    queryKey: ['timeSlots', opportunity.id],
    queryFn: async () => {
      if (!opportunity.timeSlots) return [];

      // 使用 Zod 驗證每個時段
      const validatedSlots = opportunity.timeSlots.map(slot => {
        try {
          return timeSlotSchema.parse(slot);
        } catch (error) {
          console.error('Time slot validation error:', error);
          return null;
        }
      }).filter((slot): slot is TimeSlot => slot !== null);

      return validatedSlots;
    },
    initialData: [],
  });

  // 初始化月份選擇
  useEffect(() => {
    if (!opportunity?.timeSlots?.length) {
      console.warn('No time slots available');
      return;
    }

    // 從時間段中獲取所有可用月份
    const allMonths: MonthSelection[] = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    // 生成未來 24 個月的月份選項
    for (let i = 0; i < 24; i++) {
      const date = new Date(currentYear, currentMonth + i);
      const year = date.getFullYear();
      const month = date.getMonth();

      // 檢查該月份是否在任何時間段內
        const isAvailable = opportunity.timeSlots.some(slot => {
        const slotStart = new Date(slot.startMonth);
        const slotEnd = new Date(slot.endMonth);
        const monthDate = new Date(year, month);
        return monthDate >= slotStart && monthDate <= slotEnd;
      });

      allMonths.push({
        year,
        month,
          isSelected: false,
        isAvailable,
        yearMonthStr: formatYearMonth(year, month)
        });
      }

    setSelectedMonths(allMonths);

      // 如果有草稿數據，更新月份選擇
      const savedDraft = localStorage.getItem(`application_draft_${opportunity.id}`);
      if (savedDraft) {
        try {
          const parsedDraft = JSON.parse(savedDraft);
        if (parsedDraft.availableMonths?.length > 0) {
          const updatedMonths = allMonths.map(month => ({
                ...month,
            isSelected: parsedDraft.availableMonths.includes(month.yearMonthStr) && month.isAvailable
          }));
            setSelectedMonths(updatedMonths);
          }
        } catch (e) {
          console.error('無法載入草稿月份選擇:', e);
        }
      }
  }, [opportunity?.timeSlots, opportunity.id]);

  // 保存草稿到本地存儲
    const saveDraft = () => {
    const data = watch();
    localStorage.setItem(`application_draft_${opportunity.id}`, JSON.stringify(data));
    };

  // 處理月份選擇
  const handleMonthSelect = (index: number) => {
    // 只有可用的月份可以被選擇
    if (!selectedMonths[index].isAvailable) return;

    // 複製當前選擇狀態
    const updatedMonths = [...selectedMonths];

    // 找出當前選中的所有月份的索引
    const selectedIndices = updatedMonths
      .map((month, i) => month.isSelected ? i : -1)
      .filter(i => i !== -1);

    // 如果沒有選中的月份，或者點擊的是已選中的月份
    if (selectedIndices.length === 0 || updatedMonths[index].isSelected) {
      // 直接切換當前月份的選中狀態
      updatedMonths[index] = {
        ...updatedMonths[index],
        isSelected: !updatedMonths[index].isSelected
      };
    } else {
      // 找出最小和最大索引
      const minIndex = Math.min(...selectedIndices);
      const maxIndex = Math.max(...selectedIndices);

      // 如果點擊的月份在當前選擇範圍外
      if (index < minIndex || index > maxIndex) {
        // 計算新的範圍
        const newMinIndex = Math.min(index, minIndex);
        const newMaxIndex = Math.max(index, maxIndex);

        // 更新所有在範圍內的可用月份為選中狀態
        for (let i = newMinIndex; i <= newMaxIndex; i++) {
          if (updatedMonths[i].isAvailable) {
            updatedMonths[i] = {
              ...updatedMonths[i],
              isSelected: true
            };
          }
        }
      } else {
        // 如果點擊的月份在當前選擇範圍內，則清除所有選擇並選中當前月份
        updatedMonths.forEach((month, i) => {
          updatedMonths[i] = {
              ...month,
            isSelected: i === index && month.isAvailable
          };
        });
      }
    }

    // 更新選擇狀態
    setSelectedMonths(updatedMonths);

    // 找出選中月份的開始和結束月份
    const selectedMonthsList = updatedMonths
      .filter(month => month.isSelected)
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      });

    if (selectedMonthsList.length > 0) {
      const firstMonth = selectedMonthsList[0];
      const lastMonth = selectedMonthsList[selectedMonthsList.length - 1];

      // 設置開始和結束月份
      setValue('startMonth', firstMonth.yearMonthStr);
      setValue('endMonth', lastMonth.yearMonthStr);

      // 更新 availableMonths 欄位
      const availableMonths = selectedMonthsList
        .map(m => m.yearMonthStr)
        .filter((str): str is string => str !== undefined);
      setValue('availableMonths', availableMonths);

      // 計算預設停留天數 (以30天為一個月)
      const monthsDiff = (lastMonth.year - firstMonth.year) * 12 + (lastMonth.month - firstMonth.month) + 1;
      setValue('duration', monthsDiff * 30);
    } else {
      // 如果沒有選中任何月份，則清除相關欄位
      setValue('startMonth', '');
      setValue('endMonth', '');
      setValue('availableMonths', []);
      setValue('duration', 7);
    }

    // 保存草稿
    saveDraft();
  };

  // 處理照片上傳
  const handlePhotoUpload = (result: CloudinaryUploadWidgetResults) => {
    if (result.event === 'success' && result.info) {
      const photo = convertToImageResource(result.info as CloudinaryUploadWidgetInfo);
      const currentPhotos = watch('photos');
      if (currentPhotos.length < 5) {
        setValue('photos', [...currentPhotos, photo]);
      }
    }
  };

  // 處理照片移除
  const handleRemovePhoto = (index: number) => {
    const currentPhotos = watch('photos');
    setValue('photos', currentPhotos.filter((_: unknown, i: number) => i !== index));
  };

  // 處理下一步
  const handleNext = async () => {
    const currentStepFields = formSteps[currentStep].fields;
    const isValid = await trigger(currentStepFields as any);

    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, formSteps.length - 1));
    }
  };

  // 處理上一步
  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  // 處理表單提交
  const onSubmitForm = async (data: ApplicationFormData) => {
    try {
      console.log('開始提交表單', data);

      // 在提交前檢查所有表單欄位的驗證狀態
      const formIsValid = await trigger();
      console.log('整個表單驗證狀態:', formIsValid, '所有錯誤:', errors);

      if (!formIsValid) {
        // 如果表單有錯誤，找出首個有錯誤的步驟並跳轉到該步驟
        findErrorStepAndNavigate();
        return;
      }

      setIsSubmitting(true);
      setError(undefined);
      await onSubmit(data);
      console.log('表單提交成功');
      localStorage.removeItem(`application_draft_${opportunity.id}`);
    } catch (err) {
      console.error('表單提交失敗:', err);
      setError(err instanceof Error ? err.message : '提交失敗，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 尋找有錯誤的表單步驟並導航至該步驟
  const findErrorStepAndNavigate = () => {
    // 取得所有的錯誤欄位名稱
    const errorFieldNames = Object.keys(errors);
    console.log('錯誤欄位名稱列表:', errorFieldNames);

    if (errorFieldNames.length === 0) return;

    // 遍歷所有步驟，找出第一個包含錯誤欄位的步驟
    for (let stepIndex = 0; stepIndex < formSteps.length; stepIndex++) {
      const stepFields = formSteps[stepIndex].fields;
      const hasError = errorFieldNames.some(errorField => stepFields.includes(errorField));

      if (hasError) {
        console.log(`發現錯誤在第 ${stepIndex + 1} 步 (${formSteps[stepIndex].title})，正在切換到該步驟`);
        setCurrentStep(stepIndex);

        // 添加延遲以確保步驟切換後再滾動到錯誤欄位
        setTimeout(() => {
          // 找出步驟中的第一個錯誤欄位
          const firstErrorInStep = stepFields.find(field => errorFieldNames.includes(field));

          if (firstErrorInStep) {
            // 找到包含錯誤欄位的元素
            const errorElement = document.querySelector(`[name="${firstErrorInStep}"], #${firstErrorInStep}`);

            if (errorElement) {
              // 添加高亮樣式
              errorElement.classList.add('error-highlight');

              // 滾動到錯誤欄位
              errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

              // 嘗試聚焦元素
              try {
                (errorElement as HTMLElement).focus();
              } catch (e) {
                console.log('無法聚焦元素', e);
              }

              // 移除高亮效果（延遲 3 秒）
              setTimeout(() => {
                errorElement.classList.remove('error-highlight');
              }, 3000);
            }
          }
        }, 100);

        return;
      }
    }
  };

  // 渲染當前步驟內容
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <BasicInfoStep
            ref={basicInfoStepRef}
            register={register}
            control={control}
            watch={watch}
            setValue={setValue}
            errors={errors}
            selectedMonths={selectedMonths}
            setSelectedMonths={setSelectedMonths}
            opportunity={opportunity}
          />
        );
      case 1:
        return (
          <PersonalInfoStep
            register={register}
            control={control}
            watch={watch}
            setValue={setValue}
            errors={errors}
            languageFields={languageFields}
            appendLanguage={appendLanguage}
            removeLanguage={removeLanguage}
          />
        );
      case 2:
        return (
          <WorkCapabilityStep
            register={register}
            control={control}
            watch={watch}
            setValue={setValue}
            errors={errors}
            workExperienceFields={workExperienceFields}
            appendWorkExperience={appendWorkExperience}
            removeWorkExperience={removeWorkExperience}
          />
        );
      case 3:
        return (
          <ExpectationsStep
            register={register}
            control={control}
            watch={watch}
            setValue={setValue}
            errors={errors}
          />
        );
      case 4:
        return (
          <PhotoUploadStep
            register={register}
            control={control}
            watch={watch}
            setValue={setValue}
            errors={errors}
          />
        );
      case 5:
        return (
          <FinalConfirmationStep
            register={register}
            watch={watch}
            errors={errors}
          />
        );
      default:
        return null;
    }
  };

  // 獲取當前步驟的欄位名稱
  const getCurrentStepFieldNames = (): string[] => {
    return formSteps[currentStep].fields;
  };

  // 檢查當前步驟是否有效
  const isCurrentStepValid = (): boolean => {
    return formSteps[currentStep].isValid(watch());
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      {/* 步驟導航 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
        {formSteps.map((step, index) => (
            <div
              key={index}
              className={`flex-1 ${
                index < formSteps.length - 1 ? 'relative' : ''
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  index < currentStep
                    ? 'bg-primary-600 text-white'
                    : index === currentStep
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {index < currentStep ? (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              {index < formSteps.length - 1 && (
                <div
                  className={`absolute top-5 w-full h-0.5 ${
                    index < currentStep ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                  style={{ left: '50%' }}
                ></div>
              )}
              <div className="mt-2 text-xs text-center hidden md:block">
                {step.title}
              </div>
            </div>
          ))}
            </div>
      </div>

      {/* 當前步驟標題和描述 */}
        <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">
          {formSteps[currentStep].title}
        </h2>
        <p className="text-gray-600">
          {formSteps[currentStep].description}
        </p>
        </div>

      {/* 表單內容 */}
      <form onSubmit={handleSubmit(onSubmitForm)}>
        {renderStepContent()}

      {/* 錯誤訊息 */}
      {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

        {/* 使用表單步驟控制器 */}
        <FormStepController<ApplicationFormData>
          currentStep={currentStep}
          totalSteps={formSteps.length}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onSaveDraft={() => setIsDraft(true)}
          onSubmit={() => {
            console.log('FormStepController提交按鈕被點擊');
            console.log('當前步驟:', currentStep, '是否最後一步:', currentStep === formSteps.length - 1);
            console.log('當前步驟是否有效:', isCurrentStepValid());
            handleSubmit(onSubmitForm)();
          }}
          isLastStep={currentStep === formSteps.length - 1}
          isValid={isCurrentStepValid()}
          isSubmitting={isSubmitting}
          trigger={trigger}
          errors={errors}
          stepFieldNames={getCurrentStepFieldNames()}
          customValidation={currentStep === 0 ? () => basicInfoStepRef.current?.validateMinimumStay() ?? true : undefined}
        />
        </form>
      </div>
  );
};

export default ApplicationForm;