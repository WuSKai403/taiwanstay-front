import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import { connectToDatabase } from '@/lib/mongodb';
import Host from '@/models/Host';
import Opportunity from '@/models/Opportunity';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

// 主辦方類型定義
interface HostType {
  _id: string;
  name: string;
  description: string;
  profileImage?: string;
  location: {
    city?: string;
    district?: string;
    address?: string;
  };
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    line?: string;
  };
  rating?: {
    average: number;
    count: number;
  };
  createdAt: string;
  updatedAt: string;
}

// 機會類型定義
interface OpportunityType {
  _id: string;
  title: string;
  slug: string;
  description: string;
  coverImage?: string;
  location: {
    city?: string;
    district?: string;
  };
  startDate?: string;
  endDate?: string;
  skills: string[];
  status: string;
  createdAt: string;
}

interface HostDetailProps {
  host: HostType;
  opportunities: OpportunityType[];
}

export default function HostDetail({ host, opportunities }: HostDetailProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  // 如果頁面正在加載中
  if (router.isFallback) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      </Layout>
    );
  }

  // 如果沒有找到主辦方
  if (!host) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900">找不到主辦方</h1>
          <p className="mt-2 text-gray-600">該主辦方可能已被刪除或不存在</p>
          <Link href="/hosts" className="mt-4 inline-block text-primary-600 hover:text-primary-800">
            返回主辦方列表
          </Link>
        </div>
      </Layout>
    );
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'yyyy年MM月dd日', { locale: zhTW });
  };

  return (
    <Layout>
      <Head>
        <title>{host.name} - TaiwanStay</title>
        <meta name="description" content={`了解${host.name}提供的工作換宿機會`} />
      </Head>

      <div className="bg-white">
        {/* 主辦方頭部信息 */}
        <div className="bg-gray-50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:flex lg:items-center lg:justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-16 w-16 relative overflow-hidden rounded-full">
                    {host.profileImage ? (
                      <Image
                        src={host.profileImage}
                        alt={host.name}
                        layout="fill"
                        objectFit="cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 text-2xl font-bold">
                          {host.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                      {host.name}
                    </h1>
                    <div className="flex items-center mt-1">
                      <div className="flex items-center">
                        {[0, 1, 2, 3, 4].map((rating) => (
                          <svg
                            key={rating}
                            className={`h-5 w-5 ${
                              rating < Math.floor(host.rating?.average || 0)
                                ? 'text-yellow-400'
                                : 'text-gray-300'
                            }`}
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <p className="ml-1 text-sm text-gray-500">
                        {host.rating?.average.toFixed(1) || '無評分'} ({host.rating?.count || 0} 評價)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 flex lg:mt-0 lg:ml-4">
                {host.website && (
                  <a
                    href={host.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd" />
                    </svg>
                    網站
                  </a>
                )}
                {host.contactEmail && (
                  <a
                    href={`mailto:${host.contactEmail}`}
                    className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    聯繫
                  </a>
                )}
                {host.socialMedia?.facebook && (
                  <a
                    href={host.socialMedia.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    Facebook
                  </a>
                )}
                {host.socialMedia?.instagram && (
                  <a
                    href={host.socialMedia.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                    </svg>
                    Instagram
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 主辦方詳細信息 */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            {/* 左側信息 */}
            <div className="col-span-2">
              <div className="prose prose-lg max-w-none">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">關於主辦方</h2>
                <div className="whitespace-pre-line">{host.description}</div>
              </div>

              {/* 機會列表 */}
              <div className="mt-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">提供的機會</h2>
                {opportunities.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">暫無機會</h3>
                    <p className="mt-1 text-sm text-gray-500">該主辦方目前沒有提供任何工作換宿機會</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {opportunities.map((opportunity) => (
                      <Link key={opportunity._id} href={`/opportunities/${opportunity.slug}`} className="block">
                        <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
                          <div className="relative h-48 w-full">
                            {opportunity.coverImage ? (
                              <Image
                                src={opportunity.coverImage}
                                alt={opportunity.title}
                                layout="fill"
                                objectFit="cover"
                              />
                            ) : (
                              <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-500 text-lg">無圖片</span>
                              </div>
                            )}
                          </div>
                          <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg font-medium text-gray-900 truncate">{opportunity.title}</h3>
                            <div className="mt-2 flex items-center text-sm text-gray-500">
                              <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              </svg>
                              <span>{opportunity.location.city || '未指定'}{opportunity.location.district ? `, ${opportunity.location.district}` : ''}</span>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {opportunity.skills.slice(0, 3).map((skill, index) => (
                                <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                                  {skill}
                                </span>
                              ))}
                              {opportunity.skills.length > 3 && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  +{opportunity.skills.length - 3}
                                </span>
                              )}
                            </div>
                            <div className="mt-4 flex items-center justify-between">
                              <div className="text-sm text-gray-500">
                                {opportunity.startDate && opportunity.endDate ? (
                                  <span>
                                    {format(new Date(opportunity.startDate), 'MM/dd')} - {format(new Date(opportunity.endDate), 'MM/dd')}
                                  </span>
                                ) : (
                                  <span>時間未指定</span>
                                )}
                              </div>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                opportunity.status === 'open' ? 'bg-green-100 text-green-800' :
                                opportunity.status === 'closed' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {opportunity.status === 'open' ? '開放中' :
                                 opportunity.status === 'closed' ? '已關閉' : '即將開放'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 右側信息 */}
            <div className="mt-12 lg:mt-0">
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">主辦方信息</h3>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                  <dl className="sm:divide-y sm:divide-gray-200">
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">位置</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {host.location.city || '未指定'}
                        {host.location.district ? `, ${host.location.district}` : ''}
                        {host.location.address ? `, ${host.location.address}` : ''}
                      </dd>
                    </div>
                    {host.contactEmail && (
                      <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">電子郵件</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          <a href={`mailto:${host.contactEmail}`} className="text-primary-600 hover:text-primary-800">
                            {host.contactEmail}
                          </a>
                        </dd>
                      </div>
                    )}
                    {host.contactPhone && (
                      <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">電話</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          <a href={`tel:${host.contactPhone}`} className="text-primary-600 hover:text-primary-800">
                            {host.contactPhone}
                          </a>
                        </dd>
                      </div>
                    )}
                    {host.website && (
                      <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">網站</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          <a href={host.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-800">
                            {host.website}
                          </a>
                        </dd>
                      </div>
                    )}
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">加入時間</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {formatDate(host.createdAt)}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* 社交媒體連結 */}
              {(host.socialMedia?.facebook || host.socialMedia?.instagram || host.socialMedia?.line) && (
                <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">社交媒體</h3>
                  </div>
                  <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                    <dl className="sm:divide-y sm:divide-gray-200">
                      {host.socialMedia?.facebook && (
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Facebook</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            <a href={host.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-800">
                              前往 Facebook
                            </a>
                          </dd>
                        </div>
                      )}
                      {host.socialMedia?.instagram && (
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Instagram</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            <a href={host.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-800">
                              前往 Instagram
                            </a>
                          </dd>
                        </div>
                      )}
                      {host.socialMedia?.line && (
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Line</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            <a href={host.socialMedia.line} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-800">
                              前往 Line
                            </a>
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const { slug } = context.params as { slug: string };

    await connectToDatabase();

    // 獲取主辦方詳情
    const host = await Host.findById(slug).lean();

    if (!host) {
      return {
        notFound: true
      };
    }

    // 獲取該主辦方的機會列表
    const opportunities = await Opportunity.find({ hostId: slug })
      .sort({ createdAt: -1 })
      .lean();

    return {
      props: {
        host: JSON.parse(JSON.stringify(host)),
        opportunities: JSON.parse(JSON.stringify(opportunities))
      }
    };
  } catch (error) {
    console.error('獲取主辦方詳情失敗:', error);
    return {
      notFound: true
    };
  }
}