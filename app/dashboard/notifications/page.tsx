"use client";

import { useNotifications, useMarkNotificationAsRead, useMarkAllNotificationsAsRead } from "@/lib/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Bell, CheckCheck, Mail, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
    const { data, isLoading } = useNotifications(50); // Load more for page
    const { mutate: markRead } = useMarkNotificationAsRead();
    const { mutate: markAllRead, isPending: isMarkingAll } = useMarkAllNotificationsAsRead();

    if (isLoading) return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;

    const notifications = data?.notifications || [];

    const getIcon = (type: string) => {
        switch (type) {
            case 'APPLICATION': return <Mail className="w-5 h-5 text-blue-500" />;
            case 'SYSTEM': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
            default: return <Bell className="w-5 h-5 text-gray-500" />;
        }
    };

    return (
        <div className="container max-w-4xl py-10 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
                    <p className="text-muted-foreground">Updates and messages.</p>
                </div>
                <Button variant="outline" onClick={() => markAllRead()} disabled={isMarkingAll}>
                    <CheckCheck className="mr-2 h-4 w-4" /> Mark all read
                </Button>
            </div>

            <div className="space-y-4">
                {notifications.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        You're all caught up! No notifications.
                    </div>
                ) : (
                    notifications.map((notification) => (
                        <Card
                            key={notification.id}
                            className={cn(
                                "flex items-start gap-4 p-4 transition-colors hover:bg-muted/30 cursor-pointer",
                                !notification.isRead ? "bg-muted/10 border-l-4 border-l-primary" : "border-l-4 border-l-transparent"
                            )}
                            onClick={() => !notification.isRead && markRead(notification.id)}
                        >
                            <div className="mt-1">
                                {getIcon(notification.type)}
                            </div>
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                    <h4 className={cn("text-sm font-semibold", !notification.isRead && "text-foreground")}>
                                        {notification.title}
                                    </h4>
                                    <span className="text-xs text-muted-foreground">
                                        {format(new Date(notification.createdAt), "MMM d, h:mm a")}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {notification.message}
                                </p>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
