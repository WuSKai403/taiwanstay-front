import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useOpportunities } from '@/lib/hooks/useOpportunities';
import * as api from '@/lib/api/opportunity';

// Mock the API module
jest.mock('@/lib/api/opportunity', () => ({
    getOpportunities: jest.fn(),
    Opportunity: jest.fn() // mock type just in case used as value
}));

describe('useOpportunities Hook', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                },
            },
        });
        jest.clearAllMocks();
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );

    it('fetches and returns opportunities', async () => {
        const mockData = {
            data: [
                { id: '1', title: 'Opp 1' },
                { id: '2', title: 'Opp 2' }
            ],
            total: 2,
            page: 1,
            limit: 10
        };

        (api.getOpportunities as jest.Mock).mockResolvedValue(mockData);

        const { result } = renderHook(() => useOpportunities(), { wrapper });

        // Initial state
        expect(result.current.isLoading).toBe(true);

        // Wait for success
        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toEqual(mockData);
        expect(api.getOpportunities).toHaveBeenCalledTimes(1);
    });
});
