import { cn } from '@/lib/utils';

describe('Utility Functions', () => {
    describe('cn (Class Name Merger)', () => {
        it('should merge class names correctly', () => {
            expect(cn('class1', 'class2')).toBe('class1 class2');
        });

        it('should handle conditional classes', () => {
            expect(cn('class1', true && 'class2', false && 'class3')).toBe('class1 class2');
        });

        it('should merge Tailwind classes using tailwind-merge', () => {
            // p-4 should override p-2
            expect(cn('p-2', 'p-4')).toBe('p-4');
            // text-red-500 should override text-blue-500
            expect(cn('text-blue-500', 'text-red-500')).toBe('text-red-500');
        });

        it('should handle arrays and objects', () => {
            expect(cn(['class1', 'class2'])).toBe('class1 class2');
            expect(cn({ 'class1': true, 'class2': false })).toBe('class1');
        });
    });
});
