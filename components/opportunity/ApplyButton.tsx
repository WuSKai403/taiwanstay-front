import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { REQUIRED_FIELDS } from '../profile/ProfileCompleteness';
import { User } from '@/lib/types';

interface ApplyButtonProps {
  opportunityId: string;
}

export const ApplyButton: React.FC<ApplyButtonProps> = ({ opportunityId }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const checkProfileCompleteness = (user: Partial<User> | undefined) => {
    if (!user) {
      return {
        isComplete: false,
        incompleteFields: REQUIRED_FIELDS
      };
    }

    const incompleteFields = REQUIRED_FIELDS.filter(field => !user[field.key]);
    return {
      isComplete: incompleteFields.length === 0,
      incompleteFields
    };
  };

  const handleApply = async () => {
    if (!session?.user) {
      // 如果未登入，重定向到登入頁面，並記住當前頁面
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(window.location.href)}`);
      return;
    }

    const { isComplete, incompleteFields } = checkProfileCompleteness(session.user);

    if (!isComplete) {
      setIsDialogOpen(true);
      return;
    }

    // TODO: 實現申請邏輯
    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          opportunityId
        }),
      });

      if (response.ok) {
        // 申請成功，顯示成功訊息
        alert('申請成功！');
      } else {
        // 處理錯誤
        const error = await response.json();
        alert(error.message || '申請失敗，請稍後再試');
      }
    } catch (error) {
      alert('申請時發生錯誤，請稍後再試');
    }
  };

  return (
    <>
      <button
        onClick={handleApply}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        立即申請
      </button>

      {/* 資料不完整時的對話框 */}
      {isDialogOpen && session?.user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">需要完善個人資料</h3>
            <p className="text-gray-600 mb-4">
              申請工作機會需要完整的個人資料，請先完善以下資料：
            </p>
            <ul className="list-disc list-inside text-gray-500 mb-6">
              {checkProfileCompleteness(session.user).incompleteFields.map(field => (
                <li key={field.key}>{field.label}</li>
              ))}
            </ul>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setIsDialogOpen(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                稍後再說
              </button>
              <button
                onClick={() => {
                  setIsDialogOpen(false);
                  router.push(`/profile?return_to=${encodeURIComponent(window.location.href)}`);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                前往設定
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ApplyButton;