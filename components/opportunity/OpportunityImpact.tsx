import { OpportunityDetail } from './constants';

interface OpportunityImpactProps {
  opportunity: OpportunityDetail;
}

const OpportunityImpact: React.FC<OpportunityImpactProps> = ({ opportunity }) => {
  const impact = opportunity.impact;

  if (!impact) {
    return (
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-4">影響與永續發展</h3>
        <p className="text-gray-500">未提供影響與永續發展資訊</p>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h3 className="text-xl font-bold mb-4">影響與永續發展</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {impact.environmentalContribution && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2">環境貢獻</h4>
            <p className="text-gray-700">{impact.environmentalContribution}</p>
          </div>
        )}

        {impact.socialContribution && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2">社會貢獻</h4>
            <p className="text-gray-700">{impact.socialContribution}</p>
          </div>
        )}

        {impact.culturalExchange && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2">文化交流</h4>
            <p className="text-gray-700">{impact.culturalExchange}</p>
          </div>
        )}

        {impact.sustainableDevelopmentGoals && impact.sustainableDevelopmentGoals.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2">永續發展目標</h4>
            <div className="flex flex-wrap gap-2">
              {impact.sustainableDevelopmentGoals.map((goal: string, index: number) => (
                <span key={index} className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {goal}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OpportunityImpact;