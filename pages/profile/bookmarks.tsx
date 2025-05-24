import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import ProfileLayout from '@/components/layout/ProfileLayout';
import { MediaImage } from '@/lib/types/media';

// 收藏項目類型
interface BookmarkItem {
  _id: string;
  opportunityId: {
    _id: string;
    title: string;
    slug: string;
    coverImage?: MediaImage;
    location?: {
      city?: string;
      district?: string;
    };
    hostId: {
      _id: string;
      name: string;
      profileImage?: MediaImage;
    };
  };
  createdAt: string;
}

const BookmarksPage: NextPage = () => {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session } = useSession();

  useEffect(() => {
    const fetchBookmarks = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/users/bookmarks');
        if (response.ok) {
          const data = await response.json();
          setBookmarks(data.bookmarks || []);
        } else {
          console.error('獲取收藏失敗');
        }
      } catch (error) {
        console.error('獲取收藏出錯:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      fetchBookmarks();
    }
  }, [session]);

  // 移除收藏
  const handleRemoveBookmark = async (bookmarkId: string) => {
    try {
      const response = await fetch(`/api/users/bookmarks/${bookmarkId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // 更新列表
        setBookmarks(bookmarks.filter(bookmark => bookmark._id !== bookmarkId));
      } else {
        console.error('移除收藏失敗');
      }
    } catch (error) {
      console.error('移除收藏出錯:', error);
    }
  };

  return (
    <ProfileLayout>
      <Head>
        <title>我的收藏 - TaiwanStay</title>
        <meta name="description" content="查看您收藏的工作機會" />
      </Head>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold">我的收藏</h1>
          <p className="text-gray-600 mt-1">管理您收藏的工作機會</p>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
          ) : bookmarks.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">沒有收藏</h3>
              <p className="mt-1 text-sm text-gray-500">
                您尚未收藏任何工作機會
              </p>
              <div className="mt-6">
                <Link
                  href="/opportunities"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  瀏覽工作機會
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
              {bookmarks.map((bookmark) => (
                <div key={bookmark._id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="relative h-48 w-full">
                    {bookmark.opportunityId.coverImage ? (
                      <Image
                        src={bookmark.opportunityId.coverImage.secureUrl || bookmark.opportunityId.coverImage.url || ''}
                        alt={bookmark.opportunityId.coverImage.alt || bookmark.opportunityId.title}
                        layout="fill"
                        objectFit="cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 text-lg">無圖片</span>
                      </div>
                    )}
                    <button
                      onClick={() => handleRemoveBookmark(bookmark._id)}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-100"
                      aria-label="移除收藏"
                    >
                      <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center mb-3">
                      <div className="flex-shrink-0 h-8 w-8 relative overflow-hidden rounded-full mr-2">
                        {bookmark.opportunityId.hostId.profileImage ? (
                          <Image
                            src={bookmark.opportunityId.hostId.profileImage.secureUrl || bookmark.opportunityId.hostId.profileImage.url || ''}
                            alt={bookmark.opportunityId.hostId.profileImage.alt || bookmark.opportunityId.hostId.name}
                            layout="fill"
                            objectFit="cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-500 text-sm font-bold">
                              {bookmark.opportunityId.hostId.name.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="text-sm text-gray-700">
                        {bookmark.opportunityId.hostId.name}
                      </span>
                    </div>

                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {bookmark.opportunityId.title}
                    </h3>

                    <div className="mb-2 flex items-center text-sm text-gray-500">
                      <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      <span>
                        {bookmark.opportunityId.location ? (
                          `${bookmark.opportunityId.location.city || '未指定'}${bookmark.opportunityId.location.district ? `, ${bookmark.opportunityId.location.district}` : ''}`
                        ) : (
                          '地點未指定'
                        )}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        收藏於 {format(new Date(bookmark.createdAt), 'yyyy/MM/dd', { locale: zhTW })}
                      </div>
                      <Link
                        href={`/opportunities/${bookmark.opportunityId.slug}`}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                      >
                        查看詳情
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProfileLayout>
  );
};

export default BookmarksPage;