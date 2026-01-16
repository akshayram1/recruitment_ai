"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    MessageSquare,
    Upload,
    Search,
    User,
    LogOut,
    Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function CandidateHomePage() {
    const router = useRouter();
    const { user, isAuthenticated, logout, loading } = useAuth();

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push("/login");
        }
        if (!loading && user && user.role !== "candidate") {
            router.push("/recruiter");
        }
    }, [isAuthenticated, user, loading, router]);

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const handleLogout = () => {
        logout();
        router.push("/");
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-8 w-8 text-indigo-600" />
                            <span className="text-xl font-bold text-gray-900">RecruitAI</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-gray-600">{user.name}</span>
                            <button
                                onClick={handleLogout}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <LogOut className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Welcome, {user.name}!
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Manage your profile, search for jobs, and chat with AI
                    </p>
                </div>

                {/* Quick Actions */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    {/* Upload Resume */}
                    <Link href="/candidate/profile" className="group block cursor-pointer">
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all">
                            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-200 transition-colors">
                                <Upload className="h-6 w-6 text-indigo-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Upload Resume
                            </h3>
                            <p className="text-gray-600 text-sm">
                                Upload your resume to unlock job matching and AI insights
                            </p>
                        </div>
                    </Link>

                    {/* Search Jobs */}
                    <Link href="/candidate/chat" className="group block cursor-pointer">
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:border-green-200 hover:shadow-md transition-all">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                                <Search className="h-6 w-6 text-green-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Find Jobs
                            </h3>
                            <p className="text-gray-600 text-sm">
                                Search for jobs that match your skills and experience
                            </p>
                        </div>
                    </Link>

                    {/* Chat with AI */}
                    <Link href="/candidate/chat" className="group block cursor-pointer">
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:border-purple-200 hover:shadow-md transition-all">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                                <MessageSquare className="h-6 w-6 text-purple-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Chat with AI
                            </h3>
                            <p className="text-gray-600 text-sm">
                                Get career advice and insights from your resume
                            </p>
                        </div>
                    </Link>
                </div>

                {/* Navigation */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">
                            Quick Links
                        </h2>
                        <div className="space-y-2">
                            <Link
                                href="/candidate/profile"
                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <User className="h-5 w-5 text-gray-400" />
                                <span className="text-gray-700">View Profile</span>
                            </Link>
                            <Link
                                href="/candidate/chat"
                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <MessageSquare className="h-5 w-5 text-gray-400" />
                                <span className="text-gray-700">AI Chat</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
