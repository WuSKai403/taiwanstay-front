import { useState, useEffect } from 'react';
import { NextPage, GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { OpportunityType } from '@/models/enums/OpportunityType';
import { connectToDatabase } from '@/lib/mongodb';
import Layout from '@/components/layout/Layout';

// 定義申請表單數據接口
interface ApplicationFormData {
  message: string;
  startDate: string;
  endDate?: string;
  duration: number;
  timeSlotId?: string; // 新增時段 ID
  travelingWith: {
    partner: boolean;
    children: boolean;
    pets: boolean;
    details?: string;
  };
  answers?: {
    question: string;
    answer: string;
  }[];
  specialRequirements?: string;
  dietaryRestrictions: string[];
  languages: string[];
  relevantExperience?: string;
  motivation?: string;
}

// 定義機會詳情接口
interface OpportunityDetail {
  id: string;
  publicId: string;
  title: string;
  slug: string;
  shortDescription: string;
  type: OpportunityType;
  host: {
    id: string;
    name: string;
  };
  hasTimeSlots: boolean; // 新增是否有時段
  timeSlots?: { // 新增時段列表
    id: string;
    startDate: Date;
    endDate: Date;
    defaultCapacity: number;
    minimumStay: number;
    appliedCount: number;
    confirmedCount: number;
    status: string;
    description?: string;
  }[];
  applicationProcess?: {
    questions?: string[];
    instructions?: string;
  };
}

interface ApplyPageProps {
  opportunity: OpportunityDetail;
}

const ApplyPage: NextPage<ApplyPageProps> = ({ opportunity }) => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [availableDates, setAvailableDates] = useState<any[]>([]); // 新增可用日期
  const [formData, setFormData] = useState<ApplicationFormData>({
    message: '',
    startDate: '',
    endDate: '',
    duration: 14, // 預設兩週
    timeSlotId: opportunity.hasTimeSlots && opportunity.timeSlots && opportunity.timeSlots.length > 0
      ? opportunity.timeSlots[0].id
      : undefined, // 預設選擇第一個時段
    travelingWith: {
      partner: false,
      children: false,
      pets: false,
      details: ''
    },
    answers: opportunity.applicationProcess && opportunity.applicationProcess.questions
      ? opportunity.applicationProcess.questions.map(q => ({ question: q, answer: '' }))
      : [],
    specialRequirements: '',
    dietaryRestrictions: [],
    languages: [],
    relevantExperience: '',
    motivation: ''
  });

  // 檢查用戶是否已登入
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(router.asPath)}`);
    }
  }, [status, router]);

  // 獲取時段的可用日期
  const fetchAvailableDates = async (timeSlotId: string) => {
    if (!timeSlotId) return;

    try {
      const selectedTimeSlot = opportunity.timeSlots?.find(ts => ts.id === timeSlotId);
      if (!selectedTimeSlot) return;

      const startDate = new Date(selectedTimeSlot.startDate);
      const endDate = new Date(selectedTimeSlot.endDate);

      const response = await fetch(`/api/opportunities/${opportunity.slug}/date-capacities?startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}&timeSlotId=${timeSlotId}`);

      if (response.ok) {
        const data = await response.json();
        setAvailableDates(data.data || []);
      }
    } catch (error) {
      console.error('獲取可用日期失敗:', error);
    }
  };

  // 當選擇的時段變化時，獲取可用日期
  useEffect(() => {
    if (formData.timeSlotId) {
      fetchAvailableDates(formData.timeSlotId);
    }
  }, [formData.timeSlotId]);

  // 處理表單輸入變化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 處理複選框變化
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;

    if (name.startsWith('travelingWith.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        travelingWith: {
          ...prev.travelingWith,
          [field]: checked
        }
      }));
    } else if (name === 'dietaryRestrictions') {
      const value = e.target.value;
      setFormData(prev => ({
        ...prev,
        dietaryRestrictions: checked
          ? [...prev.dietaryRestrictions, value]
          : prev.dietaryRestrictions.filter(item => item !== value)
      }));
    } else if (name === 'languages') {
      const value = e.target.value;
      setFormData(prev => ({
        ...prev,
        languages: checked
          ? [...prev.languages, value]
          : prev.languages.filter(item => item !== value)
      }));
    }
  };

  // 處理問題回答變化
  const handleAnswerChange = (index: number, value: string) => {
    setFormData(prev => {
      if (!prev.answers) {
        return prev;
      }
      const newAnswers = [...prev.answers];
      newAnswers[index] = { ...newAnswers[index], answer: value };
      return {
        ...prev,
        answers: newAnswers
      };
    });
  };

  // 計算停留時間
  const calculateDuration = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      setFormData(prev => ({
        ...prev,
        duration: diffDays
      }));
    }
  };

  useEffect(() => {
    calculateDuration();
  }, [formData.startDate, formData.endDate]);

  // 處理時段選擇變化
  const handleTimeSlotChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      timeSlotId: value,
      startDate: '', // 重置開始日期
      endDate: '', // 重置結束日期
      duration: 14 // 重置停留時間
    }));
  };

  // 提交申請
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session) {
      setError('請先登入');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          opportunityId: opportunity.id,
          hostId: opportunity.host.id,
          timeSlotId: formData.timeSlotId, // 新增時段 ID
          applicationDetails: {
            message: formData.message,
            startDate: new Date(formData.startDate),
            endDate: formData.endDate ? new Date(formData.endDate) : undefined,
            duration: formData.duration,
            travelingWith: formData.travelingWith,
            answers: formData.answers || [],
            specialRequirements: formData.specialRequirements,
            dietaryRestrictions: formData.dietaryRestrictions,
            languages: formData.languages,
            relevantExperience: formData.relevantExperience,
            motivation: formData.motivation
          }
        })
      });

      if (response.ok) {
        setSuccess(true);
        // 重定向到申請成功頁面
        setTimeout(() => {
          router.push('/profile/applications');
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.message || '申請提交失敗');
      }
    } catch (err) {
      setError((err as Error).message || '申請提交失敗');
      console.error('申請提交失敗:', err);
    } finally {
      setLoading(false);
    }
  };

  // 如果用戶未登入，顯示載入中
  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <Layout title={`申請 ${opportunity.title} - TaiwanStay`} description={`申請 ${opportunity.title} 的工作機會`}>
      <div className="bg-gray-50 min-h-screen">
        {/* 頁面標題 */}
        <div className="bg-primary-600 py-6 px-4 sm:px-6 lg:px-8 text-white">
          <div className="max-w-7xl mx-auto">
            <div className="mb-2">
              <Link href={`/opportunities/${opportunity.slug}`} className="inline-flex items-center text-white hover:text-gray-200 transition-colors">
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
                返回機會詳情
              </Link>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">申請: {opportunity.title}</h1>
            <p className="mt-2 text-gray-200">主辦方: {opportunity.host.name}</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {success ? (
            <div className="bg-white shadow-sm rounded-lg p-8 text-center">
              <div className="mb-4 text-green-500">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2">申請已成功提交！</h2>
              <p className="text-gray-600 mb-6">主辦方將會審核您的申請，您可以在個人資料頁面查看申請狀態。</p>
              <div className="flex justify-center space-x-4">
                <Link href="/profile/applications" className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 transition-colors">
                  查看我的申請
                </Link>
                <Link href="/opportunities" className="bg-white text-primary-600 border border-primary-600 px-6 py-2 rounded-md hover:bg-primary-50 transition-colors">
                  瀏覽更多機會
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold">填寫申請表單</h2>
                <p className="text-gray-600 mt-1">請提供以下資訊，幫助主辦方了解您是否適合此機會。</p>
              </div>

              {error && (
                <div className="bg-red-50 p-4 border-l-4 border-red-500">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="p-6">
                {/* 基本資訊 */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4">基本資訊</h3>

                  {/* 時段選擇 - 只有當機會有時段時才顯示 */}
                  {opportunity.hasTimeSlots && opportunity.timeSlots && opportunity.timeSlots.length > 0 && (
                    <div className="mb-6">
                      <label htmlFor="timeSlotId" className="block text-sm font-medium text-gray-700 mb-1">
                        選擇時段 <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="timeSlotId"
                        name="timeSlotId"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        value={formData.timeSlotId}
                        onChange={handleTimeSlotChange}
                      >
                        {opportunity.timeSlots.map(timeSlot => (
                          <option key={timeSlot.id} value={timeSlot.id}>
                            {new Date(timeSlot.startDate).toLocaleDateString()} 至 {new Date(timeSlot.endDate).toLocaleDateString()}
                            {timeSlot.description ? ` - ${timeSlot.description}` : ''}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-sm text-gray-500">
                        選擇您想要申請的時段。每個時段可能有不同的可用日期和容量。
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                        預計開始日期 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        id="startDate"
                        name="startDate"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        min={formData.timeSlotId && opportunity.timeSlots
                          ? new Date(opportunity.timeSlots.find(ts => ts.id === formData.timeSlotId)?.startDate || '').toISOString().split('T')[0]
                          : new Date().toISOString().split('T')[0]}
                        max={formData.timeSlotId && opportunity.timeSlots
                          ? new Date(opportunity.timeSlots.find(ts => ts.id === formData.timeSlotId)?.endDate || '').toISOString().split('T')[0]
                          : undefined}
                      />
                      {availableDates.length > 0 && (
                        <p className="mt-1 text-xs text-gray-500">
                          {availableDates.filter(d => !d.isAvailable).length > 0
                            ? '注意：某些日期已滿，請選擇有空位的日期。'
                            : '所有日期都有空位。'}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                        預計結束日期 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        id="endDate"
                        name="endDate"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        value={formData.endDate}
                        onChange={handleInputChange}
                        min={formData.startDate}
                        max={formData.timeSlotId && opportunity.timeSlots
                          ? new Date(opportunity.timeSlots.find(ts => ts.id === formData.timeSlotId)?.endDate || '').toISOString().split('T')[0]
                          : undefined}
                      />
                      {formData.startDate && formData.endDate && formData.timeSlotId && opportunity.timeSlots && (
                        <p className="mt-1 text-xs text-gray-500">
                          停留時間：{formData.duration} 天
                          {formData.duration < (opportunity.timeSlots.find(ts => ts.id === formData.timeSlotId)?.minimumStay || 0) && (
                            <span className="text-red-500 ml-1">
                              （最短停留時間為 {opportunity.timeSlots.find(ts => ts.id === formData.timeSlotId)?.minimumStay} 天）
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      您將與誰一起旅行？
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="travelingWithPartner"
                          name="travelingWith.partner"
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          checked={formData.travelingWith.partner}
                          onChange={handleCheckboxChange}
                        />
                        <label htmlFor="travelingWithPartner" className="ml-2 text-sm text-gray-700">
                          伴侶/配偶
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="travelingWithChildren"
                          name="travelingWith.children"
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          checked={formData.travelingWith.children}
                          onChange={handleCheckboxChange}
                        />
                        <label htmlFor="travelingWithChildren" className="ml-2 text-sm text-gray-700">
                          孩子
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="travelingWithPets"
                          name="travelingWith.pets"
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          checked={formData.travelingWith.pets}
                          onChange={handleCheckboxChange}
                        />
                        <label htmlFor="travelingWithPets" className="ml-2 text-sm text-gray-700">
                          寵物
                        </label>
                      </div>
                    </div>
                  </div>

                  {(formData.travelingWith.partner || formData.travelingWith.children || formData.travelingWith.pets) && (
                    <div className="mb-6">
                      <label htmlFor="travelingWithDetails" className="block text-sm font-medium text-gray-700 mb-1">
                        請提供更多關於同行者的詳情
                      </label>
                      <textarea
                        id="travelingWithDetails"
                        name="travelingWith.details"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        value={formData.travelingWith.details}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          travelingWith: {
                            ...prev.travelingWith,
                            details: e.target.value
                          }
                        }))}
                        placeholder="例如：孩子的年齡、寵物的種類和數量等"
                      />
                    </div>
                  )}
                </div>

                {/* 語言和飲食限制 */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4">語言和飲食限制</h3>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      您會說哪些語言？
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {['中文', '英文', '日文', '韓文', '法文', '德文', '西班牙文'].map(lang => (
                        <div key={lang} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`lang-${lang}`}
                            name="languages"
                            value={lang}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            checked={formData.languages.includes(lang)}
                            onChange={handleCheckboxChange}
                          />
                          <label htmlFor={`lang-${lang}`} className="ml-2 text-sm text-gray-700">
                            {lang}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      您有任何飲食限制嗎？
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {['素食', '純素', '不吃牛肉', '不吃豬肉', '不吃海鮮', '無麩質', '無乳糖'].map(diet => (
                        <div key={diet} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`diet-${diet}`}
                            name="dietaryRestrictions"
                            value={diet}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            checked={formData.dietaryRestrictions.includes(diet)}
                            onChange={handleCheckboxChange}
                          />
                          <label htmlFor={`diet-${diet}`} className="ml-2 text-sm text-gray-700">
                            {diet}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6">
                    <label htmlFor="specialRequirements" className="block text-sm font-medium text-gray-700 mb-1">
                      特殊需求或過敏
                    </label>
                    <textarea
                      id="specialRequirements"
                      name="specialRequirements"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      value={formData.specialRequirements}
                      onChange={handleInputChange}
                      placeholder="請說明您有任何特殊需求、過敏或其他主辦方應該知道的健康狀況"
                    />
                  </div>
                </div>

                {/* 申請問題 */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4">申請問題</h3>

                  <div className="mb-6">
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                      給主辦方的訊息 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="請簡單介紹自己，並說明為什麼對這個機會感興趣"
                    />
                  </div>

                  <div className="mb-6">
                    <label htmlFor="relevantExperience" className="block text-sm font-medium text-gray-700 mb-1">
                      相關經驗
                    </label>
                    <textarea
                      id="relevantExperience"
                      name="relevantExperience"
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      value={formData.relevantExperience}
                      onChange={handleInputChange}
                      placeholder="請描述您與此機會相關的任何經驗或技能"
                    />
                  </div>

                  <div className="mb-6">
                    <label htmlFor="motivation" className="block text-sm font-medium text-gray-700 mb-1">
                      動機和期望
                    </label>
                    <textarea
                      id="motivation"
                      name="motivation"
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      value={formData.motivation}
                      onChange={handleInputChange}
                      placeholder="請分享您參與此機會的動機，以及您希望從中獲得什麼"
                    />
                  </div>

                  {/* 主辦方自定義問題 */}
                  {formData.answers && formData.answers.length > 0 && (
                    <div className="space-y-6">
                      <h4 className="text-md font-medium">主辦方問題</h4>
                      {formData.answers.map((item, index) => (
                        <div key={index} className="mb-6">
                          <label htmlFor={`answer-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                            {item.question}
                          </label>
                          <textarea
                            id={`answer-${index}`}
                            name={`answer-${index}`}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                            value={item.answer}
                            onChange={(e) => handleAnswerChange(index, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-8">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 transition-colors"
                  >
                    {loading ? '提交中...' : '提交申請'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ApplyPage;

export const getServerSideProps: GetServerSideProps = async (context) => {
  // 從 URL 參數中提取 slug
  const { slug } = context.params as { slug: string };

  try {
    // 連接到數據庫
    await connectToDatabase();

    // 發送 API 請求獲取機會詳情
    const protocol = context.req.headers.host?.includes('localhost') ? 'http' : 'https';
    const host = context.req.headers.host;
    const response = await fetch(`${protocol}://${host}/api/opportunities/${slug}`);

    if (!response.ok) {
      // 如果 API 返回錯誤，返回 404 頁面
      return {
        notFound: true
      };
    }

    const data = await response.json();

    // 確保 applicationProcess 屬性存在
    const opportunity = {
      ...data.opportunity,
      applicationProcess: data.opportunity.applicationProcess || { questions: [] }
    };

    return {
      props: {
        opportunity
      }
    };
  } catch (error) {
    console.error('獲取機會詳情失敗:', error);
    return {
      notFound: true
    };
  }
};