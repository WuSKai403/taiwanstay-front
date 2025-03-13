import { useState, useEffect, useRef } from 'react';
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

// 申請狀態中文名稱映射
const statusNameMap: Record<ApplicationStatus, string> = {
  [ApplicationStatus.DRAFT]: '草稿',
  [ApplicationStatus.PENDING]: '待審核',
  [ApplicationStatus.REVIEWING]: '審核中',
  [ApplicationStatus.ACCEPTED]: '已接受',
  [ApplicationStatus.REJECTED]: '已拒絕',
  [ApplicationStatus.CONFIRMED]: '已確認',
  [ApplicationStatus.CANCELLED]: '已取消',
  [ApplicationStatus.COMPLETED]: '已完成',
  [ApplicationStatus.WITHDRAWN]: '已撤回'
};

// 申請狀態顏色映射
const statusColorMap: Record<ApplicationStatus, string> = {
  [ApplicationStatus.DRAFT]: 'bg-gray-100 text-gray-800',
  [ApplicationStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
  [ApplicationStatus.REVIEWING]: 'bg-blue-100 text-blue-800',
  [ApplicationStatus.ACCEPTED]: 'bg-green-100 text-green-800',
  [ApplicationStatus.REJECTED]: 'bg-red-100 text-red-800',
  [ApplicationStatus.CONFIRMED]: 'bg-green-100 text-green-800',
  [ApplicationStatus.CANCELLED]: 'bg-gray-100 text-gray-800',
  [ApplicationStatus.COMPLETED]: 'bg-purple-100 text-purple-800',
  [ApplicationStatus.WITHDRAWN]: 'bg-gray-100 text-gray-800'
};

// 申請詳情接口
interface ApplicationDetail {
  _id: string;
  status: ApplicationStatus;
  statusNote?: string;
  opportunityId: {
    _id: string;
    title: string;
    slug: string;
    type: string;
    location?: {
      city?: string;
      district?: string;
    };
    media?: {
      images?: Array<{
        url: string;
        alt?: string;
      }>;
    };
  };
  hostId: {
    _id: string;
    name: string;
    profileImage?: string;
  };
  userId: {
    _id: string;
    name: string;
    email: string;
    profile?: {
      avatar?: string;
    };
  };
  applicationDetails: {
    message: string;
    startDate: string;
    endDate?: string;
    duration: number;
    travelingWith?: {
      partner: boolean;
      children: boolean;
      pets: boolean;
      details?: string;
    };
    answers?: {
      question: string;
      answer: string;
    }[];
    specialRequirements?: string;
    dietaryRestrictions?: string[];
    languages?: string[];
    relevantExperience?: string;
    motivation?: string;
  };
  communications: {
    messages: {
      _id: string;
      sender: string;
      content: string;
      timestamp: string;
      read: boolean;
    }[];
    lastMessageAt?: string;
    unreadHostMessages: number;
    unreadUserMessages: number;
  };
  createdAt: string;
  updatedAt: string;
}

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

  // 獲取申請詳情
  const fetchApplicationDetail = async () => {
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
  };

  // 標記訊息為已讀
  const markMessagesAsRead = async () => {
    try {
      await fetch(`/api/applications/${applicationId}/messages/read`, {
        method: 'POST'
      });
    } catch (err) {
      console.error('標記訊息為已讀錯誤:', err);
    }
  };

  // 當用戶登入狀態變化時獲取數據
  useEffect(() => {
    if (sessionStatus === 'authenticated' && applicationId) {
      fetchApplicationDetail();
    }
  }, [sessionStatus, applicationId]);

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
                      {application.applicationDetails.languages.map((lang, index) => (
                        <span key={index} className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {application.applicationDetails.dietaryRestrictions && application.applicationDetails.dietaryRestrictions.length > 0 && (
                  <div className="mb-6">
                    <p className="text-sm text-gray-500 mb-1">飲食限制</p>
                    <div className="flex flex-wrap gap-2">
                      {application.applicationDetails.dietaryRestrictions.map((diet, index) => (
                        <span key={index} className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
                          {diet}
                        </span>
                      ))}
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
                    onClick={() => handleStatusChange(ApplicationStatus.WITHDRAWN)}
                    className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    撤回申請
                  </button>
                )}

                {application.status === ApplicationStatus.ACCEPTED && (
                  <>
                    <button
                      onClick={() => handleStatusChange(ApplicationStatus.CONFIRMED)}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                    >
                      確認參與
                    </button>
                    <button
                      onClick={() => handleStatusChange(ApplicationStatus.WITHDRAWN)}
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
  const { id } = context.params as { id: string };

  return {
    props: {
      applicationId: id
    }
  };
};

export default ApplicationDetailPage;