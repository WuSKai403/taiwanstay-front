import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import { checkHostAccess } from '@/lib/middleware/authMiddleware';
import LoadingSpinner from '@/components/common/LoadingSpinner';

// 在客戶端輸出新機會編輯頁面，並傳遞相關參數
const NewOpportunityPage = ({ hostId }: { hostId: string }) => {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/hosts/${hostId}/opportunities/new/edit`);
  }, [hostId, router]);

  return (
    <div className="flex justify-center items-center h-screen">
      <LoadingSpinner size="lg" />
      <span className="ml-3 text-gray-600">正在前往新增機會頁面...</span>
    </div>
  );
};

// 服務端權限檢查
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { hostId } = context.params as { hostId: string };
  const session = await getSession(context);

  // 檢查訪問權限
  if (!session?.user) {
    return { redirect: { destination: '/auth/signin', permanent: false } };
  }

  // 確保用戶ID存在
  const userId = session.user.id;
  if (!userId) {
    return { redirect: { destination: '/auth/signin', permanent: false } };
  }

  // 使用服務端函數檢查是否有此主人的訪問權限
  const hasAccess = await checkHostAccess(userId, hostId);

  if (!hasAccess) {
    return { notFound: true };
  }

  return { props: { hostId } };
};

export default NewOpportunityPage;