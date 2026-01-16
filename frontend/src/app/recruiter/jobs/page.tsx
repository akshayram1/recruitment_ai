"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, Plus, Trash2, Briefcase, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import FileUpload from "@/components/ui/file-upload";

export default function RecruiterJobsPage() {
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();

    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [showUpload, setShowUpload] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/login");
        }
    }, [isAuthenticated, authLoading, router]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchJobs();
        }
    }, [isAuthenticated]);

    const fetchJobs = async () => {
        try {
            const response = await api.get("/recruiter/jobs");
            setJobs(response.data);
        } catch (err: any) {
            setError("Failed to fetch jobs");
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (file: File) => {
        setUploading(true);
        setError("");

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await api.post("/recruiter/job/upload", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            setJobs([response.data, ...jobs]);
            setShowUpload(false);
        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to upload job description");
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteJob = async (jobId: string) => {
        if (!confirm("Are you sure you want to delete this job?")) return;

        try {
            await api.delete(`/recruiter/job/${jobId}`);
            setJobs(jobs.filter((job) => job.id !== jobId));
        } catch (err: any) {
            setError("Failed to delete job");
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link
                            href="/recruiter"
                            className="flex items-center text-gray-600 hover:text-gray-900"
                        >
                            <ArrowLeft className="h-5 w-5 mr-2" />
                            Back
                        </Link>
                        <button
                            onClick={() => setShowUpload(!showUpload)}
                            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            <Plus className="h-5 w-5" />
                            Add Job
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Job Postings</h1>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {/* Upload Section */}
                {showUpload && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">
                            Upload Job Description
                        </h2>
                        <FileUpload
                            onUpload={handleFileUpload}
                            uploading={uploading}
                            accept=".pdf,.docx,.txt"
                        />
                    </div>
                )}

                {/* Jobs List */}
                {jobs.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                        <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No jobs posted yet
                        </h3>
                        <p className="text-gray-600 mb-4">
                            Upload a job description to get started
                        </p>
                        <button
                            onClick={() => setShowUpload(true)}
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            Add Your First Job
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {jobs.map((job) => (
                            <div
                                key={job.id}
                                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                            {job.parsed_data?.title || "Untitled Position"}
                                        </h3>
                                        <p className="text-gray-600 mb-4">
                                            {job.parsed_data?.company || user?.company} •{" "}
                                            {job.parsed_data?.location || "Location not specified"}
                                        </p>

                                        {/* Skills */}
                                        {job.parsed_data?.required_skills?.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {job.parsed_data.required_skills.slice(0, 5).map(
                                                    (skill: string, index: number) => (
                                                        <span
                                                            key={index}
                                                            className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                                                        >
                                                            {skill}
                                                        </span>
                                                    )
                                                )}
                                                {job.parsed_data.required_skills.length > 5 && (
                                                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                                                        +{job.parsed_data.required_skills.length - 5} more
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <span>
                                                Posted: {new Date(job.created_at).toLocaleDateString()}
                                            </span>
                                            {job.parsed_data?.salary_range && (
                                                <span>Salary: {job.parsed_data.salary_range}</span>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleDeleteJob(job.id)}
                                        className="text-gray-400 hover:text-red-500 transition-colors p-2"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
