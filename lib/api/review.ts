import { Review, CreateReviewInput } from "@/lib/schemas/review";

// Mock Data Store (In-memory)
let MOCK_REVIEWS: Review[] = [
    {
        id: "r1",
        authorId: "u1",
        authorName: "Alice Walker",
        authorAvatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d",
        targetId: "h1", // Host ID
        targetType: "HOST",
        rating: 5,
        content: "Absolutely amazing experience! The host was super welcoming.",
        createdAt: new Date(Date.now() - 10000000).toISOString(),
    },
    {
        id: "r2",
        authorId: "u2",
        authorName: "Bob Smith",
        authorAvatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
        targetId: "h1",
        targetType: "HOST",
        rating: 4,
        content: "Great place, but the work hours were a bit long.",
        createdAt: new Date(Date.now() - 5000000).toISOString(),
    },
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const getReviews = async (targetId: string): Promise<Review[]> => {
    await delay(500); // Simulate network latency
    return MOCK_REVIEWS.filter((r) => r.targetId === targetId).sort((a, b) =>
        new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime()
    );
};

export const createReview = async (data: CreateReviewInput): Promise<Review> => {
    await delay(800);

    const newReview: Review = {
        id: Math.random().toString(36).substring(7),
        authorId: "current-user-id", // Mocked
        authorName: "Current User", // Mocked
        authorAvatar: "",
        targetId: data.targetId,
        targetType: data.targetType,
        rating: data.rating,
        content: data.content,
        createdAt: new Date().toISOString(),
    };

    MOCK_REVIEWS.unshift(newReview);
    return newReview;
};
