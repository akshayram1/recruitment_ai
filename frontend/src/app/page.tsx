"use client";

import Link from "next/link";
import { Users, Briefcase, ArrowRight, Sparkles, Search, MessageSquare } from "lucide-react";

export default function Home() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-8 w-8 text-indigo-600" />
                            <span className="text-xl font-bold text-gray-900">RecruitAI</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link
                                href="/login"
                                className="text-gray-600 hover:text-gray-900 font-medium"
                            >
                                Sign In
                            </Link>
                            <Link
                                href="/register"
                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                            >
                                Get Started
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto text-center">
                    <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6">
                        Hire Smarter with{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                            AI-Powered
                        </span>{" "}
                        Recruitment
                    </h1>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
                        Connect candidates and recruiters through intelligent matching,
                        semantic search, and conversational AI. Experience the future of
                        hiring.
                    </p>

                    {/* Role Selection Cards */}
                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-12">
                        {/* Candidate Card */}
                        <Link href="/register?role=candidate" className="group">
                            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:border-indigo-200 hover:shadow-xl transition-all duration-300">
                                <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-200 transition-colors">
                                    <Users className="h-8 w-8 text-indigo-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                                    I&apos;m a Candidate
                                </h2>
                                <p className="text-gray-600 mb-6">
                                    Upload your resume and let AI find the perfect job matches for
                                    you. Chat with your resume and get career insights.
                                </p>
                                <div className="flex items-center text-indigo-600 font-medium group-hover:gap-2 transition-all">
                                    Find Your Dream Job
                                    <ArrowRight className="h-5 w-5 ml-2" />
                                </div>
                            </div>
                        </Link>

                        {/* Recruiter Card */}
                        <Link href="/register?role=recruiter" className="group">
                            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:border-purple-200 hover:shadow-xl transition-all duration-300">
                                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-200 transition-colors">
                                    <Briefcase className="h-8 w-8 text-purple-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                                    I&apos;m a Recruiter
                                </h2>
                                <p className="text-gray-600 mb-6">
                                    Post jobs and discover top talent with AI-powered candidate
                                    matching. Chat with multiple resumes simultaneously.
                                </p>
                                <div className="flex items-center text-purple-600 font-medium group-hover:gap-2 transition-all">
                                    Find Top Talent
                                    <ArrowRight className="h-5 w-5 ml-2" />
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            Powered by Advanced AI
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Our platform uses cutting-edge AI technology to transform the
                            recruitment experience for both candidates and recruiters.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="text-center">
                            <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <Search className="h-7 w-7 text-indigo-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                Semantic Search
                            </h3>
                            <p className="text-gray-600">
                                Find candidates or jobs using natural language. Our AI
                                understands context and meaning, not just keywords.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="text-center">
                            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <MessageSquare className="h-7 w-7 text-purple-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                Conversational AI
                            </h3>
                            <p className="text-gray-600">
                                Chat with resumes and job descriptions. Ask questions, get
                                insights, and make informed decisions.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="text-center">
                            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <Sparkles className="h-7 w-7 text-green-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                Smart Matching
                            </h3>
                            <p className="text-gray-600">
                                AI-powered matching scores show you the best fits. Understand
                                why each match is recommended.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-100">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <Sparkles className="h-6 w-6 text-indigo-600" />
                        <span className="text-lg font-bold text-gray-900">RecruitAI</span>
                    </div>
                    <p className="text-gray-500">
                        © 2024 AI Recruitment Platform. All rights reserved.
                    </p>
                </div>
            </footer>
        </main>
    );
}
