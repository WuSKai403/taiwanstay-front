import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface ApplicationNotification {
  _id: string;
  opportunityId: {
    title: string;
  };
  hostId: {
    name: string;
  };
  status: string;
  communications: {
    unreadUserMessages: number;
    lastMessageAt: string;
  };
}

const ApplicationNotifications = () => {
  const { data: session, status } = useSession();
  const [notifications, setNotifications] = useState<ApplicationNotification[]>([]);
  const [loading, setLoading] = useState(false);

  // 獲取未讀訊息通知
  const fetchNotifications = useCallback(async () => {
    if (status !== 'authenticated') return;

    setLoading(true);
    try {
      const response = await fetch('/api/notifications/applications');

      if (!response.ok) {
        throw new Error('獲取通知失敗');
      }

      const data = await response.json();
      setNotifications(data.data);
    } catch (err) {
      console.error('獲取通知錯誤:', err);
    } finally {
      setLoading(false);
    }
  }, [status]);

  // 當用戶登入狀態變化時獲取通知
  useEffect(() => {
    if (status === 'authenticated') {
      fetchNotifications();

      // 設置定時器，每分鐘檢查一次新通知
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [status, fetchNotifications]);

  if (status !== 'authenticated' || loading || notifications.length === 0) {
    return null;
  }

  return (
    <div className="bg-yellow-50 p-4 rounded-lg mb-6 border-l-4 border-yellow-400">
      <h3 className="font-medium text-yellow-800 mb-2">您有未讀訊息</h3>
      <ul className="space-y-2">
        {notifications.map(notification => (
          <li key={notification._id}>
            <Link href={`/profile/applications/${notification._id}`} className="text-yellow-700 hover:text-yellow-900 flex items-center justify-between">
              <span>
                {notification.opportunityId.title} ({notification.hostId.name})
                <span className="ml-2 bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full text-xs">
                  {notification.communications.unreadUserMessages} 則新訊息
                </span>
              </span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ApplicationNotifications;
