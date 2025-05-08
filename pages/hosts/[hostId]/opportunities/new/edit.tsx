import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import { checkHostAccess } from '@/lib/middleware/authMiddleware';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import HostLayout from '@/components/layout/HostLayout';
import OpportunityForm from '@/components/host/opportunities/OpportunityForm';
import { OpportunityFormData } from '@/components/host/opportunities/OpportunityForm';

// 頁面組件
const OpportunityEditPage = ({ hostId }: { hostId: string }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isNewOpportunity = true;

  // 儲存草稿的 Mutation - 使用新的 API 端點
  const draftMutation = useMutation({
    mutationFn: (data: Partial<OpportunityFormData>) => {
      return fetch('/api/opportunities/draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          hostId, // 確保傳遞主人 ID
        }),
      }).then(response => {
        if (!response.ok) {
          throw new Error('儲存草稿失敗');
        }
        return response.json();
      });
    },
    onSuccess: (data) => {
      console.log('草稿儲存成功:', data);
      queryClient.invalidateQueries({ queryKey: ['host-opportunities', hostId] });

      // 顯示成功訊息
      alert('草稿已成功儲存！');

      // 重定向到機會列表頁面，而不是單個機會的編輯頁面
      router.push(`/hosts/${hostId}/opportunities`);
    },
    onError: (error) => {
      console.error('草稿儲存失敗:', error);
      alert('草稿儲存失敗，請確保至少填寫標題');
    },
  });

  // 正式提交機會更新 (完整驗證)
  const mutation = useMutation({
    mutationFn: (data: OpportunityFormData) => {
      return fetch('/api/opportunities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          hostId, // 確保傳遞主人 ID
          status: 'DRAFT' // 明確設置為草稿狀態
        }),
      }).then(response => {
        if (!response.ok) {
          throw new Error('儲存機會失敗');
        }
        return response.json();
      });
    },
    onSuccess: (data) => {
      console.log('儲存成功:', data);
      queryClient.invalidateQueries({ queryKey: ['host-opportunities', hostId] });
      // 確保 data._id 存在才執行導航
      if (data && data._id) {
        router.push(`/hosts/${hostId}/opportunities/${data._id}`);
      } else {
        console.error('儲存成功但沒有返回 _id:', data);
        alert('儲存成功，但無法導航到詳情頁面');
      }
    },
    onError: (error) => {
      console.error('儲存失敗:', error);
      alert('儲存失敗，請檢查您的連接並稍後再試');
    },
  });

  // 送出審核 Mutation
  const submitForReviewMutation = useMutation({
    mutationFn: (data: OpportunityFormData) => {
      return fetch('/api/opportunities/submit-for-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          hostId, // 確保傳遞主人 ID
          status: 'PENDING' // 設置為待審核狀態
        }),
      }).then(async response => {
        // 增強錯誤處理，處理不同的HTTP狀態碼
        if (!response.ok) {
          const errorData = await response.json();
          // 將伺服器返回的錯誤訊息包裝到Error中
          const error = new Error(errorData.message || '送出審核失敗');
          // 添加更多錯誤相關資訊
          (error as any).status = response.status;
          (error as any).details = errorData.errors || [];
          (error as any).code = errorData.code;
          throw error;
        }
        return response.json();
      });
    },
    onSuccess: (data) => {
      console.log('送出審核成功:', data);
      queryClient.invalidateQueries({ queryKey: ['host-opportunities', hostId] });

      // 顯示成功訊息並導向列表頁
      alert('工作機會已送出審核，審核通過後將會自動發布！');
      router.push(`/hosts/${hostId}/opportunities`);
    },
    onError: (error: any) => {
      console.error('送出審核失敗:', error);

      // 根據錯誤類型提供不同的錯誤訊息
      let errorMessage = '送出審核失敗';

      // 處理不同HTTP狀態碼
      if (error.status) {
        switch (error.status) {
          case 400:
            errorMessage = `表單驗證失敗: ${error.message}`;
            break;
          case 401:
          case 403:
            errorMessage = `授權錯誤: ${error.message}`;
            break;
          case 404:
            errorMessage = `未找到資源: ${error.message}`;
            break;
          case 422:
            errorMessage = `資料驗證錯誤: ${error.message}`;
            break;
          case 500:
            errorMessage = `伺服器錯誤: ${error.message}`;
            break;
          default:
            errorMessage = `錯誤(${error.status}): ${error.message}`;
        }
      } else {
        errorMessage = `錯誤: ${error.message || '未知錯誤'}`;
      }

      // 如果有詳細錯誤清單，添加到錯誤訊息中
      if (error.details && error.details.length > 0) {
        errorMessage += `\n\n詳細錯誤:\n${error.details.join('\n')}`;
      }

      alert(errorMessage);
    },
  });

  // 儲存草稿處理 - 只需要標題
  const saveDraft = async (data: Partial<OpportunityFormData>) => {
    try {
      // 檢查標題是否存在
      if (!data.title || data.title.trim() === '') {
        alert('請至少填寫標題');
        return;
      }

      // 清理並準備草稿數據 - 處理 null 值和數字欄位
      const cleanedData = { ...data };

      // 處理要求中的數字欄位
      if (cleanedData.requirements && cleanedData.requirements.minAge === null) {
        delete cleanedData.requirements.minAge;
      }

      // 處理福利中的數字欄位
      if (cleanedData.benefits && cleanedData.benefits.meals && cleanedData.benefits.meals.count === null) {
        delete cleanedData.benefits.meals.count;
      }

      if (cleanedData.benefits && cleanedData.benefits.stipend && cleanedData.benefits.stipend.amount === null) {
        delete cleanedData.benefits.stipend.amount;
      }

      // 特別處理 location 欄位，防止座標問題
      if (cleanedData.location) {
        // 創建僅包含基本欄位的 location 對象，不包含 coordinates
        cleanedData.location = {
          address: cleanedData.location.address || '',
          city: cleanedData.location.city || '',
          district: cleanedData.location.district || '',
          country: cleanedData.location.country || 'Taiwan',
        };
      }

      // 只保留數組類型的 timeSlots 欄位，移除 workTimeSettings 欄位
      if (cleanedData.timeSlots) {
        for (let i = 0; i < cleanedData.timeSlots.length; i++) {
          const slot = cleanedData.timeSlots[i];
          // 處理數字類型
          if (slot.defaultCapacity === null) {
            slot.defaultCapacity = 1; // 設置預設值為 1
          }
          if (slot.minimumStay === null) {
            slot.minimumStay = 7; // 設置預設值為 7 天
          }
        }
      }

      // 確保 hasTimeSlots 為 true，且至少有一個時間段
      if (!cleanedData.hasTimeSlots || !cleanedData.timeSlots || cleanedData.timeSlots.length === 0) {
        cleanedData.hasTimeSlots = true;
        if (!cleanedData.timeSlots || cleanedData.timeSlots.length === 0) {
          cleanedData.timeSlots = [{
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            defaultCapacity: 1,
            minimumStay: 7,
            description: ''
          }];
        }
      }

      // 發送處理後的數據
      await draftMutation.mutateAsync(cleanedData);
    } catch (error) {
      console.error('儲存草稿時出錯:', error);
      alert('儲存草稿失敗，請稍後再試');
    }
  };

  // 表單完整提交處理 (包含完整驗證)
  const onSubmit = async (data: OpportunityFormData) => {
    try {
      await mutation.mutateAsync(data);
    } catch (error) {
      console.error('提交表單時出錯:', error);
      alert('儲存失敗，請稍後再試');
    }
  };

  // 送出審核處理 - 接收表單數據參數
  const onSubmitForReview = async (data: OpportunityFormData) => {
    try {
      // 添加詳細日誌
      console.log('===== 開始送出審核流程 =====');
      console.log('主人ID:', hostId);

      // 檢查表單數據完整性
      console.log('表單數據完整檢查:', {
        title: Boolean(data.title),
        shortDescription: Boolean(data.shortDescription),
        description: Boolean(data.description),
        location: data.location && Boolean(data.location.city),
        workDetails: data.workDetails && Array.isArray(data.workDetails.tasks) && data.workDetails.tasks.length > 0,
        hasCoverImage: Boolean(data.media?.coverImage?.url),
        imageCount: data.media?.images?.length || 0
      });

      // 特別處理和檢查媒體數據
      if (data.media) {
        console.log('封面圖片:', data.media.coverImage ? {
          url: Boolean(data.media.coverImage.url),
          urlLength: data.media.coverImage.url ? data.media.coverImage.url.length : 0,
          urlStart: data.media.coverImage.url ? data.media.coverImage.url.substring(0, 30) + '...' : ''
        } : '未提供封面圖片');

        if (data.media.images && data.media.images.length > 0) {
          console.log('圖片集數量:', data.media.images.length);
          console.log('圖片集URL檢查:', data.media.images.map((img, index) => ({
            index,
            hasUrl: Boolean(img.url),
            urlLength: img.url ? img.url.length : 0
          })));
        } else {
          console.log('沒有上傳任何圖片');
        }
      } else {
        console.log('沒有提供任何媒體數據');
      }

      // 進行前端數據處理和清理
      const processedData = processFormDataForSubmission(data);
      console.log('數據處理後的媒體信息:', {
        hasCoverImage: Boolean(processedData.media?.coverImage?.url),
        imagesCount: processedData.media?.images?.length || 0
      });

      // 提交審核
      console.log('提交數據到API...');
      const result = await submitForReviewMutation.mutateAsync(processedData);
      console.log('審核提交成功，收到響應:', result);
    } catch (error) {
      console.error('送出審核時出錯:', error);
      console.error('詳細錯誤信息:', (error as any)?.message || '未知錯誤');

      // 檢查具體錯誤類型
      if (error instanceof Error) {
        console.error('錯誤堆疊:', error.stack);
        console.error('錯誤類型:', error.constructor.name);

        // 檢查是否有狀態碼
        if ('status' in error) {
          console.error('HTTP狀態碼:', (error as any).status);
        }

        // 檢查是否有詳細錯誤信息
        if ('details' in error) {
          console.error('詳細錯誤:', (error as any).details);
        }
      }

      // 錯誤處理已在mutation的onError中完成，不需要重複處理
    }
  };

  // 數據處理函數 - 確保數據格式正確
  const processFormDataForSubmission = (data: OpportunityFormData): OpportunityFormData => {
    // 創建數據副本以避免修改原數據
    const cleanedData = { ...data };

    // 處理媒體數據
    if (cleanedData.media) {
      // 確保coverImage有url
      if (cleanedData.media.coverImage && !cleanedData.media.coverImage.url) {
        console.warn('封面圖片缺少URL，可能導致驗證失敗');
      }

      // 過濾掉無效的圖片（沒有URL的圖片）
      if (cleanedData.media.images && Array.isArray(cleanedData.media.images)) {
        const originalLength = cleanedData.media.images.length;
        cleanedData.media.images = cleanedData.media.images.filter(img => img && img.url);
        const newLength = cleanedData.media.images.length;

        if (originalLength !== newLength) {
          console.warn(`過濾掉了 ${originalLength - newLength} 張無效圖片`);
        }
      }
    } else {
      // 如果沒有媒體數據，創建一個空對象防止後端錯誤
      cleanedData.media = {
        images: [],
      };
      console.warn('沒有媒體數據，已創建空對象');
    }

    // 處理坐標數據
    if (cleanedData.location && cleanedData.location.coordinates) {
      // 確保坐標是數字陣列
      if (!Array.isArray(cleanedData.location.coordinates) ||
          cleanedData.location.coordinates.length !== 2 ||
          cleanedData.location.coordinates.some(coord => typeof coord !== 'number')) {
        console.warn('位置坐標格式不正確，修正為null:', cleanedData.location.coordinates);
        cleanedData.location.coordinates = null;
      }
    }

    return cleanedData;
  };

  // 返回列表
  const handleCancel = () => {
    router.push(`/hosts/${hostId}/opportunities`);
  };

  return (
    <HostLayout>
      <div className="p-4 md:p-6">
        <OpportunityForm
          isNewOpportunity={isNewOpportunity}
          onSubmit={onSubmit}
          onSubmitForReview={onSubmitForReview}
          onCancel={handleCancel}
          saveDraft={saveDraft}  // 添加新的草稿保存函數
          isSubmitting={mutation.isPending}
          isSubmittingDraft={draftMutation.isPending}  // 添加草稿儲存狀態
          isSubmittingForReview={submitForReviewMutation.isPending}
        />
      </div>
    </HostLayout>
  );
};

// 服務端權限檢查
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { hostId } = context.params as { hostId: string };
  const session = await getSession(context);

  // 檢查訪問權限
  if (!session?.user) {
    return { redirect: { destination: '/auth/login', permanent: false } };
  }

  // 確保用戶ID存在
  const userId = session.user.id;
  if (!userId) {
    return { redirect: { destination: '/auth/login', permanent: false } };
  }

  // 使用服務端函數檢查是否有此主人的訪問權限
  const hasAccess = await checkHostAccess(userId, hostId);

  if (!hasAccess) {
    return { notFound: true };
  }

  return { props: { hostId } };
};

export default OpportunityEditPage;