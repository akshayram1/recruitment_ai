"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, LogOut, User } from "lucide-react";
import { useAuth } from "@/lib/auth";

interface NavbarProps {
    variant?: "candidate" | "recruiter";
}

export default function Navbar({ variant = "candidate" }: NavbarProps) {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    const accentColor = variant === "candidate" ? "indigo" : "purple";

    const candidateLinks = [
        { href: "/candidate", label: "Home" },
        { href: "/candidate/chat", label: "Chat" },
        { href: "/candidate/profile", label: "Profile" },
    ];

    const recruiterLinks = [
        { href: "/recruiter", label: "Home" },
        { href: "/recruiter/chat", label: "Chat" },
        { href: "/recruiter/jobs", label: "Jobs" },
    ];

    const links = variant === "candidate" ? candidateLinks : recruiterLinks;

    return (
        <nav className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link href={`/${variant}`} className="flex items-center gap-2">
                        <Sparkles className={`h-8 w-8 text-${accentColor}-600`} />
                        <span className="text-xl font-bold text-gray-900">RecruitAI</span>
                    </Link>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center space-x-8">
                        {links.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`text-sm font-medium transition-colors ${pathname === link.href
                                        ? `text-${accentColor}-600`
                                        : "text-gray-600 hover:text-gray-900"
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* User Menu */}
                    <div className="flex items-center gap-4">
                        {user && (
                            <>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <User className="h-4 w-4" />
                                    <span>{user.name}</span>
                                    {user.company && (
                                        <span className={`bg-${accentColor}-100 text-${accentColor}-600 px-2 py-0.5 rounded text-xs`}>
                                            {user.company}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={logout}
                                    className="text-gray-500 hover:text-gray-700"
                                    title="Logout"
                                >
                                    <LogOut className="h-5 w-5" />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
