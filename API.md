# TaiwanStay API 文檔

本文檔詳細說明了TaiwanStay平台的所有API端點。

## 目錄

- [認證API](#認證api)
- [用戶API](#用戶api)
- [工作機會API](#工作機會api)
- [組織API](#組織api)
- [申請API](#申請api)

## 認證API

### 註冊

```
POST /api/auth/register
```

創建新用戶帳戶。

**請求體**:

```json
{
  "name": "用戶名稱",
  "email": "user@example.com",
  "password": "password123"
}
```

**響應**:

```json
{
  "success": true,
  "message": "註冊成功",
  "user": {
    "id": "user_id",
    "name": "用戶名稱",
    "email": "user@example.com"
  }
}
```

### 登入

```
POST /api/auth/login
```

用戶登入並獲取認證令牌。

**請求體**:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**響應**:

```json
{
  "success": true,
  "message": "登入成功",
  "user": {
    "id": "user_id",
    "name": "用戶名稱",
    "email": "user@example.com"
  }
}
```

### NextAuth.js認證

```
GET/POST /api/auth/[...nextauth]
```

NextAuth.js認證端點，用於處理各種認證流程。

## 用戶API

### 獲取用戶列表

```
GET /api/users
```

獲取用戶列表，支持分頁和過濾。

**查詢參數**:

- `limit`: 每頁顯示的數量 (默認: 10)
- `page`: 頁碼 (默認: 1)
- `role`: 用戶角色
- `search`: 搜尋關鍵詞

**響應**:

```json
{
  "success": true,
  "data": {
    "users": [...],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "pages": 10
    }
  }
}
```

### 創建用戶

```
POST /api/users
```

創建新用戶 (管理員專用)。

**請求體**:

```json
{
  "name": "用戶名稱",
  "email": "user@example.com",
  "password": "password123",
  "role": "USER"
}
```

**響應**:

```json
{
  "success": true,
  "message": "用戶創建成功",
  "data": {
    "id": "user_id",
    "name": "用戶名稱",
    "email": "user@example.com",
    "role": "USER"
  }
}
```

### 獲取特定用戶

```
GET /api/users/[id]
```

獲取特定用戶的詳細資訊。

**路徑參數**:

- `id`: 用戶ID

**響應**:

```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "name": "用戶名稱",
    "email": "user@example.com",
    "role": "USER",
    "profile": {...}
  }
}
```

### 更新用戶

```
PUT /api/users/[id]
```

更新特定用戶的資訊。

**路徑參數**:

- `id`: 用戶ID

**請求體**:

```json
{
  "name": "新用戶名稱",
  "profile": {
    "bio": "用戶簡介",
    "location": "台北市",
    "website": "https://example.com"
  }
}
```

**響應**:

```json
{
  "success": true,
  "message": "用戶更新成功",
  "data": {
    "id": "user_id",
    "name": "新用戶名稱",
    "email": "user@example.com",
    "profile": {
      "bio": "用戶簡介",
      "location": "台北市",
      "website": "https://example.com"
    }
  }
}
```

### 刪除用戶

```
DELETE /api/users/[id]
```

刪除特定用戶 (管理員專用)。

**路徑參數**:

- `id`: 用戶ID

**響應**:

```json
{
  "success": true,
  "message": "用戶刪除成功"
}
```

## 工作機會API

### 獲取機會列表

```
GET /api/opportunities
```

獲取工作機會列表，支持分頁和過濾。

**查詢參數**:

- `limit`: 每頁顯示的數量 (默認: 10)
- `page`: 頁碼 (默認: 1)
- `status`: 機會狀態
- `type`: 機會類型
- `hostId`: 主人ID
- `search`: 搜尋關鍵詞

**響應**:

```json
{
  "success": true,
  "data": {
    "opportunities": [...],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "pages": 10
    }
  }
}
```

### 創建機會

```
POST /api/opportunities
```

創建新的工作機會。

**請求體**:

```json
{
  "title": "機會標題",
  "description": "機會描述",
  "shortDescription": "簡短描述",
  "type": "FARMING",
  "status": "ACTIVE",
  "location": {
    "address": "地址",
    "city": "城市",
    "country": "國家",
    "coordinates": {
      "type": "Point",
      "coordinates": [121.5, 25.0]
    }
  },
  "requirements": {
    "minDuration": 7,
    "maxDuration": 30,
    "languages": ["中文", "英文"],
    "skills": ["園藝", "烹飪"]
  }
}
```

**響應**:

```json
{
  "success": true,
  "message": "機會創建成功",
  "data": {
    "id": "opportunity_id",
    "title": "機會標題",
    "slug": "ji-hui-biao-ti-abc123",
    "description": "機會描述",
    "type": "FARMING",
    "status": "ACTIVE",
    "location": {...},
    "requirements": {...}
  }
}
```

### 獲取特定機會

```
GET /api/opportunities/[id]
```

獲取特定工作機會的詳細資訊。

**路徑參數**:

- `id`: 機會ID或slug

**響應**:

```json
{
  "success": true,
  "data": {
    "id": "opportunity_id",
    "title": "機會標題",
    "slug": "ji-hui-biao-ti-abc123",
    "description": "機會描述",
    "type": "FARMING",
    "status": "ACTIVE",
    "location": {...},
    "requirements": {...},
    "host": {...}
  }
}
```

### 更新機會

```
PUT /api/opportunities/[id]
```

更新特定工作機會的資訊。

**路徑參數**:

- `id`: 機會ID

**請求體**:

```json
{
  "title": "新機會標題",
  "description": "新機會描述",
  "status": "ACTIVE"
}
```

**響應**:

```json
{
  "success": true,
  "message": "機會更新成功",
  "data": {
    "id": "opportunity_id",
    "title": "新機會標題",
    "description": "新機會描述",
    "status": "ACTIVE",
    "publicId": "public_id"
  }
}
```

### 刪除機會

```
DELETE /api/opportunities/[id]
```

刪除特定工作機會。

**路徑參數**:

- `id`: 機會ID

**響應**:

```json
{
  "success": true,
  "message": "機會刪除成功"
}
```

### 搜尋機會

```
GET /api/opportunities/search
```

搜尋工作機會，支持多種過濾條件。

**查詢參數**:

- `q`: 搜尋關鍵詞
- `type`: 機會類型
- `location`: 位置
- `duration`: 時間長度
- `startDate`: 開始日期
- `endDate`: 結束日期
- `limit`: 每頁顯示的數量 (默認: 10)
- `page`: 頁碼 (默認: 1)

**響應**:

```json
{
  "success": true,
  "data": {
    "opportunities": [...],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "pages": 10
    }
  }
}
```

## 組織API

### 獲取組織列表

```
GET /api/organizations
```

獲取組織列表，支持分頁和過濾。

**查詢參數**:

- `limit`: 每頁顯示的數量 (默認: 10)
- `page`: 頁碼 (默認: 1)
- `status`: 組織狀態
- `type`: 組織類型
- `search`: 搜尋關鍵詞

**響應**:

```json
{
  "success": true,
  "data": {
    "organizations": [...],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "pages": 10
    }
  }
}
```

### 創建組織

```
POST /api/organizations
```

創建新的組織。

**請求體**:

```json
{
  "name": "組織名稱",
  "description": "組織描述",
  "type": "NGO",
  "contactInfo": {
    "email": "org@example.com",
    "phone": "0912345678",
    "website": "https://example.org"
  },
  "location": {
    "address": "地址",
    "city": "城市",
    "country": "國家"
  }
}
```

**響應**:

```json
{
  "success": true,
  "message": "組織創建成功",
  "data": {
    "id": "organization_id",
    "name": "組織名稱",
    "slug": "zu-zhi-ming-cheng-abc123",
    "description": "組織描述",
    "type": "NGO",
    "status": "PENDING",
    "contactInfo": {...},
    "location": {...}
  }
}
```

### 獲取特定組織

```
GET /api/organizations/[id]
```

獲取特定組織的詳細資訊。

**路徑參數**:

- `id`: 組織ID或slug

**響應**:

```json
{
  "success": true,
  "data": {
    "id": "organization_id",
    "name": "組織名稱",
    "slug": "zu-zhi-ming-cheng-abc123",
    "description": "組織描述",
    "type": "NGO",
    "status": "ACTIVE",
    "contactInfo": {...},
    "location": {...},
    "media": {...},
    "details": {...},
    "admins": [...],
    "hosts": [...]
  }
}
```

### 更新組織

```
PUT /api/organizations/[id]
```

更新特定組織的資訊。

**路徑參數**:

- `id`: 組織ID

**請求體**:

```json
{
  "name": "新組織名稱",
  "description": "新組織描述",
  "contactInfo": {
    "email": "new@example.org"
  }
}
```

**響應**:

```json
{
  "success": true,
  "message": "組織更新成功",
  "data": {
    "id": "organization_id",
    "name": "新組織名稱",
    "description": "新組織描述",
    "contactInfo": {
      "email": "new@example.org",
      "phone": "0912345678",
      "website": "https://example.org"
    }
  }
}
```

### 刪除組織

```
DELETE /api/organizations/[id]
```

刪除特定組織 (管理員專用)。

**路徑參數**:

- `id`: 組織ID

**響應**:

```json
{
  "success": true,
  "message": "組織刪除成功"
}
```

### 獲取組織下的主人列表

```
GET /api/organizations/[id]/hosts
```

獲取特定組織下的所有主人。

**路徑參數**:

- `id`: 組織ID

**查詢參數**:

- `limit`: 每頁顯示的數量 (默認: 10)
- `page`: 頁碼 (默認: 1)

**響應**:

```json
{
  "success": true,
  "data": {
    "hosts": [...],
    "pagination": {
      "total": 10,
      "page": 1,
      "limit": 10,
      "pages": 1
    }
  }
}
```

### 添加主人到組織

```
POST /api/organizations/[id]/hosts
```

將現有主人添加到組織中。

**路徑參數**:

- `id`: 組織ID

**請求體**:

```json
{
  "hostId": "host_id"
}
```

**響應**:

```json
{
  "success": true,
  "message": "主人添加成功",
  "data": {
    "id": "organization_id",
    "name": "組織名稱",
    "hosts": ["host_id1", "host_id2", "host_id"]
  }
}
```

## 申請API

### 獲取申請列表

```
GET /api/applications
```

獲取申請列表，支持分頁和過濾。

**查詢參數**:

- `limit`: 每頁顯示的數量 (默認: 10)
- `page`: 頁碼 (默認: 1)
- `status`: 申請狀態
- `opportunityId`: 工作機會ID
- `hostId`: 主人ID

**響應**:

```json
{
  "success": true,
  "data": {
    "applications": [...],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "pages": 10
    }
  }
}
```

### 創建申請

```
POST /api/applications
```

創建新的申請。

**請求體**:

```json
{
  "opportunityId": "opportunity_id",
  "applicationDetails": {
    "message": "申請信息",
    "startDate": "2023-06-01",
    "duration": 14,
    "travelingWith": {
      "partner": false,
      "children": false,
      "pets": false
    },
    "languages": ["中文", "英文"],
    "relevantExperience": "相關經驗"
  }
}
```

**響應**:

```json
{
  "success": true,
  "message": "申請創建成功",
  "data": {
    "id": "application_id",
    "userId": "user_id",
    "opportunityId": "opportunity_id",
    "hostId": "host_id",
    "status": "PENDING",
    "applicationDetails": {...},
    "communications": {...}
  }
}
```

### 獲取特定申請

```
GET /api/applications/[id]
```

獲取特定申請的詳細資訊。

**路徑參數**:

- `id`: 申請ID

**響應**:

```json
{
  "success": true,
  "data": {
    "id": "application_id",
    "userId": {
      "id": "user_id",
      "name": "用戶名稱",
      "email": "user@example.com"
    },
    "opportunityId": {
      "id": "opportunity_id",
      "title": "機會標題",
      "slug": "ji-hui-biao-ti-abc123",
      "location": {...}
    },
    "hostId": {
      "id": "host_id",
      "name": "主人名稱",
      "slug": "zhu-ren-ming-cheng-abc123"
    },
    "status": "PENDING",
    "applicationDetails": {...},
    "communications": {...}
  }
}
```

### 更新申請

```
PUT /api/applications/[id]
```

更新特定申請的資訊。

**路徑參數**:

- `id`: 申請ID

**請求體**:

```json
{
  "status": "ACCEPTED",
  "statusNote": "申請已接受",
  "reviewDetails": {
    "notes": "審核備註",
    "rating": 5
  }
}
```

**響應**:

```json
{
  "success": true,
  "message": "申請更新成功",
  "data": {
    "id": "application_id",
    "status": "ACCEPTED",
    "statusNote": "申請已接受",
    "reviewDetails": {
      "reviewedBy": "host_id",
      "reviewedAt": "2023-05-15T08:30:00.000Z",
      "notes": "審核備註",
      "rating": 5
    }
  }
}
```

### 刪除申請

```
DELETE /api/applications/[id]
```

刪除特定申請 (只能刪除草稿狀態的申請)。

**路徑參數**:

- `id`: 申請ID

**響應**:

```json
{
  "success": true,
  "message": "申請刪除成功"
}
```