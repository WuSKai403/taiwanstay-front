import { useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { OpportunityDetail } from './constants';

interface OpportunityInteractionButtonsProps {
  opportunity: OpportunityDetail;
  isBookmarked: boolean;
  setIsBookmarked: (value: boolean) => void;
}

const OpportunityInteractionButtons: React.FC<OpportunityInteractionButtonsProps> = ({
  opportunity,
  isBookmarked,
  setIsBookmarked
}) => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 處理收藏/取消收藏
  const handleBookmark = async () => {
    if (status !== 'authenticated') {
      // 如果用戶未登入，重定向到登入頁面
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(router.asPath)}`);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/bookmarks', {
        method: isBookmarked ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          opportunityId: opportunity.id
        })
      });

      if (response.ok) {
        setIsBookmarked(!isBookmarked);
      } else {
        const data = await response.json();
        setError(data.message || '操作失敗');
      }
    } catch (err) {
      setError((err as Error).message || '操作失敗');
      console.error('收藏操作失敗:', err);
    } finally {
      setLoading(false);
    }
  };

  // 處理申請
  const handleApply = () => {
    if (status !== 'authenticated') {
      // 如果用戶未登入，重定向到登入頁面
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(router.asPath)}`);
      return;
    }

    // 重定向到申請頁面
    router.push(`/opportunities/${opportunity.slug}/apply`);
  };

  return (
    <div>
      <button
        onClick={handleApply}
        className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors mb-4"
        disabled={loading}
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            處理中...
          </span>
        ) : (
          '申請此機會'
        )}
      </button>

      <button
        onClick={handleBookmark}
        className={`w-full py-3 rounded-lg font-semibold transition-colors mb-6 flex items-center justify-center
          ${isBookmarked
            ? 'bg-gray-100 text-primary-600 hover:bg-gray-200'
            : 'bg-white text-primary-600 border border-primary-600 hover:bg-primary-50'
          }`}
        disabled={loading}
      >
        {isBookmarked ? (
          <>
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"></path>
            </svg>
            已收藏
          </>
        ) : (
          <>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
            </svg>
            收藏
          </>
        )}
      </button>

      {error && (
        <div className="text-red-500 text-sm mb-4 text-center">{error}</div>
      )}
    </div>
  );
};

export default OpportunityInteractionButtons;