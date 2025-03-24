import React, { useState, useEffect } from 'react';
import { CldUploadWidget } from 'next-cloudinary';
import Image from 'next/image';
import type { CloudinaryUploadWidgetResults } from 'next-cloudinary';
import {
  CloudinaryImageResource
} from '@/lib/cloudinary/types';
import {
  getUploadPreset,
  getUploadFolder,
} from '@/lib/cloudinary/config';
import {
  getUploadParams,
  convertToImageResource
} from '@/lib/cloudinary/utils';

// 定義月份接口
interface MonthSelection {
  year: number;
  month: number;
  isSelected: boolean;
  isAvailable: boolean;
}

interface TravelingWith {
  partner: boolean;
  children: boolean;
  pets: boolean;
  details: string;
}

interface TimeSlot {
  id: string;
  startDate: string;
  endDate: string;
  isFull: boolean;
}

interface ApplicationFormData {
  message: string;
  startDate: string;
  endDate?: string;
  duration: number;
  timeSlotId?: string;
  workExperience: Array<{
    position: string;
    company: string;
    duration: string;
    description: string;
  }>;
  physicalCondition: string;
  skills: string[];
  preferredWorkHours: string;
  accommodationNeeds: string;
  culturalInterests: string[];
  learningGoals: string[];
  travelingWith: TravelingWith;
  specialRequirements: string;
  dietaryRestrictions: {
    type: string[];
    otherDetails: string;
    vegetarianType: string;
  };
  languages: Array<{
    language: string;
    level: string;
  }>;
  relevantExperience?: string;
  motivation?: string;
  photos: CloudinaryImageResource[];
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
    fields: ['timeSlotId', 'startDate', 'endDate', 'duration'],
    isValid: (data) => Boolean(data.startDate && data.endDate && data.duration >= 1)
  },
  {
    title: '個人資訊',
    description: '請告訴我們更多關於您的資訊',
    fields: ['travelingWith', 'languages', 'dietaryRestrictions', 'specialRequirements'],
    isValid: (data) => data.languages.length > 0
  },
  {
    title: '工作能力',
    description: '請分享您的相關經驗和技能',
    fields: ['workExperience', 'skills', 'physicalCondition', 'preferredWorkHours'],
    isValid: (data) => Boolean(data.physicalCondition)
  },
  {
    title: '期望與動機',
    description: '請告訴我們您的學習目標和期望',
    fields: ['accommodationNeeds', 'culturalInterests', 'learningGoals', 'motivation'],
    isValid: (data) => Boolean(data.motivation)
  },
  {
    title: '照片上傳',
    description: '上傳相關照片（最多 5 張）',
    fields: ['photos'],
    isValid: (data) => data.photos.length > 0 && data.photos.length <= 5
  },
  {
    title: '最終確認',
    description: '請確認所有資訊並提交申請',
    fields: ['message'],
    isValid: (data) => Boolean(data.message && data.message.length >= 50)
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
  const [formData, setFormData] = useState<ApplicationFormData>({
    message: '',
    startDate: '',
    endDate: '',
    duration: 7,
    timeSlotId: opportunity.timeSlots && opportunity.timeSlots.length > 0
      ? opportunity.timeSlots[0].id
      : undefined,
    workExperience: [],
    physicalCondition: '',
    skills: [],
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
    photos: []
  });
  const [isDraft, setIsDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // 初始化月份選擇
  useEffect(() => {
    if (opportunity.timeSlots && opportunity.timeSlots.length > 0) {
      // 找出所有時段的最早和最晚日期
      const allStartDates = opportunity.timeSlots.map(slot => new Date(slot.startDate));
      const allEndDates = opportunity.timeSlots.map(slot => new Date(slot.endDate));
      const startDate = new Date(Math.min(...allStartDates.map(date => date.getTime())));
      const endDate = new Date(Math.max(...allEndDates.map(date => date.getTime())));

      const months: MonthSelection[] = [];
      let currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        // 檢查此月份是否有可用時段
        const monthDate = new Date(currentDate);
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

        const isAvailable = opportunity.timeSlots.some(slot => {
          const slotStart = new Date(slot.startDate);
          const slotEnd = new Date(slot.endDate);
          // 檢查時段是否與當前月份有重疊
          return (
            (slotStart <= monthEnd && slotEnd >= monthStart)
          );
        });

        months.push({
          year: currentDate.getFullYear(),
          month: currentDate.getMonth(),
          isSelected: false,
          isAvailable
        });
        currentDate.setMonth(currentDate.getMonth() + 1);
      }

      setSelectedMonths(months);

      // 如果有草稿數據，立即更新月份選擇
      const savedDraft = localStorage.getItem(`application_draft_${opportunity.id}`);
      if (savedDraft) {
        try {
          const parsedDraft = JSON.parse(savedDraft);
          if (parsedDraft.startDate && parsedDraft.endDate) {
            const draftStart = new Date(parsedDraft.startDate);
            const draftEnd = new Date(parsedDraft.endDate);

            const updatedMonths = months.map(month => {
              const monthDate = new Date(month.year, month.month);
              const isInRange = monthDate >= new Date(draftStart.getFullYear(), draftStart.getMonth()) &&
                              monthDate <= new Date(draftEnd.getFullYear(), draftEnd.getMonth());

              return {
                ...month,
                isSelected: isInRange && month.isAvailable
              };
            });

            setSelectedMonths(updatedMonths);
          }
        } catch (e) {
          console.error('無法載入草稿月份選擇:', e);
        }
      }
    }
  }, [opportunity.timeSlots, opportunity.id]);

  // 自動儲存草稿
  useEffect(() => {
    const saveDraft = () => {
      localStorage.setItem(`application_draft_${opportunity.id}`, JSON.stringify(formData));
      setIsDraft(true);
    };

    const draftTimer = setTimeout(saveDraft, 1000);
    return () => clearTimeout(draftTimer);
  }, [formData, opportunity.id]);

  // 處理月份選擇
  const handleMonthSelect = (index: number) => {
    const newSelectedMonths = [...selectedMonths];
    const currentMonth = newSelectedMonths[index];

    // 如果月份不可用，直接返回
    if (!currentMonth.isAvailable) {
      return;
    }

    // 如果當前月份已選中，則取消選中該月份及之後的月份
    if (currentMonth.isSelected) {
      for (let i = index; i < newSelectedMonths.length; i++) {
        newSelectedMonths[i].isSelected = false;
      }
    } else {
      // 找出所有已選中的月份索引
      const selectedIndices = newSelectedMonths
        .map((month, i) => month.isSelected ? i : -1)
        .filter(i => i !== -1);

      if (selectedIndices.length > 0) {
        const minSelected = Math.min(...selectedIndices);
        const maxSelected = Math.max(...selectedIndices);

        // 判斷新選擇的月份是在已選範圍的前面還是後面
        if (index < minSelected) {
          // 如果在前面，檢查中間月份是否都可用
          const allAvailable = newSelectedMonths
            .slice(index, minSelected + 1)
            .every(month => month.isAvailable);

          if (allAvailable) {
            // 填充從新選擇的月份到最小已選月份之間的所有月份
            for (let i = index; i <= minSelected; i++) {
              newSelectedMonths[i].isSelected = true;
            }
          }
        } else if (index > maxSelected) {
          // 如果在後面，檢查中間月份是否都可用
          const allAvailable = newSelectedMonths
            .slice(maxSelected, index + 1)
            .every(month => month.isAvailable);

          if (allAvailable) {
            // 填充從最大已選月份到新選擇的月份之間的所有月份
            for (let i = maxSelected; i <= index; i++) {
              newSelectedMonths[i].isSelected = true;
            }
          }
        } else {
          // 如果在中間，則從最前面填充到所選月份
          // 先清空所有選擇
          newSelectedMonths.forEach(month => month.isSelected = false);

          // 檢查從頭到所選月份是否都可用
          const allAvailable = newSelectedMonths
            .slice(0, index + 1)
            .every(month => month.isAvailable);

          if (allAvailable) {
            // 填充從頭到所選月份的所有月份
            for (let i = 0; i <= index; i++) {
              newSelectedMonths[i].isSelected = true;
            }
          } else {
            // 如果有不可用的月份，只選擇當前月份
            currentMonth.isSelected = true;
          }
        }
      } else {
        // 如果是第一次選擇，直接選中
        currentMonth.isSelected = true;
      }
    }

    setSelectedMonths(newSelectedMonths);

    // 更新日期範圍
    const selectedMonthsArray = newSelectedMonths.filter(m => m.isSelected);
    if (selectedMonthsArray.length > 0) {
      const firstMonth = selectedMonthsArray[0];
      const lastMonth = selectedMonthsArray[selectedMonthsArray.length - 1];

      // 計算開始日期：選中的第一個月的第一天
      const startDate = new Date(firstMonth.year, firstMonth.month, 1);

      // 計算結束日期：選中的最後一個月的最後一天
      const endDate = new Date(lastMonth.year, lastMonth.month + 1, 0);

      // 計算實際天數（包含開始日和結束日）
      const durationInDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      // 格式化日期為 YYYY-MM-DD
      const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      setFormData(prev => ({
        ...prev,
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        duration: durationInDays
      }));
    } else {
      // 如果沒有選中的月份，清空日期相關資料
      setFormData(prev => ({
        ...prev,
        startDate: '',
        endDate: '',
        duration: 0
      }));
    }
  };

  const handlePhotoUpload = (result: CloudinaryUploadWidgetResults) => {
    if (result.event === 'success' && result.info && typeof result.info !== 'string') {
      const imageResource = convertToImageResource(result.info);
      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, imageResource].slice(0, 5)
      }));
    }
  };

  const handleRemovePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const handleNext = () => {
    const errors = validateStep(currentStep);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors([]);
    if (currentStep < formSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setValidationErrors([]);
      setCurrentStep(prev => prev - 1);
    }
  };

  // 驗證當前步驟
  const validateStep = (step: number): string[] => {
    const errors: string[] = [];
    const currentStepData = formSteps[step];

    switch (step) {
      case 0: // 基本資訊
        if (!formData.startDate || !formData.endDate || formData.duration < 1) {
          errors.push("請選擇有效的日期範圍");
        }
        break;

      case 1: // 個人資訊
        if (formData.languages.length === 0) {
          errors.push("請至少選擇一種語言能力");
        }
        break;

      case 2: // 工作能力
        if (!formData.physicalCondition) {
          errors.push("請填寫體能狀況");
        }
        break;

      case 3: // 期望與動機
        if (!formData.motivation) {
          errors.push("請填寫申請動機");
        }
        break;

      case 4: // 照片上傳
        if (formData.photos.length === 0) {
          errors.push("請至少上傳一張照片");
        } else if (formData.photos.length > 5) {
          errors.push("照片數量不能超過5張");
        }
        break;

      case 5: // 最終確認
        if (!formData.message || formData.message.length < 50) {
          errors.push(`請填寫給主辦方的話，目前字數: ${formData.message.length}/50`);
        }
        break;
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors([]);
    setError(undefined);

    // 檢查所有步驟
    let allErrors: string[] = [];
    for (let i = 0; i < formSteps.length; i++) {
      const stepErrors = validateStep(i);
      if (stepErrors.length > 0) {
        allErrors = [...allErrors, `第${i + 1}步 (${formSteps[i].title}):`];
        allErrors = [...allErrors, ...stepErrors.map(err => `  - ${err}`)];
      }
    }

    if (allErrors.length > 0) {
      setValidationErrors(allErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(formData);
      // 清除草稿
      localStorage.removeItem(`application_draft_${opportunity.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交申請時發生錯誤');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStepData = formSteps[currentStep];
  const isCurrentStepValid = currentStepData.isValid(formData);

  const renderPhotoPreview = (photo: CloudinaryImageResource, index: number) => (
    <div key={photo.public_id} className="relative">
      <div className="relative w-32 h-32">
        <Image
          src={photo.secure_url as string}
          alt={`上傳的照片 ${index + 1}`}
          fill
          className="rounded-lg object-cover"
          sizes="128px"
        />
      </div>
      <button
        type="button"
        onClick={() => handleRemovePhoto(index)}
        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* 進度指示器 */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          {formSteps.map((step, index) => (
            <div
              key={step.title}
              className={`flex-1 ${index !== formSteps.length - 1 ? 'relative' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  index < currentStep
                    ? 'bg-green-500 text-white'
                    : index === currentStep
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {index < currentStep ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              {index !== formSteps.length - 1 && (
                <div
                  className={`absolute top-4 -right-1/2 h-0.5 w-full ${
                    index < currentStep ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
              <div className="mt-2 text-xs text-center">{step.title}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 表單內容 */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold">{currentStepData.title}</h2>
          <p className="text-gray-600 mt-1">{currentStepData.description}</p>
        </div>

        {isDraft && (
          <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-md">
            <p className="text-sm">已自動儲存草稿</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* 根據當前步驟顯示相應的表單欄位 */}
          {currentStep === 0 && (
            <div className="space-y-6">
              {/* 月份選擇 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  選擇月份 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                  {selectedMonths.map((month, index) => (
                    <button
                      key={`${month.year}-${month.month}`}
                      type="button"
                      onClick={() => handleMonthSelect(index)}
                      disabled={!month.isAvailable}
                      className={`
                        p-2 rounded-md text-sm font-medium
                        ${month.isSelected
                          ? 'bg-primary-600 text-white'
                          : month.isAvailable
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }
                        transition-colors duration-200
                      `}
                    >
                      {month.year}年{month.month + 1}月
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  請選擇連續的月份範圍
                </p>
              </div>

              {/* 日期顯示 */}
              {formData.startDate && formData.endDate && (
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">已選擇的日期範圍</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">開始日期</p>
                      <p className="font-medium">{new Date(formData.startDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">結束日期</p>
                      <p className="font-medium">{new Date(formData.endDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    停留時間：{formData.duration} 天
                  </p>
                </div>
              )}
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-4">
              {/* 語言能力 */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  語言能力 <span className="text-red-500">*</span>
                </label>
                <div className="mt-2 space-y-2">
                  {['中文', '英文', '日文', '韓文', '法文', '德文', '西班牙文'].map(lang => (
                    <div key={lang} className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.languages.some(l => l.language === lang)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                languages: [...prev.languages, { language: lang, level: 'basic' }]
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                languages: prev.languages.filter(l => l.language !== lang)
                              }));
                            }
                          }}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 text-sm text-gray-700">{lang}</label>
                      </div>
                      {formData.languages.some(l => l.language === lang) && (
                        <select
                          value={formData.languages.find(l => l.language === lang)?.level}
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              languages: prev.languages.map(l =>
                                l.language === lang ? { ...l, level: e.target.value } : l
                              )
                            }));
                          }}
                          className="mt-1 block w-32 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        >
                          <option value="native">母語</option>
                          <option value="fluent">流利</option>
                          <option value="intermediate">中等</option>
                          <option value="basic">基礎</option>
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 飲食限制 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">飲食限制</label>
                <div className="space-y-4">
                  {/* 主要飲食限制選項 */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: '素食', label: '素食' },
                      { value: '不吃牛肉', label: '不吃牛肉' },
                      { value: '不吃豬肉', label: '不吃豬肉' },
                      { value: '不吃海鮮', label: '不吃海鮮' },
                      { value: '其他', label: '其他' }
                    ].map(option => (
                      <div key={option.value} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.dietaryRestrictions?.type?.includes(option.value) || false}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                dietaryRestrictions: {
                                  ...prev.dietaryRestrictions,
                                  type: [...(prev.dietaryRestrictions?.type || []), option.value]
                                }
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                dietaryRestrictions: {
                                  ...prev.dietaryRestrictions,
                                  type: prev.dietaryRestrictions?.type?.filter(t => t !== option.value) || [],
                                  ...(option.value === '素食' ? { vegetarianType: '' } : {})
                                }
                              }));
                            }
                          }}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 text-sm text-gray-700">{option.label}</label>
                      </div>
                    ))}
                  </div>

                  {/* 素食類型選擇 */}
                  {formData.dietaryRestrictions?.type?.includes('素食') && (
                    <div className="ml-6 border-l-2 border-gray-200 pl-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        請選擇素食類型
                      </label>
                      <div className="space-y-2">
                        {[
                          { value: '全素', label: '全素（純素）' },
                          { value: '蛋奶素', label: '蛋奶素' },
                          { value: '蛋素', label: '蛋素（不食用奶製品）' },
                          { value: '奶素', label: '奶素（不食用蛋）' }
                        ].map(option => (
                          <div key={option.value} className="flex items-center">
                            <input
                              type="radio"
                              name="vegetarianType"
                              value={option.value}
                              checked={formData.dietaryRestrictions?.vegetarianType === option.value}
                              onChange={(e) => {
                                setFormData(prev => ({
                                  ...prev,
                                  dietaryRestrictions: {
                                    ...prev.dietaryRestrictions,
                                    vegetarianType: e.target.value
                                  }
                                }));
                              }}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                            />
                            <label className="ml-2 text-sm text-gray-700">{option.label}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 其他飲食限制說明 */}
                  {formData.dietaryRestrictions?.type?.includes('其他') && (
                    <div className="ml-6 border-l-2 border-gray-200 pl-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        請說明其他飲食限制
                      </label>
                      <textarea
                        value={formData.dietaryRestrictions?.otherDetails || ''}
                        onChange={(e) => {
                          if (e.target.value.length <= 200) {
                            setFormData(prev => ({
                              ...prev,
                              dietaryRestrictions: {
                                ...prev.dietaryRestrictions,
                                otherDetails: e.target.value
                              }
                            }));
                          }
                        }}
                        placeholder="請描述您的其他飲食限制（最多 200 字）"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        rows={3}
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        還可以輸入 {200 - (formData.dietaryRestrictions?.otherDetails?.length || 0)} 字
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              {/* 工作經驗 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  工作經驗
                </label>
                <div className="space-y-4">
                  {formData.workExperience.map((exp, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-md space-y-3">
                      <div className="flex justify-between">
                        <h4 className="text-sm font-medium">工作經驗 #{index + 1}</h4>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              workExperience: prev.workExperience.filter((_, i) => i !== index)
                            }));
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          刪除
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-700">職位</label>
                          <input
                            type="text"
                            value={exp.position}
                            onChange={(e) => {
                              const newExp = [...formData.workExperience];
                              newExp[index] = { ...exp, position: e.target.value };
                              setFormData(prev => ({ ...prev, workExperience: newExp }));
                            }}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-700">公司</label>
                          <input
                            type="text"
                            value={exp.company}
                            onChange={(e) => {
                              const newExp = [...formData.workExperience];
                              newExp[index] = { ...exp, company: e.target.value };
                              setFormData(prev => ({ ...prev, workExperience: newExp }));
                            }}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700">工作時間</label>
                        <input
                          type="text"
                          value={exp.duration}
                          placeholder="例如：2020/01 - 2021/12"
                          onChange={(e) => {
                            const newExp = [...formData.workExperience];
                            newExp[index] = { ...exp, duration: e.target.value };
                            setFormData(prev => ({ ...prev, workExperience: newExp }));
                          }}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700">工作內容</label>
                        <textarea
                          value={exp.description}
                          onChange={(e) => {
                            const newExp = [...formData.workExperience];
                            newExp[index] = { ...exp, description: e.target.value };
                            setFormData(prev => ({ ...prev, workExperience: newExp }));
                          }}
                          rows={3}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        workExperience: [
                          ...prev.workExperience,
                          { position: '', company: '', duration: '', description: '' }
                        ]
                      }));
                    }}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    新增工作經驗
                  </button>
                </div>
              </div>

              {/* 體能狀況 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  體能狀況 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.physicalCondition}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      physicalCondition: e.target.value
                    }));
                  }}
                  placeholder="請描述您的體能狀況，例如：是否有特殊健康狀況、運動習慣等"
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>

              {/* 技能 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  技能
                </label>
                <textarea
                  value={formData.skills.join('\n')}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      skills: e.target.value.split('\n').filter(skill => skill.trim() !== '')
                    }));
                  }}
                  placeholder="請描述您的技能和證照（例如：潛水證照、救生員證照、急救證照等），每項技能請換行填寫"
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
                <p className="mt-1 text-sm text-gray-500">
                  請列出您所擁有的相關技能和證照，每項技能請換行填寫
                </p>
              </div>

              {/* 期望工作時數 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  期望工作時數（每週）
                </label>
                <select
                  value={formData.preferredWorkHours}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      preferredWorkHours: e.target.value
                    }));
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="">請選擇</option>
                  <option value="20">20 小時</option>
                  <option value="30">30 小時</option>
                  <option value="40">40 小時</option>
                  <option value="50">50 小時</option>
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  若機會已有規定工作時數，此欄位可不必填寫
                </p>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              {/* 學習目標 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  學習目標
                </label>
                <div className="space-y-4">
                  <textarea
                    value={formData.learningGoals.join('、')}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        learningGoals: e.target.value ? [e.target.value] : []
                      }));
                    }}
                    placeholder="請描述您希望在這段期間達成的學習目標（例如：學習潛水技巧、提升英語溝通能力等）"
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                  <p className="text-sm text-gray-500">
                    請具體描述您想要學習和達成的目標
                  </p>
                </div>
              </div>

              {/* 文化興趣 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  文化興趣
                </label>
                <div className="space-y-4">
                  <textarea
                    value={formData.culturalInterests.join('、')}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        culturalInterests: e.target.value ? [e.target.value] : []
                      }));
                    }}
                    placeholder="請描述您對當地文化的興趣（例如：對台灣小吃文化感興趣、想了解在地生活方式等）"
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                </div>
              </div>

              {/* 住宿需求 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  住宿需求
                </label>
                <textarea
                  value={formData.accommodationNeeds}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      accommodationNeeds: e.target.value
                    }));
                  }}
                  placeholder="請說明您的住宿需求或偏好（例如：是否需要單人房、是否有特殊設備需求等）"
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>

              {/* 申請動機 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  申請動機 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.motivation}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      motivation: e.target.value
                    }));
                  }}
                  placeholder="請詳細說明您申請這個機會的動機，以及為什麼您認為自己適合這個職位"
                  rows={6}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
                <p className="mt-1 text-sm text-gray-500">
                  請具體說明您的申請動機，這將幫助我們更了解您
                </p>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  上傳照片 <span className="text-red-500">*</span>
                  <span className="text-sm text-gray-500 ml-2">（最多 5 張）</span>
                </label>
                <div className="mt-2">
                  <CldUploadWidget
                    uploadPreset={getUploadPreset(false)}
                    options={getUploadParams(
                      false,
                      getUploadFolder(false, 'applications'),
                      { maxFiles: 1 }
                    )}
                    onSuccess={handlePhotoUpload}
                  >
                    {({ open }) => (
                      <button
                        type="button"
                        onClick={() => open()}
                        disabled={formData.photos.length >= 5}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        上傳照片
                      </button>
                    )}
                  </CldUploadWidget>
                </div>

                {/* 照片預覽 */}
                {formData.photos.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                    {formData.photos.map((photo, index) => renderPhotoPreview(photo, index))}
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-6">
              {/* 基本資訊 */}
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">基本資訊</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">開始日期</p>
                    <p className="mt-1">{new Date(formData.startDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">結束日期</p>
                    <p className="mt-1">{formData.endDate ? new Date(formData.endDate).toLocaleDateString() : '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">停留時間</p>
                    <p className="mt-1">{formData.duration} 天</p>
                  </div>
                </div>
              </div>

              {/* 個人資訊 */}
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">個人資訊</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">語言能力</p>
                    <div className="mt-1">
                      {formData.languages.map((lang, index) => (
                        <span key={index} className="inline-block bg-gray-100 rounded-full px-3 py-1 text-sm mr-2 mb-2">
                          {lang.language}（{lang.level}）
                        </span>
                      ))}
                    </div>
                  </div>
                  {formData.dietaryRestrictions.type.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500">飲食限制</p>
                      <div className="mt-1">
                        {formData.dietaryRestrictions.type.map((type, index) => (
                          <span key={index} className="inline-block bg-gray-100 rounded-full px-3 py-1 text-sm mr-2 mb-2">
                            {type}
                          </span>
                        ))}
                        {formData.dietaryRestrictions.vegetarianType && (
                          <p className="mt-1">素食類型：{formData.dietaryRestrictions.vegetarianType}</p>
                        )}
                        {formData.dietaryRestrictions.otherDetails && (
                          <p className="mt-1">其他說明：{formData.dietaryRestrictions.otherDetails}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 工作能力 */}
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">工作能力</h3>
                <div className="space-y-4">
                  {formData.workExperience.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500">工作經驗</p>
                      <div className="mt-2 space-y-3">
                        {formData.workExperience.map((exp, index) => (
                          <div key={index} className="bg-gray-50 p-3 rounded-md">
                            <p className="font-medium">{exp.position} - {exp.company}</p>
                            <p className="text-sm text-gray-600">{exp.duration}</p>
                            <p className="text-sm mt-1">{exp.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500">體能狀況</p>
                    <p className="mt-1">{formData.physicalCondition}</p>
                  </div>
                  {formData.skills.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500">技能</p>
                      <p className="mt-1">{formData.skills.join('、')}</p>
                    </div>
                  )}
                  {formData.preferredWorkHours && (
                    <div>
                      <p className="text-sm text-gray-500">期望工作時數</p>
                      <p className="mt-1">每週 {formData.preferredWorkHours} 小時</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 期望與動機 */}
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">期望與動機</h3>
                <div className="space-y-4">
                  {formData.learningGoals.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500">學習目標</p>
                      <p className="mt-1">{formData.learningGoals.join('、')}</p>
                    </div>
                  )}
                  {formData.culturalInterests.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500">文化興趣</p>
                      <p className="mt-1">{formData.culturalInterests.join('、')}</p>
                    </div>
                  )}
                  {formData.accommodationNeeds && (
                    <div>
                      <p className="text-sm text-gray-500">住宿需求</p>
                      <p className="mt-1">{formData.accommodationNeeds}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500">申請動機</p>
                    <p className="mt-1">{formData.motivation}</p>
                  </div>
                </div>
              </div>

              {/* 照片 */}
              {formData.photos.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">上傳的照片</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {formData.photos.map((photo, index) => renderPhotoPreview(photo, index))}
                  </div>
                </div>
              )}

              {/* 最終留言 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  給主辦方的話 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      message: e.target.value
                    }));
                  }}
                  placeholder="請寫下您想對主辦方說的話（至少 50 字）"
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
                <p className="mt-1 text-sm text-gray-500">
                  {formData.message.length}/50 字（最少需要 50 字）
                </p>
              </div>
            </div>
          )}

          {/* 導航按鈕 */}
          <div className="mt-8 flex justify-between">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              上一步
            </button>
            {currentStep === formSteps.length - 1 ? (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '提交中...' : '提交申請'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                下一步
              </button>
            )}
          </div>

          {/* 錯誤提示移至底部 */}
          {validationErrors.length > 0 && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md">
              <h4 className="font-medium mb-2">請完成以下必填項目：</h4>
              <ul className="list-none space-y-1">
                {validationErrors.map((err, index) => (
                  <li key={index} className="text-sm">
                    {err.startsWith('  -') ? (
                      <span className="ml-4">{err.substring(4)}</span>
                    ) : (
                      <strong>{err}</strong>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ApplicationForm;