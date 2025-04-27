import { useState, useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { Tab } from '@headlessui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import Button from '@/components/common/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { OpportunityStatus, OpportunityType } from '@/models/enums';
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
  workTimeSettings: z.object({
    workHoursPerDay: z.number().min(1, { message: '每天工作時間至少1小時' }).max(24, { message: '每天工作時間不能超過24小時' }).optional(),
    workDaysPerWeek: z.number().min(1, { message: '每週工作天數至少1天' }).max(7, { message: '每週工作天數不能超過7天' }).optional(),
    minimumStay: z.number().min(1, { message: '最少停留時間至少1天' }).optional(),
    maximumStay: z.number().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    isOngoing: z.boolean().optional(),
    seasonality: z.object({
      spring: z.boolean().optional(),
      summer: z.boolean().optional(),
      autumn: z.boolean().optional(),
      winter: z.boolean().optional(),
    }).optional(),
  }).optional(),
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
      url: z.string().optional(),
      alt: z.string().optional(),
    })).optional(),
    coverImage: z.object({
      url: z.string().optional(),
      alt: z.string().optional(),
    }).optional(),
    descriptions: z.record(z.string()).optional(),
  }).optional(),
  hasTimeSlots: z.boolean().optional(),
  timeSlots: z.array(z.object({
    id: z.string().optional(),
    startMonth: z.string().optional(),
    endMonth: z.string().optional(),
    defaultCapacity: z.number().optional(),
    minimumStay: z.number().optional(),
    appliedCount: z.number().optional(),
    confirmedCount: z.number().optional(),
    status: z.string().optional(),
    description: z.string().optional(),
  })).optional(),
});

export type OpportunityFormData = z.infer<typeof opportunitySchema>;

// 定義 OpportunityForm 組件的 props
interface OpportunityFormProps {
  initialData?: OpportunityFormData; // 初始表單數據
  isNewOpportunity: boolean; // 是否為新增機會
  onSubmit: (data: OpportunityFormData) => Promise<void>;
  onPublish?: () => Promise<void>; // 可選的發布功能
  onPreview?: (opportunitySlug: string) => void; // 可選的預覽功能
  onCancel: () => void; // 取消操作
  isSubmitting: boolean; // 是否正在提交
  isPublishing?: boolean; // 是否正在發布
  opportunity?: any; // 機會數據（用於顯示狀態等）
}

// OpportunityForm 組件
export default function OpportunityForm({
  initialData,
  isNewOpportunity,
  onSubmit,
  onPublish,
  onPreview,
  onCancel,
  isSubmitting,
  isPublishing,
  opportunity,
}: OpportunityFormProps) {
  const [activeTab, setActiveTab] = useState(0);

  // 統一使用同一個表單邏輯，不再區分新增/編輯
  const methods = useForm<OpportunityFormData>({
    resolver: zodResolver(opportunitySchema),
    defaultValues: initialData || {
      title: '',
      shortDescription: '',
      description: '',
      type: OpportunityType.FARMING,
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
      hasTimeSlots: false,
      timeSlots: [],
      media: {
        images: [],
        descriptions: {},
        coverImage: undefined,
      },
    },
  });

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
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

  // 處理下一步按鈕點擊
  const handleNextTab = () => {
    if (activeTab < tabs.length - 1) {
      setActiveTab(activeTab + 1);
    }
  };

  // 處理上一步按鈕點擊
  const handlePrevTab = () => {
    if (activeTab > 0) {
      setActiveTab(activeTab - 1);
    }
  };

  // 渲染導航按鈕
  const renderTabNavigation = () => {
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
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit(onSubmit)}
            loading={isSubmitting}
          >
            儲存
          </Button>
          {activeTab === tabs.length - 1 && !isNewOpportunity && opportunity?.status === OpportunityStatus.DRAFT && onPublish && (
            <Button
              type="button"
              variant="success"
              onClick={onPublish}
              loading={isPublishing}
            >
              發布
            </Button>
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
            {tabs.map((tab) => (
              <Tab
                key={tab.name}
                className={({ selected }) =>
                  `w-full rounded-lg py-2.5 text-sm font-medium leading-5 focus:outline-none
                  ${
                    selected
                      ? 'bg-primary-500 text-white shadow'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
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
      </div>
    </FormProvider>
  );
}