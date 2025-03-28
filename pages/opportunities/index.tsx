import { NextPage } from 'next';
import Head from 'next/head';
import Layout from '@/components/layout/Layout';
import OpportunityList from '@/components/opportunities/OpportunityList';
import { Opportunity } from '@/lib/schemas/opportunity';

interface OpportunitiesPageProps {
  opportunities: Opportunity[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

const OpportunitiesPage: NextPage<OpportunitiesPageProps> = ({ opportunities, pagination }) => {
  return (
    <Layout>
      <Head>
        <title>工作機會 | TaiwanStay</title>
        <meta name="description" content="探索台灣各地的以工換宿機會" />
      </Head>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">工作機會</h1>
        <OpportunityList
          initialOpportunities={opportunities}
          initialPagination={pagination}
        />
      </div>
    </Layout>
  );
};

export async function getServerSideProps({ query }: { query: { [key: string]: string | string[] | undefined } }) {
  try {
    // 構建查詢參數
    const params = new URLSearchParams();
    params.append('page', query.page?.toString() || '1');
    params.append('limit', '10');

    // 添加搜索參數
    if (query.search) {
      params.append('search', query.search.toString());
    }

    // 添加篩選參數
    if (query.type) params.append('type', query.type.toString());
    if (query.location) params.append('location', query.location.toString());
    if (query.duration) params.append('duration', query.duration.toString());
    if (query.accommodation) params.append('accommodation', query.accommodation.toString());

    // 添加排序參數
    if (query.sort) {
      switch (query.sort.toString()) {
        case 'newest':
          params.append('sort', 'createdAt');
          params.append('order', 'desc');
          break;
        case 'oldest':
          params.append('sort', 'createdAt');
          params.append('order', 'asc');
          break;
        case 'popular':
          params.append('sort', 'stats.views');
          params.append('order', 'desc');
          break;
        default:
        params.append('sort', 'createdAt');
        params.append('order', 'desc');
      }
    }

    // 發送請求
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/opportunities?${params.toString()}`;
    console.log('API 請求 URL:', apiUrl);

    const response = await fetch(apiUrl);
      const data = await response.json();

    console.log('API 回應:', data);

    return {
      props: {
        opportunities: data.opportunities || [],
        pagination: data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          hasNextPage: false,
          hasPrevPage: false
        }
      }
    };
  } catch (error) {
    console.error('獲取機會列表失敗:', error);
    return {
      props: {
        opportunities: [],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          hasNextPage: false,
          hasPrevPage: false
        }
      }
    };
  }
}

export default OpportunitiesPage;