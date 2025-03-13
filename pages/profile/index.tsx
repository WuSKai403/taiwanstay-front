import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Image from 'next/image';
import Layout from '@/components/layout/Layout';

// 用戶資料類型定義
interface UserProfile {
  _id: string;
  name: string;
  email: string;
  image?: string;
  role: string;
  profile: {
    avatar?: string;
    bio?: string;
    skills?: string[];
    languages?: string[];
    location?: {
      type: string;
      coordinates: number[];
    };
    socialMedia?: {
      instagram?: string;
      facebook?: string;
      threads?: string;
      linkedin?: string;
      twitter?: string;
      youtube?: string;
      tiktok?: string;
      website?: string;
    };
    personalInfo?: {
      birthdate?: string;
      gender?: string;
      nationality?: string;
      currentLocation?: string;
      occupation?: string;
      education?: string;
    };
    workExchangePreferences?: {
      preferredWorkTypes?: string[];
      preferredLocations?: string[];
      availableFrom?: string;
      availableTo?: string;
      minDuration?: number;
      maxDuration?: number;
      hasDriverLicense?: boolean;
      dietaryRestrictions?: string[];
      specialNeeds?: string;
      notes?: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

// 個人資料頁面組件
export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  // 當會話狀態變更時獲取用戶資料
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchUserProfile();
    } else if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, session]);

  // 獲取用戶資料
  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/user/profile');
      if (!response.ok) throw new Error('獲取用戶資料失敗');

      const data = await response.json();
      setProfile(data.profile);
      setFormData(data.profile);
    } catch (error) {
      console.error('獲取用戶資料錯誤:', error);
      setNotification({
        type: 'error',
        message: '無法載入您的個人資料'
      });
    } finally {
      setLoading(false);
    }
  };

  // 處理表單輸入變更
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 處理個人資料欄位變更
  const handleProfileChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        [field]: value
      }
    }));
  };

  // 處理社交媒體欄位變更
  const handleSocialMediaChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        socialMedia: {
          ...prev.profile?.socialMedia,
          [field]: value
        }
      }
    }));
  };

  // 處理個人信息欄位變更
  const handlePersonalInfoChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        personalInfo: {
          ...prev.profile?.personalInfo,
          [field]: value
        }
      }
    }));
  };

  // 處理表單提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('更新個人資料失敗');

      const data = await response.json();
      setProfile(data.profile);
      setIsEditing(false);
      setNotification({
        type: 'success',
        message: '個人資料已更新'
      });
    } catch (error) {
      console.error('更新個人資料錯誤:', error);
      setNotification({
        type: 'error',
        message: '更新個人資料失敗'
      });
    } finally {
      setLoading(false);
    }
  };

  // 如果正在加載
  if (loading && !profile) {
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
        <title>個人資料 - TaiwanStay</title>
        <meta name="description" content="管理您的 TaiwanStay 個人資料" />
      </Head>

      <div className="bg-gray-50 min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {notification && (
            <div className={`mb-4 p-4 rounded-md ${notification.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              <p>{notification.message}</p>
              <button
                onClick={() => setNotification(null)}
                className="ml-2 text-sm font-medium underline"
              >
                關閉
              </button>
            </div>
          )}

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">個人資料</h1>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  管理您的個人資訊和偏好設定
                </p>
              </div>
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  編輯資料
                </button>
              )}
            </div>

            {isEditing ? (
              // 編輯表單
              <form onSubmit={handleSubmit} className="border-t border-gray-200">
                <div className="px-4 py-5 sm:p-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {/* 基本資料 */}
                    <div className="col-span-2">
                      <h3 className="text-lg font-medium text-gray-900">基本資料</h3>
                    </div>

                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">姓名</label>
                      <input
                        type="text"
                        name="name"
                        id="name"
                        value={formData.name || ''}
                        onChange={handleInputChange}
                        className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">電子郵件</label>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        value={formData.email || ''}
                        disabled
                        className="mt-1 bg-gray-100 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                      <p className="mt-1 text-xs text-gray-500">電子郵件無法變更</p>
                    </div>

                    <div className="col-span-2">
                      <label htmlFor="bio" className="block text-sm font-medium text-gray-700">自我介紹</label>
                      <textarea
                        id="bio"
                        name="bio"
                        rows={3}
                        value={formData.profile?.bio || ''}
                        onChange={(e) => handleProfileChange('bio', e.target.value)}
                        className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>

                    <div>
                      <label htmlFor="currentLocation" className="block text-sm font-medium text-gray-700">目前所在地</label>
                      <input
                        type="text"
                        id="currentLocation"
                        name="currentLocation"
                        value={formData.profile?.personalInfo?.currentLocation || ''}
                        onChange={(e) => handlePersonalInfoChange('currentLocation', e.target.value)}
                        className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>

                    <div>
                      <label htmlFor="occupation" className="block text-sm font-medium text-gray-700">職業</label>
                      <input
                        type="text"
                        id="occupation"
                        name="occupation"
                        value={formData.profile?.personalInfo?.occupation || ''}
                        onChange={(e) => handlePersonalInfoChange('occupation', e.target.value)}
                        className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>

                    {/* 社交媒體連結 */}
                    <div className="col-span-2 mt-6">
                      <h3 className="text-lg font-medium text-gray-900">社交媒體</h3>
                    </div>

                    <div>
                      <label htmlFor="facebook" className="block text-sm font-medium text-gray-700">Facebook</label>
                      <input
                        type="url"
                        id="facebook"
                        name="facebook"
                        value={formData.profile?.socialMedia?.facebook || ''}
                        onChange={(e) => handleSocialMediaChange('facebook', e.target.value)}
                        className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>

                    <div>
                      <label htmlFor="instagram" className="block text-sm font-medium text-gray-700">Instagram</label>
                      <input
                        type="url"
                        id="instagram"
                        name="instagram"
                        value={formData.profile?.socialMedia?.instagram || ''}
                        onChange={(e) => handleSocialMediaChange('instagram', e.target.value)}
                        className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>

                <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData(profile || {});
                    }}
                    className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 mr-3"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    {loading ? '儲存中...' : '儲存變更'}
                  </button>
                </div>
              </form>
            ) : (
              // 顯示資料
              <div className="border-t border-gray-200">
                <dl>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">姓名</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{profile?.name}</dd>
                  </div>
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">電子郵件</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{profile?.email}</dd>
                  </div>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">自我介紹</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {profile?.profile?.bio || '尚未填寫自我介紹'}
                    </dd>
                  </div>
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">目前所在地</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {profile?.profile?.personalInfo?.currentLocation || '尚未填寫所在地'}
                    </dd>
                  </div>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">職業</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {profile?.profile?.personalInfo?.occupation || '尚未填寫職業'}
                    </dd>
                  </div>
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">社交媒體</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                        {profile?.profile?.socialMedia?.facebook && (
                          <li className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                            <div className="w-0 flex-1 flex items-center">
                              <svg className="flex-shrink-0 h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                              </svg>
                              <span className="ml-2 flex-1 w-0 truncate">Facebook</span>
                            </div>
                            <div className="ml-4 flex-shrink-0">
                              <a href={profile.profile.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="font-medium text-primary-600 hover:text-primary-500">
                                查看
                              </a>
                            </div>
                          </li>
                        )}
                        {profile?.profile?.socialMedia?.instagram && (
                          <li className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                            <div className="w-0 flex-1 flex items-center">
                              <svg className="flex-shrink-0 h-5 w-5 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                              </svg>
                              <span className="ml-2 flex-1 w-0 truncate">Instagram</span>
                            </div>
                            <div className="ml-4 flex-shrink-0">
                              <a href={profile.profile.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="font-medium text-primary-600 hover:text-primary-500">
                                查看
                              </a>
                            </div>
                          </li>
                        )}
                        {!profile?.profile?.socialMedia?.facebook && !profile?.profile?.socialMedia?.instagram && (
                          <li className="pl-3 pr-4 py-3 text-sm text-gray-500">
                            尚未添加社交媒體連結
                          </li>
                        )}
                      </ul>
                    </dd>
                  </div>
                </dl>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}