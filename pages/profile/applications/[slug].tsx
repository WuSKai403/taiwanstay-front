import { useState, useEffect, useRef, useCallback } from 'react';
import { NextPage, GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { ApplicationStatus } from '@/models/enums/ApplicationStatus';
import ProfileLayout from '@/components/layout/ProfileLayout';
import { getSession } from 'next-auth/react';
import { statusNameMap, statusColorMap, ApplicationDetail } from '@/constants/applicationStatus';
import CloudinaryImage from '@/components/CloudinaryImage';


interface ApplicationDetailPageProps {
  applicationId: string;
}

const ApplicationDetailPage: NextPage<ApplicationDetailPageProps> = ({ applicationId }) => {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 標記訊息為已讀
  const markMessagesAsRead = useCallback(async () => {
    try {
      await fetch(`/api/applications/${applicationId}/messages/read`, {
        method: 'POST'
      });
    } catch (err) {
      console.error('標記訊息為已讀錯誤:', err);
    }
  }, [applicationId]);

  // 獲取申請詳情
  const fetchApplicationDetail = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/applications/${applicationId}`);

      if (!response.ok) {
        throw new Error('獲取申請詳情失敗');
      }

      const data = await response.json();
      setApplication(data.data);

      // 標記訊息為已讀
      if (data.data.communications.unreadUserMessages > 0) {
        markMessagesAsRead();
      }
    } catch (err) {
      setError((err as Error).message);
      console.error('獲取申請詳情錯誤:', err);
    } finally {
      setLoading(false);
    }
  }, [applicationId, markMessagesAsRead]);

  // 當用戶登入狀態變化時獲取數據
  useEffect(() => {
    if (sessionStatus === 'authenticated' && applicationId) {
      fetchApplicationDetail();
    }
  }, [sessionStatus, applicationId, fetchApplicationDetail]);

  // 如果用戶未登入，重定向到登入頁面
  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/profile/applications');
    }
  }, [sessionStatus, router]);

  // 滾動到最新訊息
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [application?.communications.messages]);

  // 處理申請狀態變更
  const handleStatusChange = async (newStatus: ApplicationStatus) => {
    try {
      const confirmed = window.confirm(`確定要將申請狀態更改為「${statusNameMap[newStatus]}」嗎？`);

      if (!confirmed) return;

      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus
        })
      });

      if (!response.ok) {
        throw new Error('更新申請狀態失敗');
      }

      // 重新獲取申請詳情
      fetchApplicationDetail();
    } catch (err) {
      console.error('更新申請狀態錯誤:', err);
      alert((err as Error).message);
    }
  };

  // 發送訊息
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    setSendingMessage(true);
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: newMessage
        })
      });

      if (!response.ok) {
        throw new Error('發送訊息失敗');
      }

      // 清空輸入框並重新獲取申請詳情
      setNewMessage('');
      fetchApplicationDetail();
    } catch (err) {
      console.error('發送訊息錯誤:', err);
      alert((err as Error).message);
    } finally {
      setSendingMessage(false);
    }
  };

  // 如果用戶未登入或正在加載，顯示載入中
  if (sessionStatus === 'loading' || sessionStatus === 'unauthenticated') {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <ProfileLayout>
      <Head>
        <title>申請詳情 - TaiwanStay</title>
        <meta name="description" content="查看您的工作機會申請詳情" />
      </Head>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
          <button
            onClick={fetchApplicationDetail}
            className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
          >
            重試
          </button>
        </div>
      ) : !application ? (
        <div className="text-center py-12">
          <p className="text-gray-500">找不到申請詳情</p>
          <Link href="/profile/applications" className="mt-4 inline-block bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors">
            返回申請列表
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          {/* 頁面標題 */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="mb-2">
                  <Link href="/profile/applications" className="inline-flex items-center text-gray-600 hover:text-primary-600 transition-colors">
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                    </svg>
                    返回申請列表
                  </Link>
                </div>
                <h1 className="text-2xl font-bold">申請詳情</h1>
                <p className="text-gray-600 mt-1">
                  申請於 {format(new Date(application.createdAt), 'yyyy年MM月dd日', { locale: zhTW })}
                </p>
              </div>
              <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${statusColorMap[application.status]}`}>
                {statusNameMap[application.status]}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
            {/* 左側：機會和申請詳情 */}
            <div className="lg:col-span-2 space-y-6">
              {/* 機會詳情 */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center mb-4">
                  <div className="relative h-16 w-16 rounded-lg overflow-hidden mr-4">
                    {application.opportunityId.media?.images && application.opportunityId.media.images.length > 0 ? (
                      <Image
                        src={application.opportunityId.media.images[0].url}
                        alt={application.opportunityId.title}
                        layout="fill"
                        objectFit="cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 text-xl font-bold">
                          {application.opportunityId.title.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      <Link href={`/opportunities/${application.opportunityId.slug}`} className="hover:text-primary-600">
                        {application.opportunityId.title}
                      </Link>
                    </h3>
                    <p className="text-gray-600 text-sm">
                      主辦方: {application.hostId.name}
                    </p>
                    <p className="text-gray-600 text-sm">
                      類型: {application.opportunityId.type}
                    </p>
                  </div>
                </div>
                <Link href={`/opportunities/${application.opportunityId.slug}`} className="text-primary-600 hover:text-primary-700 text-sm font-medium inline-flex items-center">
                  查看機會詳情
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </Link>
              </div>

              {/* 申請詳情 */}
              <div>
                <h3 className="text-lg font-semibold mb-4">申請詳情</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-500">預計開始日期</p>
                    <p className="font-medium">
                      {format(new Date(application.applicationDetails.startDate), 'yyyy年MM月dd日', { locale: zhTW })}
                    </p>
                  </div>
                  {application.applicationDetails.endDate && (
                    <div>
                      <p className="text-sm text-gray-500">預計結束日期</p>
                      <p className="font-medium">
                        {format(new Date(application.applicationDetails.endDate), 'yyyy年MM月dd日', { locale: zhTW })}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500">停留時間</p>
                    <p className="font-medium">{application.applicationDetails.duration} 天</p>
                  </div>
                  {application.applicationDetails.nationality && (
                    <div>
                      <p className="text-sm text-gray-500">國籍</p>
                      <p className="font-medium">{application.applicationDetails.nationality}</p>
                    </div>
                  )}
                  {application.applicationDetails.visaType && (
                    <div>
                      <p className="text-sm text-gray-500">簽證類型</p>
                      <p className="font-medium">{application.applicationDetails.visaType}</p>
                    </div>
                  )}
                </div>

                {application.applicationDetails.travelingWith && (
                  <div className="mb-6">
                    <p className="text-sm text-gray-500 mb-1">同行者</p>
                    <ul className="list-disc list-inside text-gray-700">
                      {application.applicationDetails.travelingWith.partner && <li>伴侶/配偶</li>}
                      {application.applicationDetails.travelingWith.children && <li>孩子</li>}
                      {application.applicationDetails.travelingWith.pets && <li>寵物</li>}
                    </ul>
                    {application.applicationDetails.travelingWith.details && (
                      <p className="mt-2 text-gray-700">{application.applicationDetails.travelingWith.details}</p>
                    )}
                  </div>
                )}

                {application.applicationDetails.languages && application.applicationDetails.languages.length > 0 && (
                  <div className="mb-6">
                    <p className="text-sm text-gray-500 mb-1">語言</p>
                    <div className="flex flex-wrap gap-2">
                      {application.applicationDetails.languages.map((lang: any, index: number) => (
                        <span key={index} className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
                          {typeof lang === 'string'
                            ? lang
                            : (lang.language && `${lang.language}${lang.level ? ` (${lang.level})` : ''}`)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 飲食限制 */}
                {application.applicationDetails.dietaryRestrictions && (
                  Array.isArray(application.applicationDetails.dietaryRestrictions) ?
                    application.applicationDetails.dietaryRestrictions.length > 0 && (
                      <div className="mb-6">
                        <p className="text-sm text-gray-500 mb-1">飲食限制</p>
                        <p className="text-gray-700">{application.applicationDetails.dietaryRestrictions.join(', ')}</p>
                      </div>
                    ) : application.applicationDetails.dietaryRestrictions.type && application.applicationDetails.dietaryRestrictions.type.length > 0 && (
                      <div className="mb-6">
                        <p className="text-sm text-gray-500 mb-1">飲食限制</p>
                        <p className="text-gray-700">{application.applicationDetails.dietaryRestrictions.type.join(', ')}</p>
                        {application.applicationDetails.dietaryRestrictions.vegetarianType && (
                          <p className="text-gray-700 mt-1">素食類型: {application.applicationDetails.dietaryRestrictions.vegetarianType}</p>
                        )}
                        {application.applicationDetails.dietaryRestrictions.otherDetails && (
                          <p className="text-gray-700 mt-1">其他詳情: {application.applicationDetails.dietaryRestrictions.otherDetails}</p>
                        )}
                      </div>
                    )
                )}

                {application.applicationDetails.allergies && (
                  <div className="mb-6">
                    <p className="text-sm text-gray-500 mb-1">過敏情況</p>
                    <p className="text-gray-700">{application.applicationDetails.allergies}</p>
                  </div>
                )}

                {application.applicationDetails.drivingLicense && (
                  <div className="mb-6">
                    <p className="text-sm text-gray-500 mb-1">駕照</p>
                    <ul className="list-disc list-inside text-gray-700">
                      {application.applicationDetails.drivingLicense.motorcycle && <li>機車駕照</li>}
                      {application.applicationDetails.drivingLicense.car && <li>汽車駕照</li>}
                      {application.applicationDetails.drivingLicense.none && <li>無駕照</li>}
                      {application.applicationDetails.drivingLicense.other &&
                       application.applicationDetails.drivingLicense.other.enabled && (
                        <li>其他: {application.applicationDetails.drivingLicense.other.details}</li>
                      )}
                    </ul>
                  </div>
                )}

                {application.applicationDetails.workExperience &&
                 application.applicationDetails.workExperience.length > 0 && (
                  <div className="mb-6">
                    <p className="text-sm text-gray-500 mb-1">工作經驗</p>
                    <div className="space-y-3">
                      {application.applicationDetails.workExperience.map((exp, index) => (
                        <div key={index} className="border-l-2 border-gray-200 pl-3">
                          <p className="font-medium">{exp.position} - {exp.company}</p>
                          <p className="text-sm text-gray-600">
                            {exp.startDate} ~ {exp.isCurrent ? '至今' : exp.endDate}
                          </p>
                          {exp.description && <p className="text-sm mt-1">{exp.description}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {application.applicationDetails.skills && (
                  <div className="mb-6">
                    <p className="text-sm text-gray-500 mb-1">技能</p>
                    <p className="text-gray-700">{application.applicationDetails.skills}</p>
                  </div>
                )}

                {application.applicationDetails.physicalCondition && (
                  <div className="mb-6">
                    <p className="text-sm text-gray-500 mb-1">身體狀況</p>
                    <p className="text-gray-700">{application.applicationDetails.physicalCondition}</p>
                  </div>
                )}

                {application.applicationDetails.preferredWorkHours && (
                  <div className="mb-6">
                    <p className="text-sm text-gray-500 mb-1">偏好工作時間</p>
                    <p className="text-gray-700">{application.applicationDetails.preferredWorkHours}</p>
                  </div>
                )}

                {application.applicationDetails.accommodationNeeds && (
                  <div className="mb-6">
                    <p className="text-sm text-gray-500 mb-1">住宿需求</p>
                    <p className="text-gray-700">{application.applicationDetails.accommodationNeeds}</p>
                  </div>
                )}

                {application.applicationDetails.culturalInterests &&
                 application.applicationDetails.culturalInterests.length > 0 && (
                  <div className="mb-6">
                    <p className="text-sm text-gray-500 mb-1">文化興趣</p>
                    <div className="flex flex-wrap gap-2">
                      {application.applicationDetails.culturalInterests.map((interest, index) => (
                        <span key={index} className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {application.applicationDetails.learningGoals &&
                 application.applicationDetails.learningGoals.length > 0 && (
                  <div className="mb-6">
                    <p className="text-sm text-gray-500 mb-1">學習目標</p>
                    <div className="flex flex-wrap gap-2">
                      {application.applicationDetails.learningGoals.map((goal, index) => (
                        <span key={index} className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
                          {goal}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {application.applicationDetails.contribution && (
                  <div className="mb-6">
                    <p className="text-sm text-gray-500 mb-1">預期貢獻</p>
                    <p className="text-gray-700">{application.applicationDetails.contribution}</p>
                  </div>
                )}

                {application.applicationDetails.adaptabilityRatings && (
                  <div className="mb-6">
                    <p className="text-sm text-gray-500 mb-1">適應能力自評</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm">農場工作</p>
                        <div className="flex items-center mt-1">
                          {[...Array(5)].map((_, i) => (
                            <svg key={i} className={`w-4 h-4 ${i < (application.applicationDetails.adaptabilityRatings?.farmWork ?? 0) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                            </svg>
                          ))}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm">戶外工作</p>
                        <div className="flex items-center mt-1">
                          {[...Array(5)].map((_, i) => (
                            <svg key={i} className={`w-4 h-4 ${i < (application.applicationDetails.adaptabilityRatings?.outdoorWork ?? 0) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                            </svg>
                          ))}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm">體力工作</p>
                        <div className="flex items-center mt-1">
                          {[...Array(5)].map((_, i) => (
                            <svg key={i} className={`w-4 h-4 ${i < (application.applicationDetails.adaptabilityRatings?.physicalWork ?? 0) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                            </svg>
                          ))}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm">團隊合作</p>
                        <div className="flex items-center mt-1">
                          {[...Array(5)].map((_, i) => (
                            <svg key={i} className={`w-4 h-4 ${i < (application.applicationDetails.adaptabilityRatings?.teamWork ?? 0) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                            </svg>
                          ))}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm">獨立性</p>
                        <div className="flex items-center mt-1">
                          {[...Array(5)].map((_, i) => (
                            <svg key={i} className={`w-4 h-4 ${i < (application.applicationDetails.adaptabilityRatings?.independence ?? 0) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                            </svg>
                          ))}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm">適應力</p>
                        <div className="flex items-center mt-1">
                          {[...Array(5)].map((_, i) => (
                            <svg key={i} className={`w-4 h-4 ${i < (application.applicationDetails.adaptabilityRatings?.adaptability ?? 0) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                            </svg>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {application.applicationDetails.videoIntroduction && (
                  <div className="mb-6">
                    <p className="text-sm text-gray-500 mb-1">影片介紹</p>
                    <div className="aspect-w-16 aspect-h-9 mt-2">
                      {(() => {
                        let videoUrl = application.applicationDetails.videoIntroduction.url || '';
                        let videoId = '';

                        // 處理各種YouTube URL格式
                        if (videoUrl.includes('youtube.com/watch?v=')) {
                          try {
                            videoId = new URL(videoUrl).searchParams.get('v') || '';
                          } catch (e) {
                            // 處理URL解析錯誤
                            const match = videoUrl.match(/[?&]v=([^&]+)/);
                            if (match) videoId = match[1];
                          }
                        } else if (videoUrl.includes('youtu.be/')) {
                          const parts = videoUrl.split('youtu.be/');
                          if (parts.length > 1) {
                            videoId = parts[1].split('?')[0].split('&')[0];
                          }
                        } else if (videoUrl.includes('youtube.com/embed/')) {
                          const parts = videoUrl.split('youtube.com/embed/');
                          if (parts.length > 1) {
                            videoId = parts[1].split('?')[0].split('&')[0];
                          }
                        }

                        if (videoId) {
                          // 使用嵌入格式
                          const embedUrl = `https://www.youtube.com/embed/${videoId}`;
                          return (
                            <iframe
                              src={embedUrl}
                              className="w-full h-full rounded-lg"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              loading="lazy"
                            />
                          );
                        } else {
                          // 若無法解析為有效的YouTube ID，顯示原始連結
                          return (
                            <div className="bg-gray-100 p-4 rounded-lg text-center">
                              <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                                {videoUrl}
                              </a>
                              <p className="text-sm text-gray-500 mt-2">
                                無法嵌入影片，請點擊連結在新視窗中查看
                              </p>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  </div>
                )}

                {application.applicationDetails.photos &&
                 application.applicationDetails.photos.length > 0 && (
                  <div className="mb-6">
                    <p className="text-sm text-gray-500 mb-1">相片集</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                      {application.applicationDetails.photos.map((photo, index) => {
                        // 確保 URL 存在且有效
                        if (!photo || !photo.url) {
                          console.warn(`照片 #${index+1} 的 URL 無效:`, photo);
                          return (
                            <div key={index} className="relative h-48 w-full rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                              <span className="text-gray-500">無效照片</span>
                            </div>
                          );
                        }

                        // 將照片格式轉換為CloudinaryImage可接受的格式
                        const cloudinaryResource = {
                          publicId: photo.publicId,
                          secureUrl: photo.url,
                          thumbnailUrl: photo.url.replace('/upload/', '/upload/c_fill,g_auto,h_200,w_200/'),
                          previewUrl: photo.url.replace('/upload/', '/upload/c_scale,w_600/')
                        };

                        return (
                          <div key={index} className="relative h-48 w-full">
                            <CloudinaryImage
                              resource={cloudinaryResource}
                              alt={application.applicationDetails.photoDescriptions?.[photo.publicId] || `申請者照片 ${index + 1}`}
                              containerClassName="h-full w-full"
                              className="rounded-lg"
                              objectFit="cover"
                              isPrivate={true}
                              index={index}
                              onError={() => console.error(`照片 #${index+1} 載入失敗: ${photo.url}`)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {application.applicationDetails.specialRequirements && (
                  <div className="mb-6">
                    <p className="text-sm text-gray-500 mb-1">特殊需求</p>
                    <p className="text-gray-700">{application.applicationDetails.specialRequirements}</p>
                  </div>
                )}

                {application.applicationDetails.relevantExperience && (
                  <div className="mb-6">
                    <p className="text-sm text-gray-500 mb-1">相關經驗</p>
                    <p className="text-gray-700">{application.applicationDetails.relevantExperience}</p>
                  </div>
                )}

                {application.applicationDetails.motivation && (
                  <div className="mb-6">
                    <p className="text-sm text-gray-500 mb-1">動機和期望</p>
                    <p className="text-gray-700">{application.applicationDetails.motivation}</p>
                  </div>
                )}

                {application.applicationDetails.additionalNotes && (
                  <div className="mb-6">
                    <p className="text-sm text-gray-500 mb-1">其他備註</p>
                    <p className="text-gray-700">{application.applicationDetails.additionalNotes}</p>
                  </div>
                )}

                {application.applicationDetails.answers && application.applicationDetails.answers.length > 0 && (
                  <div className="mb-6">
                    <p className="text-sm text-gray-500 mb-1">問題回答</p>
                    <div className="space-y-4">
                      {application.applicationDetails.answers.map((item, index) => (
                        <div key={index}>
                          <p className="font-medium text-gray-700">{item.question}</p>
                          <p className="text-gray-700 mt-1">{item.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 狀態備註 */}
              {application.statusNote && (
                <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
                  <h4 className="font-medium text-yellow-800 mb-1">狀態備註</h4>
                  <p className="text-yellow-700">{application.statusNote}</p>
                </div>
              )}

              {/* 操作按鈕 */}
              <div className="flex flex-wrap gap-2 mt-6">
                {application.status === ApplicationStatus.PENDING && (
                  <button
                    onClick={() => handleStatusChange(ApplicationStatus.COMPLETED)}
                    className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    撤回申請
                  </button>
                )}

                {application.status === ApplicationStatus.ACCEPTED && (
                  <>
                    <button
                      onClick={() => handleStatusChange(ApplicationStatus.ACTIVE)}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                    >
                      確認參與
                    </button>
                    <button
                      onClick={() => handleStatusChange(ApplicationStatus.COMPLETED)}
                      className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      婉拒邀請
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* 右側：通訊記錄 */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden h-full flex flex-col">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold">通訊記錄</h3>
                </div>

                <div className="flex-1 overflow-y-auto p-4 max-h-[500px]">
                  {application.communications.messages.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">尚無通訊記錄</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {application.communications.messages.map((message) => {
                        const isCurrentUser = message.sender === session?.user?.id;
                        return (
                          <div key={message._id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-lg p-3 ${isCurrentUser ? 'bg-primary-100 text-primary-800' : 'bg-gray-100 text-gray-800'}`}>
                              <p className="text-sm">{message.content}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {format(new Date(message.timestamp), 'MM/dd HH:mm', { locale: zhTW })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-gray-200">
                  <form onSubmit={handleSendMessage} className="flex">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="輸入訊息..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:ring-primary-500 focus:border-primary-500"
                      disabled={sendingMessage}
                    />
                    <button
                      type="submit"
                      disabled={sendingMessage || !newMessage.trim()}
                      className="bg-primary-600 text-white px-4 py-2 rounded-r-md hover:bg-primary-700 transition-colors disabled:bg-gray-300"
                    >
                      {sendingMessage ? '發送中...' : '發送'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProfileLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const { slug } = context.params as { slug: string };
    const session = await getSession(context);

    // 返回正確的類型
    return {
      props: {
        applicationId: slug
      }
    };
  } catch (error) {
    console.error('獲取申請詳情失敗:', error);
    return {
      notFound: true
    };
  }
};

export default ApplicationDetailPage;