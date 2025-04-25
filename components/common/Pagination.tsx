import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
  onPageSizeChange?: (pageSize: number) => void;
  className?: string;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize = 10,
  onPageSizeChange,
  className = '',
}) => {
  // 計算當前顯示的項目範圍
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems || currentPage * pageSize);

  // 生成頁碼按鈕
  const renderPageButtons = () => {
    // 最多顯示5個頁碼
    const pages = [];
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);

    // 調整頁碼範圍
    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }

    // 添加首頁按鈕
    if (startPage > 1) {
      pages.push(
        <button
          key="first"
          onClick={() => onPageChange(1)}
          className="relative px-2 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
        >
          <span className="sr-only">首頁</span>
          <span>1</span>
        </button>
      );

      // 添加省略號
      if (startPage > 2) {
        pages.push(
          <span key="startEllipsis" className="relative px-4 py-2 text-gray-700">
            ...
          </span>
        );
      }
    }

    // 添加中間的頁碼
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`relative px-4 py-2 rounded-md ${
            i === currentPage
              ? 'z-10 border border-primary-500 bg-primary text-white'
              : 'border border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
          } text-sm font-medium`}
        >
          {i}
        </button>
      );
    }

    // 添加尾頁按鈕
    if (endPage < totalPages) {
      // 添加省略號
      if (endPage < totalPages - 1) {
        pages.push(
          <span key="endEllipsis" className="relative px-4 py-2 text-gray-700">
            ...
          </span>
        );
      }

      pages.push(
        <button
          key="last"
          onClick={() => onPageChange(totalPages)}
          className="relative px-2 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
        >
          <span className="sr-only">尾頁</span>
          <span>{totalPages}</span>
        </button>
      );
    }

    return pages;
  };

  // 頁面大小選項
  const pageSizeOptions = [10, 20, 50, 100];

  return (
    <div className={`bg-white p-4 flex flex-col sm:flex-row justify-between items-center ${className}`}>
      {/* 頁面資訊和頁面大小選擇器 */}
      <div className="flex flex-col sm:flex-row sm:items-center mb-4 sm:mb-0">
        {totalItems !== undefined && (
          <p className="text-sm text-gray-700 mr-4">
            顯示第 <span className="font-medium">{startItem}</span> 至{' '}
            <span className="font-medium">{endItem}</span> 項，共{' '}
            <span className="font-medium">{totalItems}</span> 項
          </p>
        )}

        {onPageSizeChange && (
          <div className="mt-2 sm:mt-0 flex items-center">
            <span className="text-sm text-gray-700 mr-2">每頁顯示:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 頁碼導航 */}
      <div className="flex items-center justify-center space-x-1">
        {/* 上一頁按鈕 */}
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={`px-2 py-2 rounded-md border ${
            currentPage === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-500 hover:bg-gray-50'
          } text-sm font-medium`}
        >
          <span className="sr-only">上一頁</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {/* 頁碼按鈕 */}
        {renderPageButtons()}

        {/* 下一頁按鈕 */}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages || totalPages === 0}
          className={`px-2 py-2 rounded-md border ${
            currentPage === totalPages || totalPages === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-500 hover:bg-gray-50'
          } text-sm font-medium`}
        >
          <span className="sr-only">下一頁</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Pagination;