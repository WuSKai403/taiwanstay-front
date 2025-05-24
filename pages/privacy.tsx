import { NextPage } from 'next';

const PrivacyPage: NextPage = () => {
  return (
    <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          隱私政策
        </h1>
        <p className="mt-4 text-lg text-gray-500">
          TaiwanStay 重視您的隱私，以下是我們的隱私保護政策。
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

export default PrivacyPage;