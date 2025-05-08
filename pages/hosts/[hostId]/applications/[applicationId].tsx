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
import HostLayout from '@/components/layout/HostLayout';
import { getSession } from 'next-auth/react';
import { statusNameMap, statusColorMap, ApplicationDetail } from '@/constants/applicationStatus';

interface ApplicationDetailPageProps {
  hostId: string;
  applicationId: string;
}

const HostApplicationDetailPage: NextPage<ApplicationDetailPageProps> = ({ hostId, applicationId }) => {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 標記訊息為已讀
  const markMessagesAsRead = useCallback(async () => {
    try {
      await fetch(`/api/hosts/${hostId}/applications/${applicationId}/messages/read`, {
        method: 'POST'
      });
    } catch (err) {
      console.error('標記訊息為已讀錯誤:', err);
    }
  }, [hostId, applicationId]);

  // 獲取申請詳情
  const fetchApplicationDetail = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/hosts/${hostId}/applications/${applicationId}`);

      if (!response.ok) {
        throw new Error('獲取申請詳情失敗');
      }

      const data = await response.json();
      setApplication(data.data);

      // 標記訊息為已讀
      if (data.data.communications.unreadHostMessages > 0) {
        markMessagesAsRead();
      }
    } catch (err) {
      setError((err as Error).message);
      console.error('獲取申請詳情錯誤:', err);
    } finally {
      setLoading(false);
    }
  }, [hostId, applicationId, markMessagesAsRead]);

  // 當用戶登入狀態變化時獲取數據
  useEffect(() => {
    if (sessionStatus === 'authenticated' && applicationId) {
      fetchApplicationDetail();
    }
  }, [sessionStatus, applicationId, fetchApplicationDetail]);

  // 如果用戶未登入，重定向到登入頁面
  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/auth/signin');
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
    setChangingStatus(true);
    try {
      const response = await fetch(`/api/hosts/${hostId}/applications/${applicationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus,
          statusNote: statusNote
        })
      });

      if (!response.ok) {
        throw new Error('更新申請狀態失敗');
      }

      // 清空狀態備註並重新獲取申請詳情
      setStatusNote('');
      fetchApplicationDetail();
    } catch (err) {
      console.error('更新申請狀態錯誤:', err);
      alert((err as Error).message);
    } finally {
      setChangingStatus(false);
    }
  };

  // 發送訊息
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    setSendingMessage(true);
    try {
      const response = await fetch(`/api/hosts/${hostId}/applications/${applicationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: newMessage
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
    <HostLayout>
      <Head>
        <title>申請詳情 - TaiwanStay</title>
        <meta name="description" content="查看申請詳情並回覆申請者" />
      </Head>

      {loading ? (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden p-6">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        </div>
      ) : error ? (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden p-6">
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
            <button
              onClick={fetchApplicationDetail}
              className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
            >
              重試
            </button>
          </div>
        </div>
      ) : !application ? (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden p-6">
          <div className="text-center py-12">
            <p className="text-gray-500">找不到申請資訊</p>
            <Link
              href={`/hosts/${hostId}/applications`}
              className="mt-4 inline-block bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
            >
              返回申請列表
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* 頁面頂部 */}
          <div className="mb-6 flex justify-between items-center">
            <Link
              href={`/hosts/${hostId}/applications`}
              className="text-gray-500 flex items-center hover:text-gray-700"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
              </svg>
              返回申請列表
            </Link>
          </div>

          {/* 申請詳情卡片 */}
          <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-6">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <h1 className="text-2xl font-bold mb-2 md:mb-0">申請詳情</h1>
                <div className="flex items-center">
                  <span className={`px-3 py-1 rounded-full text-sm ${statusColorMap[application.status]}`}>
                    {statusNameMap[application.status]}
                  </span>
                  <span className="ml-2 text-sm text-gray-500">
                    {format(new Date(application.createdAt), 'yyyy 年 MM 月 dd 日', { locale: zhTW })}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* 申請人信息 */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4">申請人資訊</h2>
                <div className="flex items-start">
                  <div className="relative h-16 w-16 rounded-full overflow-hidden mr-4">
                    {application.userId.profile?.avatar ? (
                      <Image
                        src={application.userId.profile.avatar}
                        alt={application.userId.name}
                        fill
                        sizes="64px"
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 text-xl font-bold">
                          {application.userId.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{application.userId.name}</h3>
                    <p className="text-gray-500">{application.userId.email}</p>
                    <Link href={`/profile/${application.userId._id}`} className="text-primary-600 hover:underline text-sm mt-1 inline-block">
                      查看個人資料
                    </Link>
                  </div>
                </div>
              </div>

              {/* 工作機會 */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4">工作機會資訊</h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg">{application.opportunityId.title}</h3>
                  <p className="text-gray-500 mt-1">
                    {application.opportunityId.location?.city} {application.opportunityId.location?.district}
                  </p>
                  <Link
                    href={`/opportunities/${application.opportunityId.slug}`}
                    className="text-primary-600 hover:underline text-sm mt-2 inline-block"
                  >
                    查看工作機會詳情
                  </Link>
                </div>
              </div>

              {/* 申請詳情 */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4">申請詳情</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">申請期間</h3>
                    <p>
                      {format(new Date(application.applicationDetails.startDate), 'yyyy 年 MM 月', { locale: zhTW })}
                      {application.applicationDetails.endDate && (
                        <>
                          {' - '}
                          {format(new Date(application.applicationDetails.endDate), 'yyyy 年 MM 月', { locale: zhTW })}
                        </>
                      )}
                      （{application.applicationDetails.duration} 天）
                    </p>
                  </div>

                  {application.applicationDetails.travelingWith && (
                    <div>
                      <h3 className="font-medium text-gray-700 mb-2">同行人員</h3>
                      <ul className="list-disc pl-5">
                        {application.applicationDetails.travelingWith.partner && <li>伴侶</li>}
                        {application.applicationDetails.travelingWith.children && <li>孩子</li>}
                        {application.applicationDetails.travelingWith.pets && <li>寵物</li>}
                      </ul>
                      {application.applicationDetails.travelingWith.details && (
                        <p className="mt-2 text-gray-600">{application.applicationDetails.travelingWith.details}</p>
                      )}
                    </div>
                  )}

                  {application.applicationDetails.languages && application.applicationDetails.languages.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-700 mb-2">語言能力</h3>
                      <p>{application.applicationDetails.languages.join(', ')}</p>
                    </div>
                  )}

                  {application.applicationDetails.dietaryRestrictions && (
                    Array.isArray(application.applicationDetails.dietaryRestrictions) ?
                      application.applicationDetails.dietaryRestrictions.length > 0 && (
                        <div>
                          <h3 className="font-medium text-gray-700 mb-2">飲食限制</h3>
                          <p>{application.applicationDetails.dietaryRestrictions.join(', ')}</p>
                        </div>
                      ) : application.applicationDetails.dietaryRestrictions.type && application.applicationDetails.dietaryRestrictions.type.length > 0 && (
                        <div>
                          <h3 className="font-medium text-gray-700 mb-2">飲食限制</h3>
                          <p>{application.applicationDetails.dietaryRestrictions.type.join(', ')}</p>
                          {application.applicationDetails.dietaryRestrictions.vegetarianType && (
                            <p className="mt-1">素食類型: {application.applicationDetails.dietaryRestrictions.vegetarianType}</p>
                          )}
                          {application.applicationDetails.dietaryRestrictions.otherDetails && (
                            <p className="mt-1">其他詳情: {application.applicationDetails.dietaryRestrictions.otherDetails}</p>
                          )}
                        </div>
                      )
                  )}

                  {application.applicationDetails.relevantExperience && (
                    <div className="md:col-span-2">
                      <h3 className="font-medium text-gray-700 mb-2">相關經驗</h3>
                      <p className="whitespace-pre-wrap">{application.applicationDetails.relevantExperience}</p>
                    </div>
                  )}

                  {application.applicationDetails.motivation && (
                    <div className="md:col-span-2">
                      <h3 className="font-medium text-gray-700 mb-2">申請動機</h3>
                      <p className="whitespace-pre-wrap">{application.applicationDetails.motivation}</p>
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <h3 className="font-medium text-gray-700 mb-2">申請訊息</h3>
                    <p className="whitespace-pre-wrap">{application.applicationDetails.message}</p>
                  </div>

                  {application.applicationDetails.specialRequirements && (
                    <div className="md:col-span-2">
                      <h3 className="font-medium text-gray-700 mb-2">特殊需求</h3>
                      <p className="whitespace-pre-wrap">{application.applicationDetails.specialRequirements}</p>
                    </div>
                  )}

                  {application.applicationDetails.answers && application.applicationDetails.answers.length > 0 && (
                    <div className="md:col-span-2">
                      <h3 className="font-medium text-gray-700 mb-2">問題回答</h3>
                      <div className="space-y-4">
                        {application.applicationDetails.answers.map((answer, index) => (
                          <div key={index}>
                            <p className="font-medium">{answer.question}</p>
                            <p className="text-gray-600 mt-1">{answer.answer}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 狀態更新 */}
              {[ApplicationStatus.PENDING].includes(application.status) && (
                <div className="mb-8 border-t border-gray-200 pt-6">
                  <h2 className="text-lg font-semibold mb-4">更新申請狀態</h2>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="mb-4">
                      <label htmlFor="statusNote" className="block text-sm font-medium text-gray-700 mb-2">
                        狀態備註（可選）
                      </label>
                      <textarea
                        id="statusNote"
                        rows={3}
                        value={statusNote}
                        onChange={(e) => setStatusNote(e.target.value)}
                        className="focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        placeholder="如有需要，請填寫狀態變更的備註說明"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {application.status === ApplicationStatus.PENDING && (
                        <button
                          onClick={() => handleStatusChange(ApplicationStatus.PENDING)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                          disabled={changingStatus}
                        >
                          開始審核
                        </button>
                      )}
                      {[ApplicationStatus.PENDING].includes(application.status) && (
                        <>
                          <button
                            onClick={() => handleStatusChange(ApplicationStatus.ACCEPTED)}
                            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                            disabled={changingStatus}
                          >
                            接受申請
                          </button>
                          <button
                            onClick={() => handleStatusChange(ApplicationStatus.REJECTED)}
                            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                            disabled={changingStatus}
                          >
                            拒絕申請
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 溝通訊息 */}
              <div className="border-t border-gray-200 pt-6">
                <h2 className="text-lg font-semibold mb-4">溝通訊息</h2>
                {application.communications.messages.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">目前還沒有訊息記錄</p>
                  </div>
                ) : (
                  <div className="mb-4 bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                    <div className="space-y-4">
                      {application.communications.messages.map((message) => {
                        const isFromUser = message.sender === application.userId._id;
                        return (
                          <div
                            key={message._id}
                            className={`flex ${isFromUser ? 'justify-start' : 'justify-end'}`}
                          >
                            <div
                              className={`max-w-[75%] px-4 py-2 rounded-lg ${
                                isFromUser ? 'bg-white border border-gray-200' : 'bg-primary-100'
                              }`}
                            >
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-medium text-sm">
                                  {isFromUser ? application.userId.name : '您'}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {format(new Date(message.timestamp), 'MM/dd HH:mm', { locale: zhTW })}
                                </span>
                              </div>
                              <p className="whitespace-pre-wrap">{message.content}</p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>
                )}

                {/* 訊息輸入框 */}
                <form onSubmit={handleSendMessage}>
                  <div className="flex items-start mt-4">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1 border border-gray-300 rounded-l-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      rows={3}
                      placeholder="輸入訊息..."
                      disabled={sendingMessage}
                    ></textarea>
                    <button
                      type="submit"
                      className="bg-primary-600 text-white px-4 py-2 rounded-r-md hover:bg-primary-700 transition-colors h-full disabled:opacity-50"
                      disabled={!newMessage.trim() || sendingMessage}
                    >
                      {sendingMessage ? '發送中...' : '發送'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </HostLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  // 檢查用戶是否登入
  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }

  const hostId = context.params?.hostId as string;
  const applicationId = context.params?.applicationId as string;

  // 檢查用戶是否為該主人
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/hosts/${hostId}/validate`, {
      headers: {
        cookie: context.req.headers.cookie || '',
      },
    });

    if (!response.ok) {
      return {
        redirect: {
          destination: '/profile',
          permanent: false,
        },
      };
    }
  } catch (error) {
    console.error('驗證主人權限錯誤:', error);
    return {
      redirect: {
        destination: '/profile',
        permanent: false,
      },
    };
  }

  return {
    props: {
      hostId,
      applicationId,
    },
  };
};

export default HostApplicationDetailPage;