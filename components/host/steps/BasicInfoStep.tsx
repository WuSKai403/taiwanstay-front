import React, { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { useHostRegister } from '../context/HostRegisterContext';
import { HostType } from '@/models/enums/HostType';
import HostTypeSelector from '@/components/host/ui/HostTypeSelector';
// 暫時移除 FormErrorSummary
// import FormErrorSummary from '@/components/ui/FormErrorSummary';

// 主人類別選項
const CATEGORY_OPTIONS: Record<HostType, string[]> = {
  [HostType.FARM]: ['農業體驗', '有機農場', '永續農業', '茶園', '果園', '花園', '畜牧'],
  [HostType.HOSTEL]: ['背包客棧', '青年旅館', '國際青年旅舍'],
  [HostType.HOMESTAY]: ['家庭式民宿', '鄉村民宿', '海濱民宿', '山區民宿'],
  [HostType.ECO_VILLAGE]: ['永續社區', '生態村', '自然建築'],
  [HostType.RETREAT_CENTER]: ['靜修中心', '瑜伽中心', '冥想中心'],
  [HostType.COMMUNITY]: ['社區組織', '社區發展協會', '社區農園'],
  [HostType.NGO]: ['環保組織', '社會企業', '文化保存', '教育機構'],
  [HostType.SCHOOL]: ['學校', '實驗教育機構', '戶外教育', '自然教育中心'],
  [HostType.CAFE]: ['咖啡廳', '文創咖啡', '共享空間'],
  [HostType.RESTAURANT]: ['餐廳', '有機餐廳', '素食餐廳', '農場餐廳'],
  [HostType.ART_CENTER]: ['藝術中心', '工作室', '藝術村', '展覽空間'],
  [HostType.ANIMAL_SHELTER]: ['動物收容所', '動物保護', '野生動物救援'],
  [HostType.OUTDOOR_ACTIVITY]: ['戶外活動', '冒險體驗', '生態導覽', '水上活動'],
  [HostType.OTHER]: ['其他'],
  [HostType.COWORKING_SPACE]: ['創業空間', '共享辦公室', '創客空間', '遠端工作空間'],
  [HostType.CULTURAL_VENUE]: ['文化中心', '博物館', '劇場', '展覽館', '文創園區'],
  [HostType.COMMUNITY_CENTER]: ['社區中心', '鄰里中心', '共享空間', '活動場地']
};

// 常用語言選項
const LANGUAGE_OPTIONS = [
  { value: '中文', label: '中文' },
  { value: '英文', label: '英文' },
  { value: '日文', label: '日文' },
  { value: '韓文', label: '韓文' },
  { value: '法文', label: '法文' },
  { value: '德文', label: '德文' },
  { value: '西班牙文', label: '西班牙文' },
  { value: '義大利文', label: '義大利文' }
];

const BasicInfoStep: React.FC = () => {
  const { methods } = useHostRegister();
  const {
    register,
    formState: { errors, isSubmitted },
    watch,
    setValue,
    trigger
  } = useFormContext();

  // 監視主人類型，以便動態更新類別選項
  const selectedType = watch('type') as HostType;

  // 當組件載入或提交時觸發驗證
  useEffect(() => {
    if (isSubmitted) {
      trigger(['name', 'description', 'type', 'languages']);
    }
  }, [isSubmitted, trigger]);

  // 處理類型變更
  const handleTypeChange = (type: HostType) => {
    setValue('type', type);
    // 如果變更類型，自動設置第一個類別選項
    setValue('category', CATEGORY_OPTIONS[type][0]);
  };

  // 獲取當前類型的所有類別選項
  const categoryOptions = selectedType ? CATEGORY_OPTIONS[selectedType] : [];

  // 處理語言選擇
  const selectedLanguages = watch('languages') || [];
  const handleLanguageToggle = (language: string) => {
    if (selectedLanguages.includes(language)) {
      setValue('languages', selectedLanguages.filter((lang: string) => lang !== language));
    } else {
      setValue('languages', [...selectedLanguages, language]);
    }
    // 立即觸發語言欄位的驗證
    trigger('languages');
  };

  // 當年份或團隊規模輸入不是數字時的處理
  const handleNumericInput = (field: string, value: string) => {
    // 處理空值情況
    if (value === '') {
      setValue(field, null, { shouldValidate: true });
      return;
    }

    // 處理數值
    const numValue = Number(value);
    if (!isNaN(numValue)) {
      setValue(field, numValue, { shouldValidate: true });
    }
  };

  // 檢查必填欄位的值
  const name = watch('name') || '';
  const description = watch('description') || '';
  const languages = watch('languages') || [];

  // 增加字段內單獨的錯誤顯示函數
  const renderFieldError = (fieldName: string) => {
    if (errors[fieldName] && isSubmitted) {
      return (
        <p className="mt-1 text-sm text-red-600">
          {errors[fieldName]?.message as string}
        </p>
      );
    }
    return null;
  };

  // 自訂的錯誤摘要組件，而不是使用 FormErrorSummary
  const renderErrorSummary = () => {
    if (!isSubmitted || Object.keys(errors).length === 0) {
      return null;
    }

    const errorFields = [
      'name', 'description', 'type', 'category', 'foundedYear', 'teamSize', 'languages'
    ].filter(field => errors[field]);

    if (errorFields.length === 0) {
      return null;
    }

    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md mb-6">
        <p className="text-red-600 font-medium">請修正以下錯誤：</p>
        <ul className="mt-2 list-disc pl-5 space-y-1">
          {errorFields.map(field => (
            <li key={field} className="text-sm text-red-600">
              {field}: {errors[field]?.message as string}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 自訂錯誤摘要 */}
      {renderErrorSummary()}

      {/* 主人名稱 */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          主人名稱 <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          {...register('name')}
          className={`mt-1 block w-full rounded-md ${errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'}`}
          placeholder="請輸入您的主人名稱，將顯示給所有用戶"
          onChange={(e) => setValue('name', e.target.value, { shouldValidate: true })}
        />
        {renderFieldError('name')}
      </div>

      {/* 主人類型 */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          主人類型 <span className="text-red-500">*</span>
        </label>
        <HostTypeSelector
          selectedType={selectedType}
          onChange={handleTypeChange}
        />
        {renderFieldError('type')}
      </div>

      {/* 主人類別 */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700">
          主人類別 <span className="text-red-500">*</span>
        </label>
        <select
          id="category"
          {...register('category')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
        >
          {categoryOptions.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        {renderFieldError('category')}
      </div>

      {/* 主人描述 */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          主人描述 <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          {...register('description')}
          rows={5}
          className={`mt-1 block w-full rounded-md ${errors.description ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'}`}
          placeholder="請詳細描述您的主人特色、環境、理念等，讓用戶更了解您"
          onChange={(e) => setValue('description', e.target.value, { shouldValidate: isSubmitted })}
        />
        {renderFieldError('description')}
        <p className="mt-1 text-sm text-gray-500">
          至少50個字，最多1000個字
        </p>
      </div>

      {/* 成立年份 */}
      <div>
        <label htmlFor="foundedYear" className="block text-sm font-medium text-gray-700">
          成立年份
        </label>
        <input
          id="foundedYear"
          type="number"
          className={`mt-1 block w-full rounded-md ${errors.foundedYear ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'}`}
          placeholder={`1900 - ${new Date().getFullYear()}`}
          min="1900"
          max={new Date().getFullYear()}
          defaultValue={watch('foundedYear') || ''}
          onChange={(e) => handleNumericInput('foundedYear', e.target.value)}
        />
        {renderFieldError('foundedYear')}
      </div>

      {/* 團隊規模 */}
      <div>
        <label htmlFor="teamSize" className="block text-sm font-medium text-gray-700">
          團隊規模
        </label>
        <input
          id="teamSize"
          type="number"
          className={`mt-1 block w-full rounded-md ${errors.teamSize ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'}`}
          placeholder="請輸入團隊人數"
          min="1"
          defaultValue={watch('teamSize') || ''}
          onChange={(e) => handleNumericInput('teamSize', e.target.value)}
        />
        {renderFieldError('teamSize')}
      </div>

      {/* 使用語言 */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          使用語言 <span className="text-red-500">*</span>
        </label>
        <div className={`mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4 ${errors.languages ? 'p-2 border border-red-300 rounded-md' : ''}`}>
          {LANGUAGE_OPTIONS.map((language) => (
            <div key={language.value} className="flex items-center">
              <input
                id={`language-${language.value}`}
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                checked={selectedLanguages.includes(language.value)}
                onChange={() => handleLanguageToggle(language.value)}
              />
              <label htmlFor={`language-${language.value}`} className="ml-2 text-sm text-gray-700">
                {language.label}
              </label>
            </div>
          ))}
        </div>
        {renderFieldError('languages')}
      </div>
    </div>
  );
};

export default BasicInfoStep;