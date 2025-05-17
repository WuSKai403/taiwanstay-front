# TaiwanStay - 台灣農村體驗平台

TaiwanStay是一個連接旅行者與台灣農村主人的平台，提供農村體驗、志工機會和文化交流。

## 技術棧

- [Next.js](https://nextjs.org/) - React框架
- [MongoDB](https://www.mongodb.com/) - 數據庫
- [Mongoose](https://mongoosejs.com/) - MongoDB對象建模
- [NextAuth.js](https://next-auth.js.org/) - 認證
- [Tailwind CSS](https://tailwindcss.com/) - 樣式
- [SWR](https://swr.vercel.app/) - 數據獲取
- [Jest](https://jestjs.io/) - 測試

## 開發

### 安裝依賴

```bash
npm install
```

### 運行開發服務器

```bash
npm run dev
```

### 構建生產版本

```bash
npm run build
```

### 運行測試

```bash
npm test
```

## API端點

### 認證API

- `POST /api/auth/register` - 用戶註冊
- `POST /api/auth/signin` - 用戶登入
- `GET/POST /api/auth/[...nextauth]` - NextAuth.js認證

### 用戶API

- `GET /api/users` - 獲取用戶列表
- `POST /api/users` - 創建用戶
- `GET /api/users/[id]` - 獲取特定用戶
- `PUT /api/users/[id]` - 更新用戶
- `DELETE /api/users/[id]` - 刪除用戶

### 工作機會API

- `GET /api/opportunities` - 獲取機會列表
- `POST /api/opportunities` - 創建機會
- `GET /api/opportunities/[id]` - 獲取特定機會
- `PUT /api/opportunities/[id]` - 更新機會
- `DELETE /api/opportunities/[id]` - 刪除機會
- `GET /api/opportunities/search` - 搜尋機會

### 組織API

- `GET /api/organizations` - 獲取組織列表
- `POST /api/organizations` - 創建組織
- `GET /api/organizations/[id]` - 獲取特定組織
- `PUT /api/organizations/[id]` - 更新組織
- `DELETE /api/organizations/[id]` - 刪除組織
- `GET /api/organizations/[id]/hosts` - 獲取組織下的主人列表
- `POST /api/organizations/[id]/hosts` - 添加主人到組織

### 申請API

- `GET /api/applications` - 獲取申請列表
- `POST /api/applications` - 創建申請
- `GET /api/applications/[id]` - 獲取特定申請
- `PUT /api/applications/[id]` - 更新申請
- `DELETE /api/applications/[id]` - 刪除申請

## 數據模型

### 用戶 (User)

用戶模型包含基本用戶信息、認證信息和個人資料。

### 工作機會 (Opportunity)

工作機會模型包含機會詳情、位置、要求和主人信息。

### 組織 (Organization)

組織模型包含組織詳情、聯絡信息和關聯的主人。

### 主人 (Host)

主人模型包含主人詳情、提供的機會和評價。

### 申請 (Application)

申請模型包含申請詳情、狀態和溝通記錄。

## 測試策略

詳見 [TESTING.md](TESTING.md) 文件。

## 貢獻

歡迎提交問題和拉取請求。

## 許可證

MIT

## 表單驗證與錯誤處理機制

本專案實現了一套通用的表單驗證與錯誤處理機制，特別適用於多步驟表單和複雜的驗證需求。

### 核心組件

#### 1. 表單驗證工具 (`/lib/utils/formValidation.ts`)

提供了三個主要功能：

- `handleFormValidationError`: 處理表單驗證錯誤，自動設置表單錯誤狀態並滾動到第一個錯誤字段。
- `createStepValidator`: 創建多步驟表單的步驟驗證器。
- `createFormSubmitter`: 創建表單提交處理器，統一處理 API 請求與錯誤。

```typescript
// 使用範例 - 處理驗證錯誤
try {
  await schema.parseAsync(data);
} catch (error) {
  handleFormValidationError(error, methods);
}

// 使用範例 - 創建步驟驗證器
const validateStep = createStepValidator(methods);
const isValid = await validateStep(schema, onSuccess);

// 使用範例 - 創建表單提交處理器
const submit = createFormSubmitter<ResponseType>(methods);
const result = await submit('/api/endpoint', {
  transformData: (data) => ({ ...data, status: 'active' }),
  onSuccess: (data) => console.log('成功', data),
  onError: (error) => console.error('錯誤', error)
});
```

#### 2. 表單錯誤摘要組件 (`/components/ui/FormErrorSummary.tsx`)

顯示表單中所有的驗證錯誤，可配置顯示條件和包含/排除的欄位。

```tsx
// 基本使用
<FormErrorSummary />

// 進階配置
<FormErrorSummary
  title="請修正以下問題："
  showWhen="submitted" // 'always' | 'submitted' | 'dirty'
  includeFields={['name', 'email']}
  excludeFields={['password']}
  className="my-custom-class"
/>
```

### 在多步驟表單中使用

1. 在表單上下文中整合驗證工具：

```tsx
// 在 FormContext 中
import { createStepValidator, createFormSubmitter } from '@/lib/utils/formValidation';

// 創建通用的步驟驗證器
const validateStep = createStepValidator(methods);

// 提供給子組件使用
const value = {
  // ...
  nextStep: async () => {
    return await validateStep(currentStepSchema, () => {
      // 驗證成功的處理邏輯
    });
  },
  // ...
};
```

2. 在表單步驟組件中使用錯誤摘要：

```tsx
// 在步驟組件中
import FormErrorSummary from '@/components/ui/FormErrorSummary';

return (
  <div>
    <FormErrorSummary
      showWhen="submitted"
      includeFields={['name', 'email']}
    />

    {/* 表單欄位 */}
  </div>
);
```

### 擴展與自定義

這套機制設計為高度可擴展的，您可以：

1. 自定義錯誤處理邏輯
2. 擴展表單驗證器支持更多情況
3. 調整錯誤摘要的顯示樣式與行為

若有特殊需求，可以通過修改 `/lib/utils/formValidation.ts` 來實現更多功能。

### 最佳實踐

1. 始終使用 Zod 進行表單驗證
2. 為每個步驟設置單獨的驗證模式
3. 使用 `FormErrorSummary` 提供清晰的錯誤反饋
4. 針對複雜字段設置獨立的錯誤提示
5. 使用通用的 `handleFormValidationError` 統一處理錯誤
