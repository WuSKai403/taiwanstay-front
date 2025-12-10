"use client";

import { useNotifications, useMarkNotificationAsRead, useMarkAllNotificationsAsRead } from "@/lib/hooks/useNotifications";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Bell, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";

export function NotificationDropdown() {
    const { data, isLoading } = useNotifications();
    const { mutate: markRead } = useMarkNotificationAsRead();
    const { mutate: markAllRead } = useMarkAllNotificationsAsRead();
    const router = useRouter();

    const notifications = data?.notifications || [];
    const unreadCount = data?.unreadCount || notifications.filter(n => !n.isRead).length;

    const handleItemClick = (notification: any) => {
        if (!notification.isRead) {
            markRead(notification.id);
        }

        // Navigation logic based on type
        if (notification.type === 'APPLICATION') {
            router.push(`/dashboard/host/applications`);
        } else if (notification.type === 'OPPORTUNITY') {
            // Maybe go to opportunity details
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-600 border border-white" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-h-[400px] overflow-y-auto">
                <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-auto py-1 px-2"
                            onClick={(e) => {
                                e.preventDefault();
                                markAllRead();
                            }}
                        >
                            Mark all read
                        </Button>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isLoading ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
                ) : notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">No notifications</div>
                ) : (
                    notifications.map((notification) => (
                        <DropdownMenuItem
                            key={notification.id}
                            className={cn(
                                "flex flex-col items-start gap-1 p-3 cursor-pointer",
                                !notification.isRead && "bg-muted/50 font-medium"
                            )}
                            onClick={() => handleItemClick(notification)}
                        >
                            <div className="flex justify-between w-full">
                                <span className="text-sm font-semibold">{notification.title}</span>
                                <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                                {notification.message}
                            </p>
                        </DropdownMenuItem>
                    ))
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer justify-center text-primary" onClick={() => router.push('/dashboard/notifications')}>
                    View all
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
