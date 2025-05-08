import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import HostLayout from '@/components/layout/HostLayout';
import { getHostById, updateHostSettings } from '@/lib/api/host';
import { getSession } from 'next-auth/react';

// 表單驗證配置
const hostSettingsSchema = z.object({
  name: z.string().min(1, '名稱不能為空'),
  description: z.string().optional(),
  contactEmail: z.string().email('請輸入有效的電子郵件地址'),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url('請輸入有效的網址').optional().or(z.literal('')),
});

type HostSettingsForm = z.infer<typeof hostSettingsSchema>;

interface HostSettingsProps {
  hostId: string;
}

const HostSettings = ({ hostId }: HostSettingsProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 獲取主人資料
  const { data: hostData, isLoading, error } = useQuery({
    queryKey: ['host', hostId],
    queryFn: () => getHostById(hostId),
  });

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<HostSettingsForm>({
    resolver: zodResolver(hostSettingsSchema),
    defaultValues: {
      name: '',
      description: '',
      contactEmail: '',
      contactPhone: '',
      address: '',
      website: '',
    },
  });

  // 初始化表單資料
  useEffect(() => {
    if (hostData) {
      reset({
        name: hostData.name,
        description: hostData.description || '',
        contactEmail: hostData.contactInfo?.contactEmail || hostData.email || '',
        contactPhone: hostData.contactInfo?.contactMobile || hostData.contactInfo?.phone || '',
        address: hostData.location?.address || hostData.address || '',
        website: hostData.contactInfo?.website || hostData.website || '',
      });
    }
  }, [hostData, reset]);

  // 更新主人設定的 mutation
  const updateHostMutation = useMutation({
    mutationFn: (formData: HostSettingsForm) => updateHostSettings(hostId, formData),
    onSuccess: (data) => {
      // 直接轉導到 profile 頁面，不顯示成功消息和不重新獲取資料
      router.push(`/hosts/${hostId}/profile`);
    },
    onError: (error: any) => {
      setErrorMessage(error.message || '更新失敗，請稍後再試');
      setSuccessMessage(null);
    },
  });

  const onSubmit: SubmitHandler<HostSettingsForm> = (data) => {
    updateHostMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <HostLayout>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </HostLayout>
    );
  }

  if (error) {
    return (
      <HostLayout>
        <div className="p-6 bg-red-50 text-red-700 rounded-lg">
          <p>載入資料時發生錯誤，請稍後再試。</p>
        </div>
      </HostLayout>
    );
  }

  return (
    <HostLayout>
      <Head>
        <title>主人設定 - TaiwanStay</title>
        <meta name="description" content="管理您的主人資料和設定" />
      </Head>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold">主人設定</h1>
          <p className="text-gray-600 mt-1">管理您的主人資料和聯絡資訊</p>
        </div>

        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{errorMessage}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">{successMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                主人名稱
              </label>
              <input
                type="text"
                id="name"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                {...register('name')}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                主人介紹
              </label>
              <textarea
                id="description"
                rows={4}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                {...register('description')}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700">
                聯絡電子郵件
              </label>
              <input
                type="email"
                id="contactEmail"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                {...register('contactEmail')}
              />
              {errors.contactEmail && (
                <p className="mt-1 text-sm text-red-600">{errors.contactEmail.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700">
                聯絡電話
              </label>
              <input
                type="tel"
                id="contactPhone"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                {...register('contactPhone')}
              />
              {errors.contactPhone && (
                <p className="mt-1 text-sm text-red-600">{errors.contactPhone.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                地址
              </label>
              <input
                type="text"
                id="address"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                {...register('address')}
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                網站
              </label>
              <input
                type="url"
                id="website"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                {...register('website')}
              />
              {errors.website && (
                <p className="mt-1 text-sm text-red-600">{errors.website.message}</p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => router.back()}
                className="mr-4 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={updateHostMutation.isPending || !isDirty}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateHostMutation.isPending ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    儲存中...
                  </>
                ) : (
                  '儲存變更'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </HostLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);
  const hostId = context.params?.hostId as string;

  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }

  return {
    props: {
      hostId,
    },
  };
};

export default HostSettings;