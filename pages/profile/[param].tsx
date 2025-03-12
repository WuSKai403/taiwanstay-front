import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Profile from '@/components/profile';
import { getUser, UserProps } from '@/lib/api/user';
import { defaultMetaProps } from '@/components/layout/meta';

export default function UserProfile({ user }: { user: UserProps }) {
  return <Profile user={user} />;
}

export const getServerSideProps: GetServerSideProps = async ({ req, params }) => {
  const session = await getSession({ req });
  const param = params?.param as string;

  try {
    // 嘗試使用參數獲取用戶
    const user = await getUser(param);

    if (!user) {
      return {
        notFound: true // 返回 404 頁面
      };
    }

    return {
      props: {
        user,
        meta: {
          ...defaultMetaProps,
          title: `${user.name} | TaiwanStay`
        }
      }
    };
  } catch (error) {
    console.error('Error fetching user:', error);
    return {
      notFound: true // 返回 404 頁面
    };
  }
};