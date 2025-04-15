import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import Head from 'next/head';
import { UserRole } from '@/models/enums/UserRole';
import { ApplicationStatus } from '@/models/enums/ApplicationStatus';
import {
  UserIcon,
  ClipboardDocumentCheckIcon,
  CheckIcon,
  XMarkIcon,
  ChatBubbleBottomCenterTextIcon,
  ArrowLeftIcon,
  CalendarIcon,
  HomeIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  DocumentTextIcon,
  ClockIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { IApplication } from '@/models/Application';
import mongoose from 'mongoose';

// 擴展 IApplication 以包含關聯數據
interface ApplicationWithRelations {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  hostId?: mongoose.Types.ObjectId;
  opportunityId?: mongoose.Types.ObjectId;
  status: ApplicationStatus;
  statusNote?: string;
  applicationDetails?: {
    startMonth?: string;
    endMonth?: string;
    duration?: number;
    message?: string;
    nationality?: string;
    visaType?: string;
    languages?: Array<{ language: string; level: string }>;
    dietaryRestrictions?: {
      type: string[] | string;
      otherDetails?: string;
    };
    relevantExperience?: string;
    motivation?: string;
    [key: string]: any;
  };
  communications?: {
    messages?: Array<{
      sender: string;
      content: string;
      timestamp: Date;
    }>;
  };
  user?: {
    _id: string;
    name?: string;
    email?: string;
    image?: string;
    profile?: {
      phoneNumber?: string;
      [key: string]: any;
    };
  };
  host?: {
    _id: string;
    name?: string;
    type?: string;
    category?: string;
    media?: {
      logo?: string;
    };
    contactInfo?: {
      email?: string;
      phone?: string;
    };
    location?: {
      address: string;
      city: string;
      district?: string;
      zipCode?: string;
      country: string;
    };
  };
  opportunity?: {
    _id: string;
    title?: string;
    description?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any;
}

// 狀態標籤組件
const StatusBadge = ({ status }: { status: ApplicationStatus }) => {
  const statusConfig = {
    [ApplicationStatus.DRAFT]: { text: '草稿', bgColor: 'bg-gray-100', textColor: 'text-gray-800' },
    [ApplicationStatus.PENDING]: { text: '待審核', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
    [ApplicationStatus.ACCEPTED]: { text: '已接受', bgColor: 'bg-green-100', textColor: 'text-green-800' },
    [ApplicationStatus.REJECTED]: { text: '已拒絕', bgColor: 'bg-red-100', textColor: 'text-red-800' },
    [ApplicationStatus.ACTIVE]: { text: '進行中', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
    [ApplicationStatus.COMPLETED]: { text: '已完成', bgColor: 'bg-purple-100', textColor: 'text-purple-800' },
  };

  const config = statusConfig[status] || { text: '未知', bgColor: 'bg-gray-100', textColor: 'text-gray-800' };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.bgColor} ${config.textColor}`}>
      {config.text}
    </span>
  );
};

export default function ApplicationDetail() {
  const router = useRouter();
  const { applicationId } = router.query;
  const { data: session, status: sessionStatus } = useSession();
  const [application, setApplication] = useState<ApplicationWithRelations | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusNote, setStatusNote] = useState<string>('');
  const [showStatusModal, setShowStatusModal] = useState<boolean>(false);
  const [pendingStatus, setPendingStatus] = useState<ApplicationStatus | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  // 載入申請資料
  useEffect(() => {
    if (typeof window !== 'undefined' && session && applicationId) {
      // 檢查用戶權限
      if (session?.user?.role !== UserRole.ADMIN && session?.user?.role !== UserRole.SUPER_ADMIN) {
        router.push('/');
        return;
      }

      fetchApplicationData();
    }
  }, [session, router, applicationId]);

  const fetchApplicationData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/applications/${applicationId}`);
      if (response.ok) {
        const data = await response.json();
        setApplication(data);
      } else {
        alert('無法獲取申請資料');
      }
    } catch (error) {
      console.error('獲取申請資料失敗', error);
    } finally {
      setLoading(false);
    }
  };

  // 處理狀態更新
  const handleStatusChange = (newStatus: ApplicationStatus) => {
    setPendingStatus(newStatus);
    setShowStatusModal(true);
  };

  const confirmStatusChange = async () => {
    if (!pendingStatus) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/applications/${applicationId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: pendingStatus,
          statusNote: statusNote
        }),
      });

      if (response.ok) {
        // 更新狀態成功後重新獲取資料
        await fetchApplicationData();
        setShowStatusModal(false);
        setPendingStatus(null);
        setStatusNote('');
      } else {
        const errorData = await response.json();
        alert(`更新失敗: ${errorData.message}`);
      }
    } catch (error) {
      console.error('更新申請狀態失敗', error);
      alert('更新申請狀態時發生錯誤，請稍後再試。');
    } finally {
      setSaving(false);
    }
  };

  // 處理登入狀態
  if (sessionStatus === 'loading' || loading) {
    return <div className="min-h-screen flex items-center justify-center">載入中...</div>;
  }

  if (!session || (session?.user?.role !== UserRole.ADMIN && session?.user?.role !== UserRole.SUPER_ADMIN)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">無權限訪問</h1>
        <p className="mb-6">您沒有管理員權限，無法訪問此頁面。</p>
        <Link href="/" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">返回首頁</Link>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">找不到申請</h1>
        <p className="mb-6">無法找到指定的申請資料。</p>
        <Link href="/admin/applications" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">返回申請列表</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Head>
        <title>申請詳情 - 管理員</title>
      </Head>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/admin/applications" className="flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            返回申請列表
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
          {/* 申請標題與狀態 */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {application.opportunity?.title || '未知機會'} 申請
                </h1>
                <div className="mt-1 text-gray-600">
                  申請者: {application.user?.name || '未知用戶'}
                </div>
              </div>
              <div className="mt-4 md:mt-0">
                <StatusBadge status={application.status} />
                {application.statusNote && (
                  <p className="mt-2 text-sm text-gray-500">
                    狀態備註: {application.statusNote}
                  </p>
                )}
              </div>
            </div>

            {/* 關鍵資訊摘要 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="flex items-center">
                <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <div className="text-sm text-gray-500">申請期間</div>
                  <div className="text-sm font-medium text-gray-900">
                    {application.applicationDetails?.startMonth?.replace('-', '/')}
                    {application.applicationDetails?.endMonth && ` - ${application.applicationDetails.endMonth.replace('-', '/')}`}
                    {' ('}{application.applicationDetails?.duration || '?'} 天)
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <div className="text-sm text-gray-500">申請者</div>
                  <div className="text-sm font-medium text-gray-900">
                    {application.user?.email || '無郵箱'}
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <div className="text-sm text-gray-500">申請日期</div>
                  <div className="text-sm font-medium text-gray-900">
                    {format(new Date(application.createdAt), 'yyyy年MM月dd日', { locale: zhTW })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 主要內容區 */}
          <div className="p-6">
            {/* 申請訊息 */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">申請訊息</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-line">{application.applicationDetails?.message}</p>
              </div>
            </div>

            {/* 申請者資訊 */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">申請者資訊</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0 h-16 w-16 mr-4">
                    {application.user?.image ? (
                      <img
                        className="h-16 w-16 rounded-full object-cover"
                        src={application.user.image}
                        alt={application.user.name}
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-2xl">
                        {application.user?.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{application.user?.name}</h3>
                    <div className="flex items-center text-gray-600 mt-1">
                      <EnvelopeIcon className="h-4 w-4 mr-1" />
                      {application.user?.email}
                    </div>
                    {application.user?.profile?.phoneNumber && (
                      <div className="flex items-center text-gray-600 mt-1">
                        <PhoneIcon className="h-4 w-4 mr-1" />
                        {application.user.profile.phoneNumber}
                      </div>
                    )}
                  </div>
                </div>

                {/* 申請者詳細資訊 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {application.applicationDetails?.nationality && (
                    <div>
                      <div className="text-sm text-gray-500">國籍</div>
                      <div className="text-sm font-medium">{application.applicationDetails.nationality}</div>
                    </div>
                  )}
                  {application.applicationDetails?.visaType && (
                    <div>
                      <div className="text-sm text-gray-500">簽證類型</div>
                      <div className="text-sm font-medium">{application.applicationDetails.visaType}</div>
                    </div>
                  )}
                  {application.applicationDetails?.languages && application.applicationDetails.languages.length > 0 && (
                    <div>
                      <div className="text-sm text-gray-500">語言能力</div>
                      <div className="text-sm font-medium">
                        {application.applicationDetails.languages.map(lang => (
                          `${lang.language} (${lang.level})`
                        )).join(', ')}
                      </div>
                    </div>
                  )}
                  {application.applicationDetails?.dietaryRestrictions && (
                    <div>
                      <div className="text-sm text-gray-500">飲食限制</div>
                      <div className="text-sm font-medium">
                        {Array.isArray(application.applicationDetails.dietaryRestrictions.type)
                          ? application.applicationDetails.dietaryRestrictions.type.join(', ')
                          : '無'
                        }
                        {application.applicationDetails.dietaryRestrictions.otherDetails &&
                          ` (${application.applicationDetails.dietaryRestrictions.otherDetails})`
                        }
                      </div>
                    </div>
                  )}
                </div>

                {/* 相關經驗與技能 */}
                {application.applicationDetails?.relevantExperience && (
                  <div className="mt-4">
                    <div className="text-sm text-gray-500">相關經驗</div>
                    <div className="text-sm whitespace-pre-line mt-1">
                      {application.applicationDetails.relevantExperience}
                    </div>
                  </div>
                )}

                {application.applicationDetails?.motivation && (
                  <div className="mt-4">
                    <div className="text-sm text-gray-500">申請動機</div>
                    <div className="text-sm whitespace-pre-line mt-1">
                      {application.applicationDetails.motivation}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 主辦方資訊 */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">主辦方資訊</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0 h-12 w-12 mr-4">
                    {application.host?.media?.logo ? (
                      <div className="relative h-12 w-12">
                        <Image
                          className="rounded-full object-cover"
                          src={application.host.media.logo}
                          alt={application.host.name || '主辦方'}
                          fill
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xl">
                        {application.host?.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-md font-medium text-gray-900">{application.host?.name}</h3>
                    <p className="text-sm text-gray-600">{application.host?.type} / {application.host?.category}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">聯絡郵箱</div>
                    <div className="text-sm font-medium">{application.host?.contactInfo?.email}</div>
                  </div>
                  {application.host?.contactInfo?.phone && (
                    <div>
                      <div className="text-sm text-gray-500">聯絡電話</div>
                      <div className="text-sm font-medium">{application.host.contactInfo.phone}</div>
                    </div>
                  )}
                </div>

                {application.host?.location && (
                  <div className="mt-4">
                    <div className="text-sm text-gray-500">地址</div>
                    <div className="text-sm font-medium flex items-start mt-1">
                      <MapPinIcon className="h-4 w-4 text-gray-400 mr-1 mt-0.5" />
                      <span>
                        {application.host.location.address}, {application.host.location.city}
                        {application.host.location.district && `, ${application.host.location.district}`}
                        {application.host.location.zipCode && ` ${application.host.location.zipCode}`}
                        , {application.host.location.country}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 機會資訊 */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">機會資訊</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-md font-medium text-gray-900 mb-2">{application.opportunity?.title}</h3>

                {application.opportunity?.description && (
                  <div className="mt-2">
                    <div className="text-sm text-gray-700 line-clamp-3">
                      {application.opportunity.description.slice(0, 300)}
                      {application.opportunity.description.length > 300 && '...'}
                    </div>
                    <Link href={`/admin/opportunities/${application.opportunityId}`} className="text-sm text-blue-600 hover:underline mt-1 inline-block">
                      查看完整機會資訊
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* 溝通記錄 */}
            {application.communications?.messages && application.communications.messages.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">溝通記錄</h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  {application.communications.messages.map((message, index) => (
                    <div key={index} className="mb-4 last:mb-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {message.sender === application.userId?.toString()
                            ? application.user?.name || '申請者'
                            : application.host?.name || '主辦方'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {format(new Date(message.timestamp), 'yyyy/MM/dd HH:mm', { locale: zhTW })}
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded-lg text-sm">
                        {message.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 操作按鈕 */}
        {application.status === ApplicationStatus.PENDING && (
          <div className="flex space-x-4 mb-8">
            <button
              onClick={() => handleStatusChange(ApplicationStatus.ACCEPTED)}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <CheckIcon className="h-5 w-5 mr-2" />
              接受申請
            </button>
            <button
              onClick={() => handleStatusChange(ApplicationStatus.REJECTED)}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              <XMarkIcon className="h-5 w-5 mr-2" />
              拒絕申請
            </button>
          </div>
        )}

        {/* 相關連結 */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">相關連結</h2>
          <div className="flex flex-col space-y-3">
            <Link href={`/admin/users/${application.userId?.toString()}`} className="text-blue-600 hover:underline flex items-center">
              <UserIcon className="h-4 w-4 mr-1" />
              查看申請者資料
            </Link>
            <Link href={`/admin/hosts/${application.hostId?.toString()}`} className="text-blue-600 hover:underline flex items-center">
              <HomeIcon className="h-4 w-4 mr-1" />
              查看主辦方資料
            </Link>
            <Link href={`/admin/opportunities/${application.opportunityId?.toString()}`} className="text-blue-600 hover:underline flex items-center">
              <BriefcaseIcon className="h-4 w-4 mr-1" />
              查看機會詳情
            </Link>
          </div>
        </div>
      </div>

      {/* 狀態更新模態框 */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">更新申請狀態</h2>
            <p className="mb-4">
              確定要{pendingStatus === ApplicationStatus.ACCEPTED ? '接受' : '拒絕'}此申請嗎？
            </p>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                狀態備註 (選填)
              </label>
              <textarea
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="請輸入備註說明原因（將會通知申請者）"
              ></textarea>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setPendingStatus(null);
                  setStatusNote('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                disabled={saving}
              >
                取消
              </button>
              <button
                onClick={confirmStatusChange}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={saving}
              >
                {saving ? '處理中...' : '確認'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}