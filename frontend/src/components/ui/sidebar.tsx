"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Home,
    MessageSquare,
    User,
    Briefcase,
    Search,
    Settings,
} from "lucide-react";

interface SidebarProps {
    variant?: "candidate" | "recruiter";
}

export default function Sidebar({ variant = "candidate" }: SidebarProps) {
    const pathname = usePathname();

    const accentColor = variant === "candidate" ? "indigo" : "purple";

    const candidateLinks = [
        { href: "/candidate", label: "Home", icon: Home },
        { href: "/candidate/chat", label: "AI Chat", icon: MessageSquare },
        { href: "/candidate/profile", label: "Profile", icon: User },
    ];

    const recruiterLinks = [
        { href: "/recruiter", label: "Home", icon: Home },
        { href: "/recruiter/chat", label: "AI Chat", icon: MessageSquare },
        { href: "/recruiter/jobs", label: "Jobs", icon: Briefcase },
    ];

    const links = variant === "candidate" ? candidateLinks : recruiterLinks;

    return (
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
            <div className="p-4">
                <nav className="space-y-1">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${isActive
                                        ? `bg-${accentColor}-50 text-${accentColor}-600`
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                    }`}
                            >
                                <Icon className="h-5 w-5" />
                                {link.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </aside>
    );
}
