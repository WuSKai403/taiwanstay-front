"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Image as ImageIcon, FileText, Star, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname();

    const links = [
        { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
        { href: "/admin/users", label: "Users", icon: Users },
        { href: "/admin/opportunities", label: "Opportunities", icon: FileText },
        { href: "/admin/images", label: "Images", icon: ImageIcon },
        { href: "/admin/reviews", label: "Reviews", icon: Star },
        { href: "/admin/settings", label: "Settings", icon: Settings },
    ];

    return (
        <div className={cn("pb-12 bg-muted/40 border-r min-h-screen", className)}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                        Admin Console
                    </h2>
                    <div className="space-y-1">
                        {links.map((link) => {
                            const isActive = link.href === "/admin"
                                ? pathname === "/admin"
                                : pathname?.startsWith(link.href);

                            return (
                                <Button
                                    key={link.href}
                                    variant={isActive ? "secondary" : "ghost"}
                                    className="w-full justify-start"
                                    asChild
                                >
                                    <Link href={link.href}>
                                        <link.icon className="mr-2 h-4 w-4" />
                                        {link.label}
                                    </Link>
                                </Button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="grid lg:grid-cols-5">
            <Sidebar className="hidden lg:block lg:col-span-1" />
            <div className="lg:col-span-4 p-8">
                {children}
            </div>
        </div>
    );
}
