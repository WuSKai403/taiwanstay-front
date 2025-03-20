import { NextPage } from 'next';
import Head from 'next/head';
import { useState } from 'react';
import { CldUploadWidget } from 'next-cloudinary';
import type { CloudinaryUploadWidgetResults } from 'next-cloudinary';
import {
  CloudinaryImageResource
} from '@/lib/cloudinary/types';
import {
  cloudinaryConfig,
  getUploadPreset,
  getUploadFolder,
  validateConfig
} from '@/lib/cloudinary/config';
import {
  getUploadParams,
  formatBytes,
  convertToImageResource,
  formatUploadError
} from '@/lib/cloudinary/utils';

const CloudinaryTest: NextPage = () => {
  const [resource, setResource] = useState<CloudinaryImageResource | null>(null);
  const [error, setError] = useState<string>();
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<string[]>([]);

  // 驗證 Cloudinary 設定
  if (!validateConfig()) {
    return (
      <div className="text-red-500 p-4">
        錯誤：未設置 Cloudinary 設定。請確保在 .env.local 中設置了相關變數。
      </div>
    );
  }

  const addStatus = (status: string) => {
    setUploadStatus(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${status}`]);
  };

  return (
    <>
      <Head>
        <title>Cloudinary 上傳測試</title>
      </Head>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold">Cloudinary 上傳測試</h1>

        <div className="grid gap-8">
          {/* 上傳設定 */}
          <div className="rounded-lg border border-gray-200 p-6 bg-white shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">上傳設定</h2>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
              />
              <span>私密上傳模式</span>
            </label>
            <p className="mt-2 text-sm text-gray-600">
              目前模式：{isPrivate ? '私密上傳' : '公開上傳'}
            </p>
          </div>

          {/* 上傳區域 */}
          <div className="rounded-lg border border-gray-200 p-6 bg-white shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">上傳圖片</h2>

            <CldUploadWidget
              uploadPreset={getUploadPreset(isPrivate)}
              options={getUploadParams(
                isPrivate,
                getUploadFolder(isPrivate),
                { maxFiles: 1 }
              )}
              onOpen={() => {
                addStatus('準備開啟上傳視窗...');
              }}
              onQueuesStart={() => {
                setIsUploading(true);
                addStatus('開始上傳...');
              }}
              onUploadAdded={(result: any) => {
                console.log('Upload added:', result);
                const { file } = result.info;
                if (file) {
                  addStatus(`準備上傳檔案：${file.name}`);
                }
              }}
              onQueuesEnd={() => {
                console.log('Queues ended');
                addStatus('佇列處理完成');
                addStatus('等待 Cloudinary 處理完成...');
              }}
              onShowCompleted={(result: any) => {
                console.log('Show completed:', result);
                addStatus('顯示上傳完成訊息');
              }}
              onSuccess={(result: CloudinaryUploadWidgetResults) => {
                console.log('Upload success:', result);

                if (result.event === 'success' && result.info) {
                  const imageResource = convertToImageResource(result.info);
                  setResource(imageResource);
                  setError(undefined);
                  setIsUploading(false);
                  addStatus('上傳成功！');
                  addStatus(`檔案資訊：${imageResource.original_filename}`);
                  if (imageResource.public_id) {
                    addStatus(`Public ID: ${imageResource.public_id}`);
                  }
                }
              }}
              onError={(error: any) => {
                console.error('Upload error:', error);
                const errorMessage = formatUploadError(error);
                setError(errorMessage);
                setResource(null);
                setIsUploading(false);
                addStatus(`錯誤: ${errorMessage}`);
              }}
              onClose={() => {
                setIsUploading(false);
                addStatus('上傳視窗已關閉');
              }}
              onBatchCancelled={() => {
                setIsUploading(false);
                addStatus('上傳已取消');
              }}
              onDisplayChanged={(result: any) => {
                const { info } = result;
                if (info === 'shown') {
                  addStatus('上傳視窗已開啟');
                } else if (info === 'hidden') {
                  addStatus('上傳視窗已隱藏');
                  setIsUploading(false);
                }
              }}
            >
              {({ open }) => (
                <button
                  onClick={() => {
                    setUploadStatus([]);  // 清除之前的狀態記錄
                    setResource(null);     // 清除之前的資源
                    setError(undefined);   // 清除錯誤訊息
                    open();
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      上傳中...
                    </>
                  ) : (
                    '選擇檔案上傳'
                  )}
                </button>
              )}
            </CldUploadWidget>

            {/* 上傳狀態記錄 */}
            {uploadStatus.length > 0 && (
              <div className="mt-4 p-4 bg-gray-100 rounded-md">
                <h3 className="text-sm font-medium text-gray-900 mb-2">上傳狀態記錄</h3>
                <div className="text-xs text-gray-600 font-mono space-y-1">
                  {uploadStatus.map((status, index) => (
                    <div key={index} className="border-l-2 border-gray-300 pl-2">
                      {status}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isUploading && (
              <div className="mt-4 text-blue-600">
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  正在上傳檔案，請稍候...
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 text-red-700 bg-red-100 rounded-md">
                {error}
              </div>
            )}
          </div>

          {/* 預覽區域 */}
          {resource && (
            <div className="rounded-lg border border-gray-200 p-6 bg-white shadow-sm">
              <h2 className="mb-4 text-xl font-semibold">上傳結果</h2>

              <div className="grid md:grid-cols-2 gap-6">
                {/* 原始圖片 */}
                <div className="space-y-4">
                  <h3 className="font-medium">原始圖片</h3>
                  <div className="relative aspect-video">
                    <img
                      src={resource.secure_url}
                      alt={resource.original_filename || '上傳的圖片'}
                      className="rounded-lg object-cover w-full h-full"
                    />
                  </div>
                </div>

                {/* 圖片資訊 */}
                <div className="space-y-4">
                  <h3 className="font-medium">圖片資訊</h3>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <dt className="text-gray-600">檔案名稱</dt>
                    <dd>{resource.original_filename}</dd>
                    <dt className="text-gray-600">尺寸</dt>
                    <dd>{resource.width} x {resource.height}</dd>
                    <dt className="text-gray-600">格式</dt>
                    <dd>{resource.format}</dd>
                    <dt className="text-gray-600">檔案大小</dt>
                    <dd>{formatBytes(resource.bytes)}</dd>
                    <dt className="text-gray-600">存取類型</dt>
                    <dd>{isPrivate ? '私密' : '公開'}</dd>
                    <dt className="text-gray-600">Public ID</dt>
                    <dd className="break-all">{resource.public_id}</dd>
                    <dt className="text-gray-600">URL</dt>
                    <dd className="break-all">{resource.url}</dd>
                    <dt className="text-gray-600">Secure URL</dt>
                    <dd className="break-all">{resource.secure_url}</dd>
                  </dl>
                </div>

                {/* 縮圖預覽 */}
                <div className="space-y-4">
                  <h3 className="font-medium">縮圖預覽</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <img
                        src={resource.thumbnailUrl}
                        alt={`${resource.original_filename || '上傳的圖片'} 的縮圖`}
                        className="rounded-lg w-[200px] h-[200px] object-cover"
                      />
                      <p className="mt-2 text-sm text-gray-600">200x200 縮圖</p>
                    </div>
                    <div>
                      <img
                        src={`${resource.secure_url.replace('/upload/', '/upload/c_fill,g_auto,h_200,w_200,r_max/')}`}
                        alt={`${resource.original_filename || '上傳的圖片'} 的圓形縮圖`}
                        className="rounded-lg w-[200px] h-[200px] object-cover"
                      />
                      <p className="mt-2 text-sm text-gray-600">圓形縮圖</p>
                    </div>
                  </div>
                </div>

                {/* 操作按鈕 */}
                <div className="space-y-4">
                  <h3 className="font-medium">操作</h3>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => {
                        setResource(null);
                        setUploadStatus([]);
                      }}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      清除預覽
                    </button>
                    <a
                      href={resource.secure_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      查看原始圖片
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default CloudinaryTest;