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
- `POST /api/auth/login` - 用戶登入
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
