import { NextPage } from 'next';

const FAQPage: NextPage = () => {
  return (
    <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          常見問題
        </h1>
        <p className="mt-4 text-lg text-gray-500">
          這裡列出了用戶最常詢問的問題與解答。
        </p>
      </div>

      <div className="mt-16">
        <p className="text-gray-500">
          此頁面尚在開發中，敬請期待更多內容。
        </p>
      </div>
    </div>
  );
};

export default FAQPage;