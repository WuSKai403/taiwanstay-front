import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import { checkHostAccess } from '@/lib/middleware/authMiddleware';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import HostLayout from '@/components/layout/HostLayout';
import OpportunityForm from '@/components/host/opportunities/OpportunityForm';
import { OpportunityFormData } from '@/components/host/opportunities/OpportunityForm';

// 頁面組件
const OpportunityEditPage = ({ hostId }: { hostId: string }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isNewOpportunity = true;

  // 提交機會更新
  const mutation = useMutation({
    mutationFn: (data: OpportunityFormData) => {
      return fetch('/api/opportunities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          hostId // 確保傳遞主人 ID
        }),
      }).then(response => {
        if (!response.ok) {
          throw new Error('儲存機會失敗');
        }
        return response.json();
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['host-opportunities', hostId] });
      router.push(`/hosts/${hostId}/opportunities/${data._id}`);
    },
  });

  // 表單提交處理
  const onSubmit = async (data: OpportunityFormData) => {
    try {
      await mutation.mutateAsync(data);
    } catch (error) {
      console.error('提交表單時出錯:', error);
    }
  };

  // 返回列表
  const handleCancel = () => {
    router.push(`/hosts/${hostId}/opportunities`);
  };

  return (
    <HostLayout>
      <div className="p-4 md:p-6">
        <OpportunityForm
          isNewOpportunity={isNewOpportunity}
          onSubmit={onSubmit}
          onCancel={handleCancel}
          isSubmitting={mutation.isPending}
        />
      </div>
    </HostLayout>
  );
};

// 服務端權限檢查
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { hostId } = context.params as { hostId: string };
  const session = await getSession(context);

  // 檢查訪問權限
  if (!session?.user) {
    return { redirect: { destination: '/login', permanent: false } };
  }

  // 確保用戶ID存在
  const userId = session.user.id;
  if (!userId) {
    return { redirect: { destination: '/login', permanent: false } };
  }

  // 使用服務端函數檢查是否有此主人的訪問權限
  const hasAccess = await checkHostAccess(userId, hostId);

  if (!hasAccess) {
    return { notFound: true };
  }

  return { props: { hostId } };
};

export default OpportunityEditPage;