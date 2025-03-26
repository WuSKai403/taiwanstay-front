import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import Head from 'next/head';
import { ProfileUpdateData } from '@/lib/types';

export default function EditProfile() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ProfileUpdateData>({
    name: session?.user?.name || '',
    phone: '',
    emergencyContact: '',
    aboutMe: ''
  });

  // 如果未登入，重定向到登入頁面
  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  // 如果正在檢查登入狀態，顯示載入中
  if (status === 'loading') {
    return <div>載入中...</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/profile');
      } else {
        const error = await response.json();
        alert(error.message || '更新失敗，請稍後再試');
      }
    } catch (error) {
      alert('更新時發生錯誤，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Layout>
      <Head>
        <title>編輯個人資料 - TaiwanStay</title>
      </Head>

      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">編輯個人資料</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              姓名
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name || ''}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              電話
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone || ''}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="emergencyContact" className="block text-sm font-medium text-gray-700">
              緊急聯絡人
            </label>
            <input
              type="text"
              id="emergencyContact"
              name="emergencyContact"
              value={formData.emergencyContact || ''}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="aboutMe" className="block text-sm font-medium text-gray-700">
              自我介紹
            </label>
            <textarea
              id="aboutMe"
              name="aboutMe"
              value={formData.aboutMe || ''}
              onChange={handleChange}
              rows={4}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? '儲存中...' : '儲存'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}