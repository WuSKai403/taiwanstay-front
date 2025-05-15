# 機會元件 (Opportunity Components)

這個目錄包含了與工作機會相關的共用元件和常量定義。

## 常量 (Constants)

在 `constants.tsx` 文件中定義了以下常量：

### 機會類型相關
- `typeColorMap`: 機會類型標籤顏色映射
- `typeNameMap`: 機會類型中文名稱映射

### 機會狀態相關
- `statusColorMap`: 機會狀態標籤顏色映射
- `statusLabelMap`: 機會狀態顯示名稱

### 接口定義
- `TimeSlot`: 時間段介面定義
- `OpportunityDetail`: 機會詳情介面定義

## 使用方式

引入需要的常量：

```tsx
import {
  statusColorMap,
  statusLabelMap,
  typeColorMap,
  typeNameMap,
  TimeSlot,
  OpportunityDetail
} from '@/components/opportunity/constants';
```

使用狀態顏色和標籤：

```tsx
<span className={`px-2 py-1 rounded-full text-xs font-medium ${
  statusColorMap[opportunity.status as OpportunityStatus]
}`}>
  {statusLabelMap[opportunity.status as OpportunityStatus]}
</span>
```

使用類型顏色和名稱：

```tsx
<span className={`px-2 py-1 rounded-full text-xs font-medium ${
  typeColorMap[opportunity.type as OpportunityType]
}`}>
  {typeNameMap[opportunity.type as OpportunityType]}
</span>
```