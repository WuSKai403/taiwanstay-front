import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import OpportunityHeader from './OpportunityHeader';
import OpportunityContent from './OpportunityContent';
import OpportunitySidebar from './OpportunitySidebar';
import OpportunityActions from './OpportunityActions';
import { OpportunityDetail as OpportunityDetailType } from './constants';

interface OpportunityDetailPageProps {
  opportunity: OpportunityDetailType;
}

const OpportunityDetailPage: React.FC<OpportunityDetailPageProps> = ({ opportunity }) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { data: session, status } = useSession();

  // 檢查用戶是否已收藏此機會
  useEffect(() => {
    const checkBookmarkStatus = async () => {
      if (status === 'authenticated' && opportunity?.id) {
        try {
          console.log('檢查書籤狀態:', {
            opportunityId: opportunity.id,
            sessionStatus: status,
            userId: session?.user?.id
          });

          const response = await fetch(`/api/bookmarks?opportunityId=${opportunity.id}`);
          if (!response.ok) {
            const errorData = await response.json();
            console.error('書籤檢查失敗:', {
              status: response.status,
              error: errorData
            });
            setError(errorData.error || '檢查收藏狀態失敗');
            return;
          }

          const data = await response.json();
          setIsBookmarked(data.isBookmarked);
        } catch (err) {
          console.error('檢查收藏狀態失敗:', err);
          setError('檢查收藏狀態時發生錯誤');
        }
      }
    };

    checkBookmarkStatus();
  }, [status, opportunity?.id, session]);

  // 更新瀏覽次數
  useEffect(() => {
    const updateViewCount = async () => {
      if (opportunity?.id) {
        try {
          await fetch(`/api/opportunities/${opportunity.id}/view`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          });
        } catch (err) {
          console.error('更新瀏覽次數失敗:', err);
        }
      }
    };

    updateViewCount();
  }, [opportunity?.id]);

  // 如果頁面正在生成中
  if (router.isFallback) {
    return (
      <Layout>
        <div className="min-h-screen flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      </Layout>
    );
  }

  // 如果沒有機會資料
  if (!opportunity) {
    return (
      <Layout>
        <div className="min-h-screen flex justify-center items-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">找不到此機會</h1>
            <Link href="/opportunities" className="text-primary-600 hover:text-primary-700">
              返回機會列表
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`${opportunity.title} - TaiwanStay`} description={opportunity.shortDescription}>
      <div className="bg-gray-50 min-h-screen">
        {/* 頁面標題 */}
        <OpportunityHeader opportunity={opportunity} />

        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 左側主要內容 */}
            <OpportunityContent opportunity={opportunity} />

            {/* 右側邊欄 */}
            <OpportunitySidebar
              opportunity={opportunity}
              isBookmarked={isBookmarked}
              setIsBookmarked={setIsBookmarked}
            />
          </div>
        </div>
      </div>

      {/* 聯絡按鈕 */}
      <OpportunityActions opportunity={opportunity} />
    </Layout>
  );
};

export default OpportunityDetailPage;