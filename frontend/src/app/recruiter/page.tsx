"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    MessageSquare,
    Upload,
    Search,
    Briefcase,
    LogOut,
    Sparkles,
    Users,
    TrendingUp,
    Target,
    Zap,
    ChevronRight,
    Building2,
    FileText,
    BarChart3,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { recruiterApi } from "@/lib/api";

interface DashboardStats {
    activeJobs: number;
    candidatesFound: number;
    matchQuality: number;
    interviews: number;
}

export default function RecruiterHomePage() {
    const router = useRouter();
    const { user, isAuthenticated, logout, loading } = useAuth();
    const [greeting, setGreeting] = useState("Welcome");
    const [stats, setStats] = useState<DashboardStats>({
        activeJobs: 0,
        candidatesFound: 0,
        matchQuality: 0,
        interviews: 0,
    });
    const [statsLoading, setStatsLoading] = useState(true);

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting("Good Morning");
        else if (hour < 17) setGreeting("Good Afternoon");
        else setGreeting("Good Evening");
    }, []);

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push("/login");
        }
        if (!loading && user && user.role !== "recruiter") {
            router.push("/candidate");
        }
    }, [isAuthenticated, user, loading, router]);

    useEffect(() => {
        const fetchStats = async () => {
            if (!isAuthenticated || !user) return;

            try {
                setStatsLoading(true);
                
                // Fetch jobs count
                const jobs = await recruiterApi.getJobs();
                const activeJobs = jobs.length;

                // Fetch candidates count and match quality
                // Use first job if available, otherwise use a generic search
                let candidatesFound = 0;
                let matchQuality = 0;
                
                if (jobs.length > 0) {
                    try {
                        // Search candidates using the first job
                        const candidates = await recruiterApi.searchCandidates(
                            undefined,
                            jobs[0].id,
                            100 // Get up to 100 results for better stats
                        );
                        candidatesFound = candidates.length;
                        
                        // Calculate average match quality from search results
                        if (candidates.length > 0) {
                            const totalScore = candidates.reduce(
                                (sum: number, c: any) => sum + (c.match_score || 0),
                                0
                            );
                            matchQuality = Math.round((totalScore / candidates.length) * 100);
                        }
                    } catch (error) {
                        // If search fails, try a generic query
                        try {
                            const candidates = await recruiterApi.searchCandidates("software engineer", undefined, 100);
                            candidatesFound = candidates.length;
                            if (candidates.length > 0) {
                                const totalScore = candidates.reduce(
                                    (sum: number, c: any) => sum + (c.match_score || 0),
                                    0
                                );
                                matchQuality = Math.round((totalScore / candidates.length) * 100);
                            }
                        } catch (err) {
                            console.error("Failed to fetch candidates:", err);
                        }
                    }
                } else {
                    // No jobs yet, try a generic search
                    try {
                        const candidates = await recruiterApi.searchCandidates("developer", undefined, 100);
                        candidatesFound = candidates.length;
                        if (candidates.length > 0) {
                            const totalScore = candidates.reduce(
                                (sum: number, c: any) => sum + (c.match_score || 0),
                                0
                            );
                            matchQuality = Math.round((totalScore / candidates.length) * 100);
                        }
                    } catch (error) {
                        console.error("Failed to fetch candidates:", error);
                    }
                }

                setStats({
                    activeJobs,
                    candidatesFound: candidatesFound || 0,
                    matchQuality: matchQuality || 0,
                    interviews: 0, // This would need a separate endpoint
                });
            } catch (error) {
                console.error("Failed to fetch dashboard stats:", error);
            } finally {
                setStatsLoading(false);
            }
        };

        if (isAuthenticated && user) {
            fetchStats();
        }
    }, [isAuthenticated, user]);

    if (loading || !user) {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
                    <p className="text-white/60">Loading...</p>
                </div>
            </div>
        );
    }

    const handleLogout = () => {
        logout();
        router.push("/");
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-white">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0">
                <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <header className="relative z-10 border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
                                <Sparkles className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-lg font-bold text-white">RecruitAI</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-sm font-medium">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="text-left">
                                    <p className="text-white/80 text-sm font-medium">{user.name}</p>
                                    <p className="text-white/40 text-xs">{user.company}</p>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all"
                                title="Logout"
                            >
                                <LogOut className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Section */}
                <div className="mb-10">
                    <div className="flex items-center gap-2 mb-2">
                        <Building2 className="h-5 w-5 text-cyan-400" />
                        <p className="text-cyan-400 font-medium">{user.company}</p>
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-3">
                        {greeting}, {user.name.split(' ')[0]} 👋
                    </h1>
                    <p className="text-white/60 text-lg">
                        Find the perfect candidates for your open positions.
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                    <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                                <Briefcase className="h-5 w-5 text-cyan-400" />
                            </div>
                        </div>
                        {statsLoading ? (
                            <div className="h-8 w-12 bg-white/10 rounded animate-pulse" />
                        ) : (
                            <p className="text-2xl font-bold text-white">{stats.activeJobs}</p>
                        )}
                        <p className="text-white/50 text-sm">Active Jobs</p>
                    </div>
                    <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                <Users className="h-5 w-5 text-purple-400" />
                            </div>
                        </div>
                        {statsLoading ? (
                            <div className="h-8 w-12 bg-white/10 rounded animate-pulse" />
                        ) : (
                            <p className="text-2xl font-bold text-white">{stats.candidatesFound}</p>
                        )}
                        <p className="text-white/50 text-sm">Candidates Found</p>
                    </div>
                    <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                <TrendingUp className="h-5 w-5 text-emerald-400" />
                            </div>
                        </div>
                        {statsLoading ? (
                            <div className="h-8 w-12 bg-white/10 rounded animate-pulse" />
                        ) : (
                            <p className="text-2xl font-bold text-white">{stats.matchQuality}%</p>
                        )}
                        <p className="text-white/50 text-sm">Match Quality</p>
                    </div>
                    <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                <Target className="h-5 w-5 text-amber-400" />
                            </div>
                        </div>
                        {statsLoading ? (
                            <div className="h-8 w-12 bg-white/10 rounded animate-pulse" />
                        ) : (
                            <p className="text-2xl font-bold text-white">{stats.interviews}</p>
                        )}
                        <p className="text-white/50 text-sm">Interviews</p>
                    </div>
                </div>

                {/* Quick Actions */}
                <h2 className="text-xl font-semibold text-white mb-5">Quick Actions</h2>
                <div className="grid md:grid-cols-3 gap-5 mb-10">
                    {/* Post Job */}
                    <Link href="/recruiter/jobs" className="group">
                        <div className="relative p-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300 overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl translate-x-16 -translate-y-16 group-hover:bg-cyan-500/20 transition-colors" />
                            <div className="relative">
                                <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                    <Upload className="h-7 w-7 text-cyan-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">
                                    Post a Job
                                </h3>
                                <p className="text-white/50 text-sm mb-4">
                                    Upload job descriptions and let AI parse them
                                </p>
                                <div className="flex items-center text-cyan-400 text-sm font-medium">
                                    Create Job
                                    <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* Find Candidates */}
                    <Link href="/recruiter/chat" className="group">
                        <div className="relative p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl translate-x-16 -translate-y-16 group-hover:bg-purple-500/20 transition-colors" />
                            <div className="relative">
                                <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                    <Search className="h-7 w-7 text-purple-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">
                                    Find Candidates
                                </h3>
                                <p className="text-white/50 text-sm mb-4">
                                    Search with natural language queries
                                </p>
                                <div className="flex items-center text-purple-400 text-sm font-medium">
                                    Search Now
                                    <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* AI Chat */}
                    <Link href="/recruiter/chat" className="group">
                        <div className="relative p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300 overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl translate-x-16 -translate-y-16 group-hover:bg-emerald-500/20 transition-colors" />
                            <div className="relative">
                                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                    <MessageSquare className="h-7 w-7 text-emerald-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">
                                    AI Assistant
                                </h3>
                                <p className="text-white/50 text-sm mb-4">
                                    Get AI-powered recruitment insights
                                </p>
                                <div className="flex items-center text-emerald-400 text-sm font-medium">
                                    Start Chat
                                    <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Bottom Section */}
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Quick Links */}
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Zap className="h-5 w-5 text-amber-400" />
                            Quick Links
                        </h3>
                        <div className="space-y-2">
                            <Link
                                href="/recruiter/jobs"
                                className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <Briefcase className="h-5 w-5 text-white/40" />
                                    <span className="text-white/80">Manage Jobs</span>
                                </div>
                                <ChevronRight className="h-5 w-5 text-white/40 group-hover:text-white/60 group-hover:translate-x-1 transition-all" />
                            </Link>
                            <Link
                                href="/recruiter/chat"
                                className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <Users className="h-5 w-5 text-white/40" />
                                    <span className="text-white/80">Search Candidates</span>
                                </div>
                                <ChevronRight className="h-5 w-5 text-white/40 group-hover:text-white/60 group-hover:translate-x-1 transition-all" />
                            </Link>
                            <Link
                                href="/recruiter/chat"
                                className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <BarChart3 className="h-5 w-5 text-white/40" />
                                    <span className="text-white/80">Analytics</span>
                                </div>
                                <ChevronRight className="h-5 w-5 text-white/40 group-hover:text-white/60 group-hover:translate-x-1 transition-all" />
                            </Link>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-white/10">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-cyan-400" />
                            AI Insights
                        </h3>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3 text-white/60">
                                <span className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-xs font-bold flex-shrink-0 mt-0.5">!</span>
                                <span>3 new candidates match your &quot;Senior Developer&quot; role</span>
                            </li>
                            <li className="flex items-start gap-3 text-white/60">
                                <span className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-xs font-bold flex-shrink-0 mt-0.5">!</span>
                                <span>Your job posts have 40% higher engagement this week</span>
                            </li>
                            <li className="flex items-start gap-3 text-white/60">
                                <span className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold flex-shrink-0 mt-0.5">✓</span>
                                <span>AI found 5 highly qualified candidates for review</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </main>
        </div>
    );
}
