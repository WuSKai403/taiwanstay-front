import React from 'react';
import { useFormContext } from 'react-hook-form';
import { HostType } from '@/models/enums/HostType';
import { HostRegisterFormData } from '@/lib/schemas/host';

const BasicInfoStep: React.FC = () => {
  const { register, formState: { errors } } = useFormContext<HostRegisterFormData>();

  return (
    <div className="space-y-6 mb-8">
      {/* 主人名稱 */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          主人名稱 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          {...register('name')}
          placeholder="請輸入主人名稱"
          className="w-full p-2 border rounded focus:ring-primary-500 focus:border-primary-500"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      {/* 主人類型 */}
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
          主人類型 <span className="text-red-500">*</span>
        </label>
        <select
          id="type"
          {...register('type')}
          className="w-full p-2 border rounded focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">請選擇主人類型</option>
          {Object.entries(HostType).map(([key, value]) => (
            <option key={key} value={value}>
              {value === 'FARM' && '農場'}
              {value === 'HOSTEL' && '青年旅館'}
              {value === 'HOMESTAY' && '民宿'}
              {value === 'ECO_VILLAGE' && '生態村'}
              {value === 'RETREAT_CENTER' && '靜修中心'}
              {value === 'COMMUNITY' && '社區'}
              {value === 'NGO' && '非政府組織'}
              {value === 'SCHOOL' && '學校'}
              {value === 'CAFE' && '咖啡廳'}
              {value === 'RESTAURANT' && '餐廳'}
              {value === 'ART_CENTER' && '藝術中心'}
              {value === 'ANIMAL_SHELTER' && '動物收容所'}
              {value === 'OUTDOOR_ACTIVITY' && '戶外活動'}
              {value === 'COWORKING_SPACE' && '共享工作空間'}
              {value === 'CULTURAL_VENUE' && '文化場所'}
              {value === 'COMMUNITY_CENTER' && '社區中心'}
              {value === 'OTHER' && '其他'}
            </option>
          ))}
        </select>
        {errors.type && (
          <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
        )}
      </div>

      {/* 主人類別 */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
          主人類別 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="category"
          {...register('category')}
          placeholder="請輸入主人類別"
          className="w-full p-2 border rounded focus:ring-primary-500 focus:border-primary-500"
        />
        {errors.category && (
          <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
        )}
      </div>

      {/* 主人描述 */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          主人描述 <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          {...register('description')}
          rows={5}
          placeholder="請詳細描述您的場所，讓用戶更好地了解您"
          className="w-full p-2 border rounded focus:ring-primary-500 focus:border-primary-500"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      {/* 地址信息 */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium">地址信息</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="location.city" className="block text-sm font-medium text-gray-700 mb-1">
              城市 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="location.city"
              {...register('location.city')}
              placeholder="請輸入城市"
              className="w-full p-2 border rounded focus:ring-primary-500 focus:border-primary-500"
            />
            {errors.location?.city && (
              <p className="mt-1 text-sm text-red-600">{errors.location.city.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="location.district" className="block text-sm font-medium text-gray-700 mb-1">
              區域 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="location.district"
              {...register('location.district')}
              placeholder="請輸入區域"
              className="w-full p-2 border rounded focus:ring-primary-500 focus:border-primary-500"
            />
            {errors.location?.district && (
              <p className="mt-1 text-sm text-red-600">{errors.location.district.message}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="location.address" className="block text-sm font-medium text-gray-700 mb-1">
            詳細地址 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="location.address"
            {...register('location.address')}
            placeholder="請輸入詳細地址"
            className="w-full p-2 border rounded focus:ring-primary-500 focus:border-primary-500"
          />
          {errors.location?.address && (
            <p className="mt-1 text-sm text-red-600">{errors.location.address.message}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BasicInfoStep;