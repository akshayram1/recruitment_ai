"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    MessageSquare,
    Upload,
    Search,
    User,
    LogOut,
    Sparkles,
    FileText,
    TrendingUp,
    Target,
    Zap,
    ChevronRight,
    Briefcase,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { candidateApi, api } from "@/lib/api";

interface CandidateStats {
    resumeUploaded: number;
    jobsMatched: number;
    profileScore: number;
    applications: number;
}

export default function CandidateHomePage() {
    const router = useRouter();
    const { user, isAuthenticated, logout, loading } = useAuth();
    const [greeting, setGreeting] = useState("Welcome");
    const [stats, setStats] = useState<CandidateStats>({
        resumeUploaded: 0,
        jobsMatched: 0,
        profileScore: 0,
        applications: 0,
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
        if (!loading && user && user.role !== "candidate") {
            router.push("/recruiter");
        }
    }, [isAuthenticated, user, loading, router]);

    useEffect(() => {
        const fetchStats = async () => {
            if (!isAuthenticated || !user) return;

            try {
                setStatsLoading(true);
                
                // Check if resume is uploaded
                let resumeUploaded = 0;
                let jobsMatched = 0;
                let profileScore = 0;
                
                try {
                    const resume = await candidateApi.getResume();
                    resumeUploaded = resume ? 1 : 0;
                    
                    // If resume exists, fetch job matches
                    if (resume) {
                        try {
                            const matches = await api.get("/candidate/jobs/matches?limit=100");
                            jobsMatched = matches.data.length;
                            
                            // Calculate profile score based on resume completeness
                            let score = 0;
                            if (resume.parsed_data?.name) score += 10;
                            if (resume.parsed_data?.email) score += 10;
                            if (resume.parsed_data?.phone) score += 10;
                            if (resume.parsed_data?.summary) score += 15;
                            if (resume.parsed_data?.skills?.length > 0) score += 20;
                            if (resume.parsed_data?.experience?.length > 0) score += 20;
                            if (resume.parsed_data?.education?.length > 0) score += 15;
                            profileScore = Math.min(score, 100);
                        } catch (error) {
                            console.error("Failed to fetch job matches:", error);
                        }
                    }
                } catch (error) {
                    // Resume not found
                    resumeUploaded = 0;
                }

                setStats({
                    resumeUploaded,
                    jobsMatched,
                    profileScore,
                    applications: 0, // This would need a separate endpoint
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
                    <div className="w-12 h-12 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
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
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <header className="relative z-10 border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                                <Sparkles className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-lg font-bold text-white">RecruitAI</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-medium">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-white/80">{user.name}</span>
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
                    <p className="text-purple-400 font-medium mb-2">{greeting}</p>
                    <h1 className="text-4xl font-bold text-white mb-3">
                        {user.name.split(' ')[0]} 👋
                    </h1>
                    <p className="text-white/60 text-lg">
                        Ready to find your next opportunity? Let&apos;s get started.
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                    <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                <FileText className="h-5 w-5 text-purple-400" />
                            </div>
                        </div>
                        {statsLoading ? (
                            <div className="h-8 w-12 bg-white/10 rounded animate-pulse" />
                        ) : (
                            <p className="text-2xl font-bold text-white">{stats.resumeUploaded}</p>
                        )}
                        <p className="text-white/50 text-sm">Resume Uploaded</p>
                    </div>
                    <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                                <Briefcase className="h-5 w-5 text-cyan-400" />
                            </div>
                        </div>
                        {statsLoading ? (
                            <div className="h-8 w-12 bg-white/10 rounded animate-pulse" />
                        ) : (
                            <p className="text-2xl font-bold text-white">{stats.jobsMatched}</p>
                        )}
                        <p className="text-white/50 text-sm">Jobs Matched</p>
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
                            <p className="text-2xl font-bold text-white">{stats.profileScore}%</p>
                        )}
                        <p className="text-white/50 text-sm">Profile Score</p>
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
                            <p className="text-2xl font-bold text-white">{stats.applications}</p>
                        )}
                        <p className="text-white/50 text-sm">Applications</p>
                    </div>
                </div>

                {/* Quick Actions */}
                <h2 className="text-xl font-semibold text-white mb-5">Quick Actions</h2>
                <div className="grid md:grid-cols-3 gap-5 mb-10">
                    {/* Upload Resume */}
                    <Link href="/candidate/profile" className="group">
                        <div className="relative p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl translate-x-16 -translate-y-16 group-hover:bg-purple-500/20 transition-colors" />
                            <div className="relative">
                                <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                    <Upload className="h-7 w-7 text-purple-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">
                                    Upload Resume
                                </h3>
                                <p className="text-white/50 text-sm mb-4">
                                    Update your resume to improve job matches
                                </p>
                                <div className="flex items-center text-purple-400 text-sm font-medium">
                                    Go to Profile
                                    <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* Find Jobs */}
                    <Link href="/candidate/chat" className="group">
                        <div className="relative p-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300 overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl translate-x-16 -translate-y-16 group-hover:bg-cyan-500/20 transition-colors" />
                            <div className="relative">
                                <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                    <Search className="h-7 w-7 text-cyan-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">
                                    Find Jobs
                                </h3>
                                <p className="text-white/50 text-sm mb-4">
                                    Discover opportunities matching your skills
                                </p>
                                <div className="flex items-center text-cyan-400 text-sm font-medium">
                                    Search Now
                                    <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* AI Chat */}
                    <Link href="/candidate/chat" className="group">
                        <div className="relative p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300 overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl translate-x-16 -translate-y-16 group-hover:bg-emerald-500/20 transition-colors" />
                            <div className="relative">
                                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                    <MessageSquare className="h-7 w-7 text-emerald-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">
                                    AI Career Coach
                                </h3>
                                <p className="text-white/50 text-sm mb-4">
                                    Get personalized career advice and insights
                                </p>
                                <div className="flex items-center text-emerald-400 text-sm font-medium">
                                    Start Chat
                                    <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Recent Activity / Tips */}
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Navigation Links */}
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Zap className="h-5 w-5 text-amber-400" />
                            Quick Links
                        </h3>
                        <div className="space-y-2">
                            <Link
                                href="/candidate/profile"
                                className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <User className="h-5 w-5 text-white/40" />
                                    <span className="text-white/80">View Profile</span>
                                </div>
                                <ChevronRight className="h-5 w-5 text-white/40 group-hover:text-white/60 group-hover:translate-x-1 transition-all" />
                            </Link>
                            <Link
                                href="/candidate/chat"
                                className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <MessageSquare className="h-5 w-5 text-white/40" />
                                    <span className="text-white/80">AI Chat</span>
                                </div>
                                <ChevronRight className="h-5 w-5 text-white/40 group-hover:text-white/60 group-hover:translate-x-1 transition-all" />
                            </Link>
                        </div>
                    </div>

                    {/* Tips Card */}
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-cyan-500/10 border border-white/10">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-purple-400" />
                            Pro Tips
                        </h3>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3 text-white/60">
                                <span className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                                <span>Upload an updated resume to improve your match accuracy by up to 40%</span>
                            </li>
                            <li className="flex items-start gap-3 text-white/60">
                                <span className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                                <span>Use the AI Chat to get personalized job recommendations</span>
                            </li>
                            <li className="flex items-start gap-3 text-white/60">
                                <span className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                                <span>Ask the AI to help you prepare for interviews</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </main>
        </div>
    );
}
