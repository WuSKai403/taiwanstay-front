import { ParsedUrlQuery } from 'querystring';
import { GetStaticProps } from 'next';
import { defaultMetaProps } from '@/components/layout/meta';
import { getUser, getAllUsers, getUserCount } from '@/lib/api/user';
export { default } from '.';
import { clientPromise } from '@/lib/mongodb';

interface Params extends ParsedUrlQuery {
  username: string;
}

export const getStaticPaths = async () => {
  // 在開發環境中返回空路徑，使用 fallback 模式
  if (process.env.NODE_ENV === 'development') {
    return {
      paths: [],
      fallback: 'blocking'
    };
  }

  // 在生產環境中嘗試獲取用戶列表
  try {
    await clientPromise;
    const results = await getAllUsers();

    // 確保用戶名是有效的字符串
    const paths = results.flatMap(({ users }) =>
      users
        .filter(user => typeof user.username === 'string' && user.username.length > 0)
        .map(user => ({ params: { username: user.username } }))
    );

    return {
      paths,
      fallback: 'blocking' // 使用 blocking 而不是 true，以避免閃爍
    };
  } catch (e: any) {
    console.error('Error generating static paths:', e);
    // 如果出錯，返回空路徑
    return {
      paths: [],
      fallback: 'blocking'
    };
  }
};

export const getStaticProps: GetStaticProps = async (context) => {
  // You should remove this try-catch block once your MongoDB Cluster is fully provisioned
  try {
    await clientPromise;
  } catch (e: any) {
    if (e.code === 'ENOTFOUND') {
      // cluster is still provisioning
      return {
        props: {
          clusterStillProvisioning: true
        }
      };
    } else {
      throw new Error(`Connection limit reached. Please try again later.`);
    }
  }

  const { username } = context.params as Params;
  const user = await getUser(username);
  if (!user) {
    return {
      notFound: true,
      revalidate: 10
    };
  }

  const results = await getAllUsers();
  const totalUsers = await getUserCount();

  const ogUrl = `https://mongodb.vercel.app/${user.username}`;
  const meta = {
    ...defaultMetaProps,
    title: `${user.name}'s Profile | MongoDB Starter Kit`,
    ogImage: `https://api.microlink.io/?url=${ogUrl}&screenshot=true&meta=false&embed=screenshot.url`,
    ogUrl: `https://mongodb.vercel.app/${user.username}`
  };

  return {
    props: {
      meta,
      results,
      totalUsers,
      user
    },
    revalidate: 10
  };
};
