import { OpportunityDetail } from './constants';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface OpportunityRequirementsProps {
  opportunity: OpportunityDetail;
}

const OpportunityRequirements: React.FC<OpportunityRequirementsProps> = ({ opportunity }) => {
  const { requirements } = opportunity;

  if (!requirements) {
    return (
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-4">申請要求</h3>
        <p className="text-gray-500">未提供申請要求資訊</p>
      </div>
    );
  }

  const { minAge, acceptsCouples, acceptsFamilies, acceptsPets, drivingLicense, otherRequirements } = requirements;

  const BooleanIcon = ({ value }: { value?: boolean }) => {
    if (value === undefined) return null;
    return value ?
      <CheckIcon className="h-5 w-5 text-green-600" /> :
      <XMarkIcon className="h-5 w-5 text-red-600" />;
  };

  return (
    <div className="mb-6">
      <h3 className="text-xl font-bold mb-4">申請要求</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {minAge !== undefined && (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b">
              <h4 className="font-medium text-gray-900">最低年齡限制</h4>
            </div>
            <div className="p-6">
              <span className="text-gray-700">{minAge} 歲以上</span>
            </div>
          </div>
        )}

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h4 className="font-medium text-gray-900">接受條件</h4>
          </div>
          <div className="p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">接受情侶</span>
                <BooleanIcon value={acceptsCouples} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">接受家庭</span>
                <BooleanIcon value={acceptsFamilies} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">接受寵物</span>
                <BooleanIcon value={acceptsPets} />
              </div>
            </div>
          </div>
        </div>

        {drivingLicense && (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b">
              <h4 className="font-medium text-gray-900">駕照要求</h4>
            </div>
            <div className="p-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">汽車駕照</span>
                  <BooleanIcon value={drivingLicense.carRequired} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">機車駕照</span>
                  <BooleanIcon value={drivingLicense.motorcycleRequired} />
                </div>
                {drivingLicense.otherRequired && drivingLicense.otherDescription && (
                  <div className="pt-2">
                    <span className="text-gray-700 block">其他駕照要求：</span>
                    <span className="text-gray-600">{drivingLicense.otherDescription}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {otherRequirements && otherRequirements.length > 0 && (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b">
              <h4 className="font-medium text-gray-900">其他要求</h4>
            </div>
            <div className="p-6">
              <ul className="list-disc pl-5 space-y-2">
                {otherRequirements.map((req, index) => (
                  <li key={index} className="text-gray-700">{req}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OpportunityRequirements;