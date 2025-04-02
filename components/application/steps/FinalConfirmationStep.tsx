import React from 'react';
import { UseFormRegister, UseFormWatch, FieldErrors } from 'react-hook-form';
import { ApplicationFormData } from '@/lib/schemas/application';
import Link from 'next/link';

interface FinalConfirmationStepProps {
  register: UseFormRegister<ApplicationFormData>;
  watch: UseFormWatch<ApplicationFormData>;
  errors: FieldErrors<ApplicationFormData>;
}

const FinalConfirmationStep: React.FC<FinalConfirmationStepProps> = ({
  register,
  watch,
  errors
}) => {
  const sourceChannels = [
    '朋友推薦',
    '社交媒體',
    '搜索引擎',
    '部落格文章',
    '線下活動',
    '旅遊網站',
    '旅遊指南',
    '專業論壇',
    '其他'
  ];

  return (
    <div className="space-y-8">
      {/* 來源渠道 */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">您是如何發現我們的？</h3>
        <p className="text-sm text-gray-500 mb-4">
          請告訴我們您是通過哪個渠道了解到我們的平台，這將幫助我們改進我們的服務。
        </p>
        <select
          {...register('sourceChannel')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        >
          <option value="">請選擇</option>
          {sourceChannels.map(channel => (
            <option key={channel} value={channel}>{channel}</option>
          ))}
        </select>

        {watch('sourceChannel') === '其他' && (
          <input
            type="text"
            className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            placeholder="請說明您的來源渠道"
            onChange={(e) => {
              if (e.target.value) {
                register('sourceChannel').onChange({
                  target: {
                    name: 'sourceChannel',
                    value: `其他: ${e.target.value}`
                  }
                });
              }
            }}
          />
        )}
      </div>

      {/* 條款與條件 */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">條款與隱私</h3>

        <div className="rounded-md bg-gray-50 p-4 text-sm">
          <h4 className="font-semibold mb-2">申請前請確認以下事項：</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li>所有提供的信息必須真實、準確，如發現虛假信息將取消申請資格。</li>
            <li>您必須年滿 18 歲才能申請此計劃。</li>
            <li>工作交換不是付費工作，而是互惠互利的文化交流。</li>
            <li>住宿和飲食條件因主人而異，請在接受邀請前確認細節。</li>
            <li>您需自行負責簽證、保險和交通安排。</li>
            <li>您的個人資料將根據我們的<Link href="/privacy-policy" className="text-primary-600 hover:underline">隱私政策</Link>進行處理。</li>
          </ul>
        </div>

        <div className="flex items-start">
          <div className="flex h-5 items-center">
            <input
              id="termsAgreed"
              type="checkbox"
              {...register('termsAgreed')}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="termsAgreed" className="font-medium text-gray-700">
              我同意條款與條件 <span className="text-red-500">*</span>
            </label>
            <p className="text-gray-500">
              我確認我已閱讀並同意<Link href="/terms-of-service" className="text-primary-600 hover:underline">服務條款</Link>和<Link href="/privacy-policy" className="text-primary-600 hover:underline">隱私政策</Link>。
            </p>
            {errors.termsAgreed && (
              <p className="mt-1 text-red-600">您必須同意條款才能繼續</p>
            )}
          </div>
        </div>
      </div>

      {/* 最終提示 */}
      <div className="rounded-md bg-yellow-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              提交前請注意
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                提交申請後，您將收到一封確認電子郵件。如果您的申請成功，主人將在 7-14 個工作日內與您聯繫。
                請確保您提供的所有信息都是正確的，尤其是聯繫方式。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 數據處理同意 */}
      <div className="flex items-start">
        <div className="flex h-5 items-center">
          <input
            id="dataProcessingConsent"
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            required
          />
        </div>
        <div className="ml-3 text-sm">
          <label htmlFor="dataProcessingConsent" className="font-medium text-gray-700">
            資料處理同意 <span className="text-red-500">*</span>
          </label>
          <p className="text-gray-500">
            我瞭解並同意將我的申請資料分享給潛在主人，以便他們評估我是否適合參與他們的工作交換計劃。
          </p>
        </div>
      </div>
    </div>
  );
};

export default FinalConfirmationStep;