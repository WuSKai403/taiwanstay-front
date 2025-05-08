import { TimeSlot } from '@/lib/schemas/application';

/**
 * 將 YYYY-MM 格式的字符串轉換為 Date 對象
 */
export function parseYearMonth(yearMonthStr: string): { year: number; month: number } {
  const [year, month] = yearMonthStr.split('-').map(Number);
  return { year, month: month - 1 }; // 月份從 0 開始
}

/**
 * 將 Date 對象轉換為 YYYY-MM 格式的字符串
 */
export function formatYearMonth(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

/**
 * 獲取指定月份的最後一天
 */
export function getLastDayOfMonth(yearMonth: string): Date {
  const [year, month] = yearMonth.split('-').map(Number);
  return new Date(year, month, 0);
}

/**
 * 計算兩個月份之間的天數
 */
export function calculateDaysBetweenMonths(startYearMonth: string, endYearMonth: string): number {
  const start = parseYearMonth(startYearMonth);
  const end = parseYearMonth(endYearMonth);

  const startDate = new Date(start.year, start.month, 1);
  const endDate = new Date(end.year, end.month + 1, 0); // 月份的最後一天

  return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * 檢查月份是否在時段範圍內
 */
export function isMonthInTimeSlot(yearMonth: string, timeSlot: TimeSlot): boolean {
  const { year, month } = parseYearMonth(yearMonth);
  const targetDate = new Date(year, month);

  const startDate = new Date(timeSlot.startDate);
  const endDate = new Date(timeSlot.endDate);
  return targetDate >= startDate && targetDate <= endDate;
}

/**
 * 檢查月份是否可用
 */
export function isMonthAvailable(yearMonth: string, timeSlots: TimeSlot[]): boolean {
  const { year, month } = parseYearMonth(yearMonth);
  const targetDate = new Date(year, month);

  return timeSlots.some(slot => {
    const startDate = new Date(slot.startDate);
    const endDate = new Date(slot.endDate);
    return targetDate >= startDate && targetDate <= endDate;
  });
}

/**
 * 生成指定範圍內的所有月份
 */
export function generateMonthRange(startYearMonth: string, endYearMonth: string): string[] {
  const start = parseYearMonth(startYearMonth);
  const end = parseYearMonth(endYearMonth);
  const months: string[] = [];

  let currentDate = new Date(start.year, start.month);
  const endDate = new Date(end.year, end.month);

  while (currentDate <= endDate) {
    months.push(formatYearMonth(currentDate.getFullYear(), currentDate.getMonth()));
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return months;
}

/**
 * 驗證月份選擇是否有效
 */
export function validateMonthSelection(
  selectedMonths: string[],
  timeSlots: TimeSlot[],
  minimumStay?: number
): { isValid: boolean; error?: string } {
  if (selectedMonths.length === 0) {
    return { isValid: false, error: '請選擇至少一個月份' };
  }

  // 檢查是否所有選擇的月份都在可用時間段內
  const allMonthsAvailable = selectedMonths.every(month =>
    isMonthAvailable(month, timeSlots)
  );

  if (!allMonthsAvailable) {
    return { isValid: false, error: '選擇的月份不在可用時間段內' };
  }

  // 檢查是否為連續月份
  const sortedMonths = [...selectedMonths].sort();
  for (let i = 1; i < sortedMonths.length; i++) {
    const prevMonth = parseYearMonth(sortedMonths[i - 1]);
    const currMonth = parseYearMonth(sortedMonths[i]);

    const expectedNextMonth = new Date(prevMonth.year, prevMonth.month + 1);
    const actualMonth = new Date(currMonth.year, currMonth.month);

    if (expectedNextMonth.getTime() !== actualMonth.getTime()) {
      return { isValid: false, error: '請選擇連續的月份' };
    }
  }

  // 檢查最短停留時間
  if (minimumStay) {
    const totalDays = calculateDaysBetweenMonths(
      sortedMonths[0],
      sortedMonths[sortedMonths.length - 1]
    );

    if (totalDays < minimumStay) {
      return {
        isValid: false,
        error: `停留時間不得少於 ${minimumStay} 天`
      };
    }
  }

  return { isValid: true };
}

/**
 * 格式化顯示選擇的時間範圍
 */
export function formatDateRange(startYearMonth: string, endYearMonth: string): {
  displayRange: string;
  totalDays: number;
} {
  const start = parseYearMonth(startYearMonth);
  const end = parseYearMonth(endYearMonth);

  const startDate = new Date(start.year, start.month, 1);
  const endDate = new Date(end.year, end.month + 1, 0);

  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const displayRange = `${start.year}年${start.month + 1}月 - ${end.year}年${end.month + 1}月`;

  return { displayRange, totalDays };
}