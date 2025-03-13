/**
 * 基本工具函數測試
 */

describe('基本工具函數測試', () => {
  it('應該能夠格式化日期', () => {
    // 簡單的日期格式化函數測試
    const formatDate = (date: Date): string => {
      return date.toISOString().split('T')[0];
    };

    const testDate = new Date('2023-05-15');
    expect(formatDate(testDate)).toBe('2023-05-15');
  });

  it('應該能夠驗證電子郵件格式', () => {
    // 簡單的電子郵件驗證函數測試
    const isValidEmail = (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('invalid-email')).toBe(false);
  });

  it('應該能夠生成隨機ID', () => {
    // 簡單的ID生成函數測試
    const generateId = (length: number = 8): string => {
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    const id = generateId();
    expect(id).toHaveLength(8);
    expect(typeof id).toBe('string');
  });
});