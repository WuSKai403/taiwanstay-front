import React from 'react';

interface StatsProps {
  stats: {
    total?: number;
    active?: number;
    draft?: number;
    pending?: number;
    paused?: number;
    archived?: number;
    totalApplications?: number;
    totalViews?: number;
    totalBookmarks?: number;
  };
}

const OpportunityStats: React.FC<StatsProps> = ({ stats }) => {
  const statItems = [
    {
      label: '總機會',
      value: stats.total || 0,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      label: '活躍中',
      value: stats.active || 0,
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: '待審核',
      value: stats.pending || 0,
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: '草稿',
      value: stats.draft || 0,
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-700',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
    },
    {
      label: '申請總數',
      value: stats.totalApplications || 0,
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      {statItems.map((item, index) => (
        <div
          key={index}
          className={`${item.bgColor} ${item.textColor} rounded-lg shadow-sm p-4 flex items-center space-x-4`}
        >
          <div>{item.icon}</div>
          <div>
            <div className="text-2xl font-bold">{item.value}</div>
            <div className="text-sm">{item.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OpportunityStats;