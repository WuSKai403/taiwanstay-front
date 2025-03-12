# TaiwanStay 數據模型

本目錄包含 TaiwanStay 平台的核心數據模型。這些模型定義了系統中的主要實體及其關係。

## 核心模型

### 用戶相關

- **User**: 用戶模型，包含基本用戶信息、個人資料、隱私設置等
- **Host**: 主辦方模型，代表提供工作換宿機會的個人或組織
- **Organization**: 組織模型，代表可以管理多個主辦方的組織

### 機會相關

- **Opportunity**: 工作機會模型，包含工作詳情、福利、要求等
- **Application**: 申請模型，記錄用戶對工作機會的申請

### 互動相關

- **Review**: 評價模型，用於用戶和主辦方之間的互相評價
- **Bookmark**: 收藏模型，用於用戶收藏主辦方或工作機會
- **Notification**: 通知模型，用於系統通知
- **Message**: 消息模型，用於用戶之間的消息
- **Conversation**: 對話模型，用於管理用戶之間的對話

## 枚舉類型

所有枚舉類型都位於 `enums` 目錄中：

- **UserRole**: 用戶角色
- **PrivacyLevel**: 隱私級別
- **HostStatus**: 主辦方狀態
- **HostType**: 主辦方類型
- **OrganizationStatus**: 組織狀態
- **OrganizationType**: 組織類型
- **OpportunityStatus**: 工作機會狀態
- **OpportunityType**: 工作機會類型
- **ApplicationStatus**: 申請狀態
- **ReviewType**: 評價類型
- **BookmarkType**: 收藏類型
- **NotificationType**: 通知類型
- **MessageType**: 消息類型

## 模型關係

- 一個 **User** 可以創建一個 **Host** 或屬於一個 **Organization**
- 一個 **Host** 可以發布多個 **Opportunity**
- 一個 **Organization** 可以管理多個 **Host**
- 一個 **User** 可以對多個 **Opportunity** 提交 **Application**
- **User** 和 **Host** 可以互相發送 **Message**，形成 **Conversation**
- **User** 和 **Host** 可以互相評價，生成 **Review**
- **User** 可以收藏 **Host** 或 **Opportunity**，生成 **Bookmark**
- 系統會向 **User** 發送 **Notification**

## 數據庫索引

每個模型都定義了適當的索引以優化查詢性能。主要索引包括：

- 唯一索引：確保某些字段的唯一性，如用戶電子郵件、主辦方 slug 等
- 地理空間索引：用於地理位置查詢
- 文本索引：用於全文搜索
- 複合索引：用於優化多字段查詢

## 使用方法

可以通過 `models/index.ts` 導入所有模型和枚舉類型：

```typescript
import { User, Host, Opportunity, ApplicationStatus } from '../models';
```

連接數據庫：

```typescript
import { connectToDatabase } from '../lib/mongoose';

async function someFunction() {
  await connectToDatabase();
  // 使用模型進行操作
}
```