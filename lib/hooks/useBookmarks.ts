import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBookmarks, bookmarkOpportunity, removeBookmark } from "@/lib/api/opportunity";
import { toast } from "react-hot-toast";

const QUERY_KEY = "bookmarks";

export function useBookmarks() {
    return useQuery({
        queryKey: [QUERY_KEY],
        queryFn: getBookmarks,
    });
}

export function useToggleBookmark() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, isBookmarked }: { id: string; isBookmarked: boolean }) => {
            if (isBookmarked) {
                await removeBookmark(id);
            } else {
                await bookmarkOpportunity(id);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            // Optionally invalidate specific opportunity query if it includes bookmark status
            // queryClient.invalidateQueries({ queryKey: ['opportunity', id] });
            toast.success("Bookmarks updated");
        },
        onError: (error: Error) => {
            toast.error(`Failed to update bookmark: ${error.message}`);
        },
    });
}
