import { userSchema, userLoginSchema } from '@/lib/schemas/user';
import { opportunityCreateSchema } from '@/lib/schemas/opportunity';

describe('Schema Validation', () => {
    describe('User Schema', () => {
        it('should validate a correct user object', () => {
            const validUser = {
                id: '123',
                name: 'Test User',
                email: 'test@example.com',
                role: 'USER',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            const result = userSchema.safeParse(validUser);
            expect(result.success).toBe(true);
        });

        it('should fail with invalid email', () => {
            const invalidUser = {
                id: '123',
                name: 'Test User',
                email: 'invalid-email',
                role: 'USER',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            const result = userSchema.safeParse(invalidUser);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('請輸入有效的電子郵件');
            }
        });

        it('should fail with invalid role', () => {
            const invalidUser = {
                id: '123',
                name: 'Test User',
                email: 'test@example.com',
                role: 'SUPER_ADMIN', // Invalid role
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            const result = userSchema.safeParse(invalidUser);
            expect(result.success).toBe(false);
        });
    });

    describe('User Login Schema', () => {
        it('should validate correct login credentials', () => {
            const validLogin = {
                email: 'test@example.com',
                password: 'password123'
            };
            expect(userLoginSchema.safeParse(validLogin).success).toBe(true);
        });

        it('should require password', () => {
            const invalidLogin = {
                email: 'test@example.com',
                password: ''
            };
            expect(userLoginSchema.safeParse(invalidLogin).success).toBe(false);
        });
    });

    describe('Opportunity Create Schema', () => {
        it('should validate basic opportunity data', () => {
            const validOpp = {
                title: 'Farm Helper',
                description: 'Help on a farm',
                location: {
                    city: 'Taitung',
                    country: 'Taiwan'
                }
            };
            const result = opportunityCreateSchema.safeParse(validOpp);
            expect(result.success).toBe(true);
        });

        it('should fail if title is missing', () => {
            const invalidOpp = {
                description: 'Help on a farm',
                location: {
                    city: 'Taitung'
                }
            };
            const result = opportunityCreateSchema.safeParse(invalidOpp);
            expect(result.success).toBe(false);
        });
    });
});
