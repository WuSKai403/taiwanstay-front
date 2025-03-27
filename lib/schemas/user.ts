import { z } from 'zod';
import { UserRole } from '@/models/enums/UserRole';

// 基本用戶資料驗證
export const userSchema = z.object({
  id: z.string(),
  name: z.string().min(1, '請輸入名稱').max(50, '名稱不能超過50個字符'),
  email: z.string().email('請輸入有效的電子郵件'),
  image: z.string().url('請輸入有效的圖片網址').optional(),
  role: z.nativeEnum(UserRole, {
    errorMap: () => ({ message: '請選擇有效的用戶角色' })
  }),
  bio: z.string().max(500, '簡介不能超過500個字符').optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  organizationId: z.string().optional(),
  hostId: z.string().optional()
});

// 用戶註冊表單驗證
export const userRegistrationSchema = z.object({
  name: z.string().min(1, '請輸入名稱').max(50, '名稱不能超過50個字符'),
  email: z.string().email('請輸入有效的電子郵件'),
  password: z.string()
    .min(8, '密碼至少需要8個字符')
    .max(100, '密碼不能超過100個字符')
    .regex(/[A-Z]/, '密碼需要包含至少一個大寫字母')
    .regex(/[a-z]/, '密碼需要包含至少一個小寫字母')
    .regex(/[0-9]/, '密碼需要包含至少一個數字')
    .regex(/[^A-Za-z0-9]/, '密碼需要包含至少一個特殊字符'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: '密碼與確認密碼不符',
  path: ['confirmPassword']
});

// 用戶登入表單驗證
export const userLoginSchema = z.object({
  email: z.string().email('請輸入有效的電子郵件'),
  password: z.string().min(1, '請輸入密碼')
});

// 用戶更新資料表單驗證
export const userUpdateSchema = userSchema.partial().omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  role: true
});

// 密碼更新表單驗證
export const passwordUpdateSchema = z.object({
  currentPassword: z.string().min(1, '請輸入當前密碼'),
  newPassword: z.string()
    .min(8, '密碼至少需要8個字符')
    .max(100, '密碼不能超過100個字符')
    .regex(/[A-Z]/, '密碼需要包含至少一個大寫字母')
    .regex(/[a-z]/, '密碼需要包含至少一個小寫字母')
    .regex(/[0-9]/, '密碼需要包含至少一個數字')
    .regex(/[^A-Za-z0-9]/, '密碼需要包含至少一個特殊字符'),
  confirmNewPassword: z.string()
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: '新密碼與確認密碼不符',
  path: ['confirmNewPassword']
});

// 導出類型
export type UserFormData = z.infer<typeof userSchema>;
export type UserRegistrationFormData = z.infer<typeof userRegistrationSchema>;
export type UserLoginFormData = z.infer<typeof userLoginSchema>;
export type UserUpdateFormData = z.infer<typeof userUpdateSchema>;
export type PasswordUpdateFormData = z.infer<typeof passwordUpdateSchema>;