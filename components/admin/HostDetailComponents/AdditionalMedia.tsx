import React from 'react';

interface AdditionalMediaProps {
  additionalMedia: {
    virtualTour?: string;
    presentation?: string | { secureUrl: string; publicId: string }
  }
}

// 額外媒體組件
const AdditionalMedia: React.FC<AdditionalMediaProps> = ({ additionalMedia }) => {
  if (!additionalMedia || (!additionalMedia.virtualTour && !additionalMedia.presentation)) return null;

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">額外媒體</h2>
      <div className="space-y-4">
        {additionalMedia.virtualTour && (
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-1">虛擬導覽</h3>
            <a href={additionalMedia.virtualTour}
               target="_blank"
               rel="noopener noreferrer"
               className="text-blue-600 hover:underline">
              查看虛擬導覽
            </a>
          </div>
        )}
        {additionalMedia.presentation && (
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-1">簡報資料</h3>
            <a href={
                typeof additionalMedia.presentation === 'object'
                  ? additionalMedia.presentation.secureUrl
                  : additionalMedia.presentation
              }
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline">
              查看簡報
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdditionalMedia;