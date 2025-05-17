import { OpportunityDetail } from './constants';

interface OpportunityWorkDetailsProps {
  opportunity: OpportunityDetail;
}

const OpportunityWorkDetails: React.FC<OpportunityWorkDetailsProps> = ({ opportunity }) => {
  const { workDetails } = opportunity;

  if (!workDetails) {
    return (
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-4">工作詳情</h3>
        <p className="text-gray-500">未提供工作詳情資訊</p>
      </div>
    );
  }

  const { tasks, skills, learningOpportunities, physicalDemand, languages } = workDetails;

  const physicalDemandLabels: Record<string, string> = {
    'low': '低強度',
    'medium': '中等強度',
    'high': '高強度'
  };

  return (
    <div className="mb-6">
      <h3 className="text-xl font-bold mb-4">工作詳情</h3>
      <div className="grid grid-cols-1 gap-6">
        {tasks && tasks.length > 0 && (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b">
              <h4 className="font-medium text-gray-900">工作任務</h4>
            </div>
            <div className="p-6">
              <ul className="list-disc pl-5 space-y-2">
                {tasks.map((task, index) => (
                  <li key={index} className="text-gray-700">{task}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {skills && skills.length > 0 && (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b">
              <h4 className="font-medium text-gray-900">所需技能</h4>
            </div>
            <div className="p-6">
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {learningOpportunities && learningOpportunities.length > 0 && (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b">
              <h4 className="font-medium text-gray-900">學習機會</h4>
            </div>
            <div className="p-6">
              <ul className="list-disc pl-5 space-y-2">
                {learningOpportunities.map((opportunity, index) => (
                  <li key={index} className="text-gray-700">{opportunity}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {physicalDemand && (
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b">
                <h4 className="font-medium text-gray-900">體力需求</h4>
              </div>
              <div className="p-6">
                <span className="text-gray-700">{physicalDemandLabels[physicalDemand] || physicalDemand}</span>
              </div>
            </div>
          )}

          {languages && languages.length > 0 && (
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b">
                <h4 className="font-medium text-gray-900">語言要求</h4>
              </div>
              <div className="p-6">
                <div className="flex flex-wrap gap-2">
                  {languages.map((language, index) => (
                    <span key={index} className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      {language}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OpportunityWorkDetails;