import { render, screen } from '@testing-library/react';
import { OpportunityCard } from '@/components/opportunity/OpportunityCard';

// Mock child components
jest.mock('@/components/opportunity/BookmarkButton', () => ({
    BookmarkButton: () => <div data-testid="bookmark-button" />
}));

// Mock Link
jest.mock('next/link', () => {
    return ({ children, href }: { children: React.ReactNode; href: string }) => {
        return <a href={href}>{children}</a>;
    };
});

describe('OpportunityCard Component', () => {
    const mockOpportunity = {
        id: 'opp-1',
        title: 'Diving Assistant',
        type: 'SCUBA_DIVING',
        location: {
            city: 'Hengchun',
            country: 'Taiwan',
        },
        description: 'Test description',
        media: {
            coverImage: { secureUrl: 'test-image.jpg' }
        }
    };

    it('renders opportunity details correctly', () => {
        render(<OpportunityCard opportunity={mockOpportunity as any} />);

        expect(screen.getByText('Diving Assistant')).toBeInTheDocument();
        expect(screen.getByText('Hengchun, Taiwan')).toBeInTheDocument();
        expect(screen.getByRole('img')).toHaveAttribute('src', 'test-image.jpg');
    });

    it('renders fallback image when no media provided', () => {
        const oppWithoutImage = { ...mockOpportunity, media: undefined };
        render(<OpportunityCard opportunity={oppWithoutImage as any} />);

        const img = screen.getByRole('img');
        expect(img).toHaveAttribute('src', '/placeholder-opportunity.jpg');
    });

    it('renders link to detail page', () => {
        render(<OpportunityCard opportunity={mockOpportunity as any} />);

        const links = screen.getAllByRole('link');
        // Both title and "View Details" button link to the detail page
        expect(links[0]).toHaveAttribute('href', '/opportunities/opp-1');
    });
});
