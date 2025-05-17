import { OpportunityDetail } from './constants';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface OpportunityBenefitsProps {
  opportunity: OpportunityDetail;
}

const OpportunityBenefits: React.FC<OpportunityBenefitsProps> = ({ opportunity }) => {
  const { benefits } = opportunity;

  if (!benefits) {
    return (
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-4">福利與待遇</h3>
        <p className="text-gray-500">未提供福利與待遇資訊</p>
      </div>
    );
  }

  const { accommodation, meals, stipend, otherBenefits } = benefits;

  const accommodationTypes: Record<string, string> = {
    'private_room': '私人房間',
    'shared_room': '共享房間',
    'dormitory': '宿舍',
    'camping': '露營區',
    'other': '其他'
  };

  const BooleanIcon = ({ value }: { value?: boolean }) => {
    if (value === undefined) return null;
    return value ?
      <CheckIcon className="h-5 w-5 text-green-600" /> :
      <XMarkIcon className="h-5 w-5 text-red-600" />;
  };

  return (
    <div className="mb-6">
      <h3 className="text-xl font-bold mb-4">福利與待遇</h3>
      <div className="grid grid-cols-1 gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 住宿信息 */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">提供住宿</h4>
                <BooleanIcon value={accommodation.provided} />
              </div>
            </div>
            {accommodation.provided && (
              <div className="p-6">
                {accommodation.type && (
                  <div className="mb-2">
                    <span className="text-gray-700 font-medium">類型：</span>
                    <span className="text-gray-700">{accommodationTypes[accommodation.type] || accommodation.type}</span>
                  </div>
                )}
                {accommodation.description && (
                  <div>
                    <span className="text-gray-700 font-medium">描述：</span>
                    <p className="text-gray-700 mt-1">{accommodation.description}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 餐食信息 */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">提供餐食</h4>
                <BooleanIcon value={meals.provided} />
              </div>
            </div>
            {meals.provided && (
              <div className="p-6">
                {meals.count !== undefined && (
                  <div className="mb-2">
                    <span className="text-gray-700 font-medium">每日餐數：</span>
                    <span className="text-gray-700">{meals.count} 餐</span>
                  </div>
                )}
                {meals.description && (
                  <div>
                    <span className="text-gray-700 font-medium">描述：</span>
                    <p className="text-gray-700 mt-1">{meals.description}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 津貼信息 */}
        {stipend && (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">提供津貼</h4>
                <BooleanIcon value={stipend.provided} />
              </div>
            </div>
            {stipend.provided && stipend.amount && (
              <div className="p-6">
                <div className="flex items-center gap-2">
                  <span className="text-gray-700 font-medium">金額：</span>
                  <span className="text-gray-700">{stipend.amount} {stipend.currency || 'TWD'}</span>
                  {stipend.frequency && (
                    <span className="text-gray-500">/ {stipend.frequency}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 其他福利 */}
        {otherBenefits && otherBenefits.length > 0 && (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b">
              <h4 className="font-medium text-gray-900">其他福利</h4>
            </div>
            <div className="p-6">
              <ul className="list-disc pl-5 space-y-2">
                {otherBenefits.map((benefit, index) => (
                  <li key={index} className="text-gray-700">{benefit}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OpportunityBenefits;