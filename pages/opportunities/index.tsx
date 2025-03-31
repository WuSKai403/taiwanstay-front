import { NextPage } from 'next';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import OpportunityList from '@/components/opportunities/OpportunityList';
import { useOpportunityStore } from '@/store/opportunities';

const OpportunitiesPage: NextPage = () => {
  const router = useRouter();
  const setSearchFilters = useOpportunityStore((state: any) => state.setSearchFilters);

  // 從 URL 查詢參數初始化搜索過濾器
  useEffect(() => {
    if (!router.isReady) return;

    const { search, type, region, city, sort, page } = router.query;

    const filters: Record<string, any> = {};

    if (search) filters.search = search as string;
    if (type) filters.type = type as string;
    if (region) filters.region = region as string;
    if (city) filters.city = city as string;
    if (sort) filters.sort = sort as string;
    if (page) filters.page = parseInt(page as string, 10);

    setSearchFilters(filters);
  }, [router.isReady, router.query, setSearchFilters]);

  return (
    <Layout title="機會探索">
      <OpportunityList />
    </Layout>
  );
};

export default OpportunitiesPage;