import Link from 'next/link';
import { OpportunityDetail, typeColorMap, typeNameMap } from './constants';
import { OpportunityType } from '@/models/enums';

interface OpportunityHeaderProps {
  opportunity: OpportunityDetail;
}

const OpportunityHeader: React.FC<OpportunityHeaderProps> = ({ opportunity }) => {
  return (
    <div className="bg-primary-600 py-8 px-4 sm:px-6 lg:px-8 text-white">
      <div className="max-w-7xl mx-auto">
        <div className="mb-2">
          <Link href="/opportunities" className="inline-flex items-center text-white hover:text-gray-200 transition-colors">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            返回機會列表
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${typeColorMap[opportunity.type as OpportunityType] || 'bg-gray-100 text-gray-800'}`}>
            {typeNameMap[opportunity.type as OpportunityType] || '其他'}
          </span>
          <span className="text-gray-200">
            <svg className="w-5 h-5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            {opportunity.location?.city || opportunity.location?.region || ''} {opportunity.location?.district || ''}
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold">{opportunity.title}</h1>
        <p className="text-xl text-gray-200 mt-2">{opportunity.shortDescription}</p>
      </div>
    </div>
  );
};

export default OpportunityHeader;