import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = '載入中...',
  size = 'md'
}) => {
  // 根據 size 確定大小
  const spinnerSize = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  }[size];

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className={`animate-spin rounded-full border-t-2 border-b-2 border-blue-500 ${spinnerSize}`}></div>
      {message && <p className="mt-4 text-gray-600 text-center">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;