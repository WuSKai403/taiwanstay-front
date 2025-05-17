import { OpportunityDetail } from './constants';

interface OpportunityDetailedInfoProps {
  opportunity: OpportunityDetail;
}

const OpportunityDetailedInfo: React.FC<OpportunityDetailedInfoProps> = ({ opportunity }) => {
  return (
    <div className="mb-6">
      <h3 className="text-xl font-bold mb-4">基本信息</h3>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap bg-gray-50 w-1/4">
                <span className="text-sm font-medium text-gray-900">公開 ID</span>
              </td>
              <td className="px-6 py-4 whitespace-normal">
                <span className="text-sm text-gray-700">{opportunity.publicId || '未提供'}</span>
              </td>
            </tr>

            <tr>
              <td className="px-6 py-4 whitespace-nowrap bg-gray-50">
                <span className="text-sm font-medium text-gray-900">網址識別碼</span>
              </td>
              <td className="px-6 py-4 whitespace-normal">
                <span className="text-sm text-gray-700">{opportunity.slug || '未提供'}</span>
              </td>
            </tr>

            <tr>
              <td className="px-6 py-4 whitespace-nowrap bg-gray-50">
                <span className="text-sm font-medium text-gray-900">創建時間</span>
              </td>
              <td className="px-6 py-4 whitespace-normal">
                <span className="text-sm text-gray-700">
                  {opportunity.createdAt ? new Date(opportunity.createdAt).toLocaleString('zh-TW') : '未記錄'}
                </span>
              </td>
            </tr>

            <tr>
              <td className="px-6 py-4 whitespace-nowrap bg-gray-50">
                <span className="text-sm font-medium text-gray-900">最後更新</span>
              </td>
              <td className="px-6 py-4 whitespace-normal">
                <span className="text-sm text-gray-700">
                  {opportunity.updatedAt ? new Date(opportunity.updatedAt).toLocaleString('zh-TW') : '未記錄'}
                </span>
              </td>
            </tr>

            <tr>
              <td className="px-6 py-4 whitespace-nowrap bg-gray-50">
                <span className="text-sm font-medium text-gray-900">發布時間</span>
              </td>
              <td className="px-6 py-4 whitespace-normal">
                <span className="text-sm text-gray-700">
                  {opportunity.publishedAt ? new Date(opportunity.publishedAt).toLocaleString('zh-TW') : '未發布'}
                </span>
              </td>
            </tr>

            {opportunity.rejectionReason && (
              <tr>
                <td className="px-6 py-4 whitespace-nowrap bg-gray-50">
                  <span className="text-sm font-medium text-gray-900">拒絕原因</span>
                </td>
                <td className="px-6 py-4 whitespace-normal">
                  <span className="text-sm text-red-600">{opportunity.rejectionReason}</span>
                </td>
              </tr>
            )}

            <tr>
              <td className="px-6 py-4 whitespace-nowrap bg-gray-50">
                <span className="text-sm font-medium text-gray-900">統計數據</span>
              </td>
              <td className="px-6 py-4 whitespace-normal">
                <div className="flex flex-wrap gap-4">
                  <span className="text-sm text-gray-700">
                    <span className="font-medium">瀏覽次數:</span> {opportunity.stats?.views || 0}
                  </span>
                  <span className="text-sm text-gray-700">
                    <span className="font-medium">收藏次數:</span> {opportunity.stats?.bookmarks || 0}
                  </span>
                  <span className="text-sm text-gray-700">
                    <span className="font-medium">申請次數:</span> {opportunity.stats?.applications || 0}
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OpportunityDetailedInfo;