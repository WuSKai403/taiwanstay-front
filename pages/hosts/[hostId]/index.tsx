import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';

// 重定向頁面
const HostIndex = () => {
  // 這個組件不會被渲染，因為服務端會進行重定向
  return null;
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const { hostId } = context.params as { hostId: string };
    const session = await getSession(context);

    // 檢查是否登入
    if (!session) {
      return {
        redirect: {
          destination: '/auth/signin?callbackUrl=' + encodeURIComponent(`/hosts/${hostId}/profile`),
          permanent: false,
        },
      };
    }

    // 檢查用戶是否為該主人的擁有者
    if (session.user.hostId !== hostId) {
      return {
        redirect: {
          destination: '/profile',
          permanent: false,
        },
      };
    }

    // 重定向到 profile 頁面
    return {
      redirect: {
        destination: `/hosts/${hostId}/profile`,
        permanent: false,
      },
    };
  } catch (error) {
    console.error('主人首頁重定向失敗:', error);
    return {
      notFound: true,
    };
  }
};

export default HostIndex;