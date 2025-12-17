import { ReactNode } from "react";
import Link from "next/link"; // Assuming Next.js Link or similar
import { Button } from "@/components/ui/button"; // Assuming a UI library for Button
import { NotificationDropdown } from "@/components/notification/NotificationDropdown";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";

export default function DashboardLayout({ children }: { children: ReactNode }) {
    return (
        <>
            <div className="flex items-center justify-end p-4 border-b"> {/* Added a wrapper div for the new elements */}
                <div className="flex items-center gap-4">
                    <NotificationDropdown />
                    <Button variant="ghost" asChild>
                        <Link href="/">Home</Link>
                    </Button>
                </div>
            </div>

            {/* ... */}

            <ErrorBoundary>
                {children}
            </ErrorBoundary>
        </>
    );
}

