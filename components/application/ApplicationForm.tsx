import React, { useState, useEffect } from 'react';
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
  const [isDraft, setIsDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();

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
      photos: [],
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

  // 初始化月份選擇
  useEffect(() => {
    if (opportunity.timeSlots && opportunity.timeSlots.length > 0) {
      const allStartDates = opportunity.timeSlots.map(slot => new Date(slot.startDate));
      const allEndDates = opportunity.timeSlots.map(slot => new Date(slot.endDate));
      const startDate = new Date(Math.min(...allStartDates.map(date => date.getTime())));
      const endDate = new Date(Math.max(...allEndDates.map(date => date.getTime())));

      const months: MonthSelection[] = [];
      let currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const monthDate = new Date(currentDate);
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

        const isAvailable = opportunity.timeSlots.some(slot => {
          const slotStart = new Date(slot.startDate);
          const slotEnd = new Date(slot.endDate);
          return (slotStart <= monthEnd && slotEnd >= monthStart);
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

      // 如果有草稿數據，更新月份選擇
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
      if (isDirty) {
        const formData = watch();
        localStorage.setItem(`application_draft_${opportunity.id}`, JSON.stringify(formData));
        setIsDraft(true);
      }
    };

    const draftTimer = setTimeout(saveDraft, 1000);
    return () => clearTimeout(draftTimer);
  }, [watch, isDirty, opportunity.id]);

  // 處理月份選擇
  const handleMonthSelect = (index: number) => {
    const newSelectedMonths = [...selectedMonths];
    const currentMonth = newSelectedMonths[index];

    if (!currentMonth.isAvailable) return;

    // 如果已經選擇了月份，則取消選擇
    if (currentMonth.isSelected) {
      newSelectedMonths[index] = {
        ...currentMonth,
        isSelected: false
      };
      setSelectedMonths(newSelectedMonths);
      return;
    }

    // 檢查是否已經選擇了其他月份
    const hasSelectedMonths = newSelectedMonths.some(month => month.isSelected);

    if (!hasSelectedMonths) {
      // 如果沒有選擇任何月份，則選擇當前月份
      newSelectedMonths[index] = {
        ...currentMonth,
        isSelected: true
      };
    } else {
      // 如果已經選擇了月份，則檢查是否形成連續範圍
      const selectedMonths = newSelectedMonths.filter(month => month.isSelected);
      const firstSelected = selectedMonths[0];
      const lastSelected = selectedMonths[selectedMonths.length - 1];

      const currentMonthDate = new Date(currentMonth.year, currentMonth.month);
      const firstSelectedDate = new Date(firstSelected.year, firstSelected.month);
      const lastSelectedDate = new Date(lastSelected.year, lastSelected.month);

      // 檢查是否在已選擇月份的範圍內
      if (currentMonthDate >= firstSelectedDate && currentMonthDate <= lastSelectedDate) {
        // 在範圍內，取消選擇
        newSelectedMonths[index] = {
          ...currentMonth,
          isSelected: false
        };
      } else if (currentMonthDate < firstSelectedDate) {
        // 在範圍之前，擴展範圍
        for (let i = index; i < newSelectedMonths.length; i++) {
          const month = newSelectedMonths[i];
          if (month.isAvailable) {
            newSelectedMonths[i] = {
              ...month,
              isSelected: true
            };
          }
        }
      } else if (currentMonthDate > lastSelectedDate) {
        // 在範圍之後，擴展範圍
        for (let i = 0; i <= index; i++) {
          const month = newSelectedMonths[i];
          if (month.isAvailable) {
            newSelectedMonths[i] = {
              ...month,
              isSelected: true
            };
          }
        }
      }
    }

    setSelectedMonths(newSelectedMonths);

    // 更新表單數據
    const selectedMonthsData = newSelectedMonths.filter(month => month.isSelected);
    if (selectedMonthsData.length > 0) {
      const startDate = new Date(selectedMonthsData[0].year, selectedMonthsData[0].month, 1);
      const endDate = new Date(
        selectedMonthsData[selectedMonthsData.length - 1].year,
        selectedMonthsData[selectedMonthsData.length - 1].month + 1,
        0
      );

      setValue('startDate', startDate.toISOString().split('T')[0]);
      setValue('endDate', endDate.toISOString().split('T')[0]);
      setValue('duration', Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    }
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
      setIsSubmitting(true);
      setError(undefined);
      await onSubmit(data);
      localStorage.removeItem(`application_draft_${opportunity.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失敗，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 渲染照片預覽
  const renderPhotoPreview = (photo: CloudinaryImageResource, index: number) => (
    <div key={photo.public_id} className="relative group">
      <Image
        src={photo.secure_url}
        alt={`照片 ${index + 1}`}
        width={200}
        height={200}
        className="rounded-lg object-cover"
      />
      <button
        type="button"
        onClick={() => handleRemovePhoto(index)}
        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
      >
        ×
      </button>
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
      {/* 步驟指示器 */}
      <div className="flex justify-between mb-8">
        {formSteps.map((step, index) => (
          <div
            key={step.title}
            className={`flex items-center ${
              index < formSteps.length - 1 ? 'flex-1' : ''
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                index <= currentStep
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {index + 1}
            </div>
            {index < formSteps.length - 1 && (
              <div
                className={`flex-1 h-1 mx-2 ${
                  index < currentStep ? 'bg-blue-500' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* 當前步驟的標題和描述 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">{formSteps[currentStep].title}</h2>
        <p className="text-gray-600">{formSteps[currentStep].description}</p>
      </div>

      {/* 表單內容 */}
      <div className="space-y-4">
        {currentStep === 0 && (
          <>
            {/* 基本資訊表單 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  開始日期
                </label>
                <input
                  type="date"
                  {...register('startDate')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.startDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  結束日期
                </label>
                <input
                  type="date"
                  {...register('endDate')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.endDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  停留時間（天）
                </label>
                <input
                  type="number"
                  {...register('duration', { valueAsNumber: true })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.duration && (
                  <p className="mt-1 text-sm text-red-600">{errors.duration.message}</p>
                )}
              </div>
            </div>
          </>
        )}

        {currentStep === 1 && (
          <>
            {/* 個人資訊表單 */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  同行夥伴
                </label>
                <div className="mt-2 space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('travelingWith.partner')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2">伴侶</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('travelingWith.children')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2">小孩</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('travelingWith.pets')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2">寵物</span>
                  </label>
                </div>
                <textarea
                  {...register('travelingWith.details')}
                  placeholder="請提供更多細節"
                  className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  語言能力
                </label>
                <div className="mt-2 space-y-2">
                  {languageFields.map((field: Record<string, unknown>, index: number) => (
                    <div key={field.id as string} className="flex gap-2">
                      <input
                        {...register(`languages.${index}.language`)}
                        placeholder="語言"
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <input
                        {...register(`languages.${index}.level`)}
                        placeholder="程度"
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => removeLanguage(index)}
                        className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                      >
                        移除
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => appendLanguage({ language: '', level: '' })}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    新增語言
                  </button>
                </div>
                {errors.languages && (
                  <p className="mt-1 text-sm text-red-600">{errors.languages.message}</p>
                )}
              </div>
            </div>
          </>
        )}

        {currentStep === 2 && (
          <>
            {/* 工作能力表單 */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  工作經驗
                </label>
                <div className="mt-2 space-y-2">
                  {workExperienceFields.map((field: Record<string, unknown>, index: number) => (
                    <div key={field.id as string} className="space-y-2 p-4 border rounded-md">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          {...register(`workExperience.${index}.position`)}
                          placeholder="職位"
                          className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        <input
                          {...register(`workExperience.${index}.company`)}
                          placeholder="公司名稱"
                          className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <input
                        {...register(`workExperience.${index}.duration`)}
                        placeholder="工作時間"
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <textarea
                        {...register(`workExperience.${index}.description`)}
                        placeholder="工作描述"
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => removeWorkExperience(index)}
                        className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                      >
                        移除
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => appendWorkExperience({ position: '', company: '', duration: '', description: '' })}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    新增工作經驗
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  身體狀況
                </label>
                <textarea
                  {...register('physicalCondition')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.physicalCondition && (
                  <p className="mt-1 text-sm text-red-600">{errors.physicalCondition.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  偏好工作時間
                </label>
                <input
                  {...register('preferredWorkHours')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.preferredWorkHours && (
                  <p className="mt-1 text-sm text-red-600">{errors.preferredWorkHours.message}</p>
                )}
              </div>
            </div>
          </>
        )}

        {currentStep === 3 && (
          <>
            {/* 期望與動機表單 */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  住宿需求
                </label>
                <textarea
                  {...register('accommodationNeeds')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.accommodationNeeds && (
                  <p className="mt-1 text-sm text-red-600">{errors.accommodationNeeds.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  文化興趣
                </label>
                <input
                  {...register('culturalInterests')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  學習目標
                </label>
                <textarea
                  {...register('learningGoals')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  動機
                </label>
                <textarea
                  {...register('motivation')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.motivation && (
                  <p className="mt-1 text-sm text-red-600">{errors.motivation.message}</p>
                )}
              </div>
            </div>
          </>
        )}

        {currentStep === 4 && (
          <>
            {/* 照片上傳表單 */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                照片上傳
              </label>
              <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4">
                {watch('photos').map((photo: CloudinaryImageResource, index: number) => renderPhotoPreview(photo, index))}
                {watch('photos').length < 5 && (
                  <CldUploadWidget
                    uploadPreset={getUploadPreset(true)}
                    options={{
                      sources: ['local'],
                      multiple: false,
                      folder: getUploadFolder(true, 'applications'),
                      resourceType: 'image',
                      maxFiles: 1,
                      maxFileSize: 5000000,
                      clientAllowedFormats: ['jpg', 'jpeg', 'png']
                    }}
                    onUpload={handlePhotoUpload}
                  >
                    {({ open }) => (
                      <button
                        type="button"
                        onClick={() => open()}
                        className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-blue-500"
                      >
                        <span className="text-gray-500">點擊上傳照片</span>
                      </button>
                    )}
                  </CldUploadWidget>
                )}
              </div>
              {errors.photos && (
                <p className="mt-1 text-sm text-red-600">{errors.photos.message}</p>
              )}
            </div>
          </>
        )}

        {currentStep === 5 && (
          <>
            {/* 最終確認表單 */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                申請訊息
              </label>
              <textarea
                {...register('message')}
                rows={5}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.message && (
                <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* 錯誤訊息 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* 按鈕 */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50"
        >
          上一步
        </button>
        {currentStep < formSteps.length - 1 ? (
          <button
            type="button"
            onClick={handleNext}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            下一步
          </button>
        ) : (
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
          >
            {isSubmitting ? '提交中...' : '提交申請'}
          </button>
        )}
      </div>
    </form>
  );
};

export default ApplicationForm;