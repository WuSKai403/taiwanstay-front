import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';

export default function Profile() {
  return <div>Profile</div>;
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const session = await getSession({ req });
  if (!session) {
    return {
      redirect: {
        permanent: false,
        destination: '/'
      }
    };
  }

  // 優先使用 id，如果沒有則使用 email
  const userIdentifier = session.user.id || session.user.email;

  return {
    redirect: {
      destination: `/profile/${userIdentifier}`,
      permanent: false
    }
  };
};
