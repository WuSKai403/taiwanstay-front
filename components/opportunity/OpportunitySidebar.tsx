import { OpportunityDetail } from './constants';
import OpportunityInteractionButtons from './OpportunityInteractionButtons';
import OpportunityTimeSlots from './OpportunityTimeSlots';

interface OpportunitySidebarProps {
  opportunity: OpportunityDetail;
  isBookmarked: boolean;
  setIsBookmarked: (value: boolean) => void;
}

const OpportunitySidebar: React.FC<OpportunitySidebarProps> = ({
  opportunity,
  isBookmarked,
  setIsBookmarked
}) => {
  return (
    <div className="lg:col-span-1">
      {/* 申請卡片 */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6 sticky top-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-2xl font-bold">免費申請</div>
          <div className="text-gray-600">
            <span className="font-semibold">{opportunity.stats?.applications || 0}</span> 人已申請
          </div>
        </div>

        <OpportunityInteractionButtons
          opportunity={opportunity}
          isBookmarked={isBookmarked}
          setIsBookmarked={setIsBookmarked}
        />

        {/* 時段摘要 */}
        {opportunity.hasTimeSlots && (
          <OpportunityTimeSlots
            opportunity={opportunity}
            displayMode="summary"
          />
        )}

        {/* 統計資訊 */}
        <div className="border-t border-gray-200 pt-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-gray-500 text-sm">瀏覽</div>
              <div className="font-semibold">{opportunity.stats?.views || 0}</div>
            </div>
            <div>
              <div className="text-gray-500 text-sm">申請</div>
              <div className="font-semibold">{opportunity.stats?.applications || 0}</div>
            </div>
            <div>
              <div className="text-gray-500 text-sm">收藏</div>
              <div className="font-semibold">{opportunity.stats?.bookmarks || 0}</div>
            </div>
          </div>
        </div>

        {/* 分享按鈕 */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <h3 className="font-semibold text-lg mb-2">分享此機會</h3>
          <div className="flex space-x-2">
            <button className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </button>
            <button className="bg-blue-400 text-white p-2 rounded-full hover:bg-blue-500 transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.054 10.054 0 01-3.127 1.184 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-1.042-.133-2.052-.382-3.016z"></path>
              </svg>
            </button>
            <button className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600 transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </button>
            <button className="bg-green-600 text-white p-2 rounded-full hover:bg-green-700 transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* 安全提示 */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <h3 className="font-semibold text-lg mb-2">安全提示</h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <svg className="w-5 h-5 mr-2 text-yellow-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
              </svg>
              在申請前，請先與主辦方充分溝通，了解工作內容和期望
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 mr-2 text-yellow-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
              </svg>
              請勿在平台外進行金錢交易
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 mr-2 text-yellow-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
              </svg>
              如遇任何問題，請立即聯繫平台客服
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default OpportunitySidebar;