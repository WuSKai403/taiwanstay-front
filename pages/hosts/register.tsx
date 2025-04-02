import { useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Layout from '@/components/layout/Layout';
import { useForm } from 'react-hook-form';

// 主人註冊表單數據類型
interface HostRegisterFormData {
  name: string;
  description: string;
  location: {
    country: string;
    region: string;
    city: string;
    address: string;
  };
  contactInfo: {
    email: string;
    phone: string;
    website?: string;
  };
  hostType: string;
  capacity: number;
  amenities: string[];
}

export default function HostRegister() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 設置表單處理
  const { register, handleSubmit, formState: { errors } } = useForm<HostRegisterFormData>({
    defaultValues: {
      contactInfo: {
        email: session?.user?.email || '',
      },
      hostType: 'farm', // 預設為農場
      capacity: 1, // 預設容納人數
      amenities: [],
    }
  });

  // 主人類型選項
  const hostTypes = [
    { value: 'farm', label: '農場' },
    { value: 'hostel', label: '民宿/旅館' },
    { value: 'cafe', label: '咖啡廳/餐廳' },
    { value: 'npo', label: '非營利組織' },
    { value: 'school', label: '學校/教育機構' },
    { value: 'art', label: '藝術工作室' },
    { value: 'eco', label: '生態保育' },
    { value: 'other', label: '其他' },
  ];

  // 設施選項
  const amenityOptions = [
    { value: 'wifi', label: 'WiFi' },
    { value: 'private_room', label: '私人房間' },
    { value: 'shared_room', label: '共享房間' },
    { value: 'kitchen', label: '廚房使用權' },
    { value: 'washing_machine', label: '洗衣機' },
    { value: 'shower', label: '淋浴設施' },
    { value: 'hot_water', label: '熱水' },
    { value: 'air_conditioning', label: '空調' },
    { value: 'heating', label: '暖氣' },
    { value: 'bike', label: '腳踏車' },
    { value: 'meals', label: '供餐' },
    { value: 'pickup', label: '接送服務' },
  ];

  // 處理表單提交
  const onSubmit = async (data: HostRegisterFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/hosts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '註冊主人失敗');
      }

      setSuccess('成功註冊成為主人！正在跳轉到主人中心...');

      // 延遲一秒後跳轉到主人中心
      setTimeout(() => {
        router.push(`/hosts/${result.hostId}`);
      }, 1000);
    } catch (err) {
      console.error('註冊主人錯誤:', err);
      setError((err as Error).message || '註冊主人時發生錯誤');
    } finally {
      setIsLoading(false);
    }
  };

  // 如果未登入，跳轉到登入頁面
  if (status === 'unauthenticated') {
    router.push('/auth/signin?callbackUrl=/hosts/register');
    return null;
  }

  // 如果正在加載會話
  if (status === 'loading') {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>成為主人 - TaiwanStay</title>
        <meta name="description" content="註冊成為 TaiwanStay 的主人，提供工作換宿機會" />
      </Head>

      <div className="bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h1 className="text-2xl font-bold text-gray-900">成為主人</h1>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                註冊成為 TaiwanStay 的主人，提供工作換宿機會給旅行者
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 mx-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4 mx-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">{success}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* 基本資訊 */}
                <div className="sm:col-span-2">
                  <h2 className="text-lg font-medium text-gray-900">基本資訊</h2>
                  <p className="mt-1 text-sm text-gray-500">提供您的主人資訊，讓旅行者了解您</p>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">主人名稱 *</label>
                  <input
                    type="text"
                    id="name"
                    {...register("name", { required: "主人名稱為必填" })}
                    className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">主人描述 *</label>
                  <textarea
                    id="description"
                    rows={3}
                    {...register("description", { required: "主人描述為必填" })}
                    className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    placeholder="描述您的地方、工作環境和風格..."
                  />
                  {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
                </div>

                <div>
                  <label htmlFor="hostType" className="block text-sm font-medium text-gray-700">主人類型 *</label>
                  <select
                    id="hostType"
                    {...register("hostType", { required: "主人類型為必填" })}
                    className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  >
                    {hostTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {errors.hostType && <p className="mt-1 text-sm text-red-600">{errors.hostType.message}</p>}
                </div>

                <div>
                  <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">容納人數 *</label>
                  <input
                    type="number"
                    id="capacity"
                    min="1"
                    max="20"
                    {...register("capacity", { required: "容納人數為必填", min: { value: 1, message: "容納人數至少為 1" } })}
                    className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                  {errors.capacity && <p className="mt-1 text-sm text-red-600">{errors.capacity.message}</p>}
                </div>

                {/* 位置資訊 */}
                <div className="sm:col-span-2 mt-6">
                  <h2 className="text-lg font-medium text-gray-900">位置資訊</h2>
                  <p className="mt-1 text-sm text-gray-500">您的主人位置資訊</p>
                </div>

                <div>
                  <label htmlFor="location.country" className="block text-sm font-medium text-gray-700">國家 *</label>
                  <input
                    type="text"
                    id="location.country"
                    {...register("location.country", { required: "國家為必填" })}
                    defaultValue="台灣"
                    className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                  {errors.location?.country && <p className="mt-1 text-sm text-red-600">{errors.location.country.message}</p>}
                </div>

                <div>
                  <label htmlFor="location.region" className="block text-sm font-medium text-gray-700">地區/縣市 *</label>
                  <input
                    type="text"
                    id="location.region"
                    {...register("location.region", { required: "地區/縣市為必填" })}
                    className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                  {errors.location?.region && <p className="mt-1 text-sm text-red-600">{errors.location.region.message}</p>}
                </div>

                <div>
                  <label htmlFor="location.city" className="block text-sm font-medium text-gray-700">城市/鄉鎮 *</label>
                  <input
                    type="text"
                    id="location.city"
                    {...register("location.city", { required: "城市/鄉鎮為必填" })}
                    className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                  {errors.location?.city && <p className="mt-1 text-sm text-red-600">{errors.location.city.message}</p>}
                </div>

                <div>
                  <label htmlFor="location.address" className="block text-sm font-medium text-gray-700">地址 *</label>
                  <input
                    type="text"
                    id="location.address"
                    {...register("location.address", { required: "地址為必填" })}
                    className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                  {errors.location?.address && <p className="mt-1 text-sm text-red-600">{errors.location.address.message}</p>}
                </div>

                {/* 聯絡資訊 */}
                <div className="sm:col-span-2 mt-6">
                  <h2 className="text-lg font-medium text-gray-900">聯絡資訊</h2>
                  <p className="mt-1 text-sm text-gray-500">您的聯絡方式，部分資訊將顯示給申請者</p>
                </div>

                <div>
                  <label htmlFor="contactInfo.email" className="block text-sm font-medium text-gray-700">電子郵件 *</label>
                  <input
                    type="email"
                    id="contactInfo.email"
                    {...register("contactInfo.email", { required: "電子郵件為必填" })}
                    className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                  {errors.contactInfo?.email && <p className="mt-1 text-sm text-red-600">{errors.contactInfo.email.message}</p>}
                </div>

                <div>
                  <label htmlFor="contactInfo.phone" className="block text-sm font-medium text-gray-700">電話 *</label>
                  <input
                    type="tel"
                    id="contactInfo.phone"
                    {...register("contactInfo.phone", { required: "電話為必填" })}
                    className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                  {errors.contactInfo?.phone && <p className="mt-1 text-sm text-red-600">{errors.contactInfo.phone.message}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="contactInfo.website" className="block text-sm font-medium text-gray-700">網站</label>
                  <input
                    type="url"
                    id="contactInfo.website"
                    {...register("contactInfo.website")}
                    className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    placeholder="https://your-website.com"
                  />
                </div>

                {/* 設施 */}
                <div className="sm:col-span-2 mt-6">
                  <h2 className="text-lg font-medium text-gray-900">提供設施</h2>
                  <p className="mt-1 text-sm text-gray-500">選擇您提供給工作換宿者的設施</p>
                </div>

                <div className="sm:col-span-2">
                  <fieldset>
                    <legend className="sr-only">設施</legend>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {amenityOptions.map((option) => (
                        <div key={option.value} className="relative flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              id={`amenities-${option.value}`}
                              type="checkbox"
                              value={option.value}
                              {...register("amenities")}
                              className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label htmlFor={`amenities-${option.value}`} className="font-medium text-gray-700">
                              {option.label}
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </fieldset>
                </div>
              </div>

              <div className="pt-8">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                  >
                    {isLoading ? '處理中...' : '註冊主人'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
