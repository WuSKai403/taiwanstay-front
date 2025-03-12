import { NextPage } from 'next';
import Head from 'next/head';
import dynamic from 'next/dynamic';

// 動態導入地圖組件，避免 SSR 問題
const MapComponent = dynamic(() => import('../components/MapComponent'), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-200 flex items-center justify-center">地圖載入中...</div>
});

const MapTestPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>地圖測試 | TaiwanStay</title>
      </Head>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">地圖測試頁面</h1>

        <div className="h-96 rounded-lg overflow-hidden">
          <MapComponent
            position={[24.6682, 121.6782]} // 緯度, 經度
            title="測試位置"
          />
        </div>
      </div>
    </>
  );
};

export default MapTestPage;