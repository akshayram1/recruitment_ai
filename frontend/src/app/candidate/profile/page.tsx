"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, Loader2, Check, FileText } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import FileUpload from "@/components/ui/file-upload";

export default function CandidateProfilePage() {
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();

    const [resume, setResume] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/login");
        }
    }, [isAuthenticated, authLoading, router]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchResume();
        }
    }, [isAuthenticated]);

    const fetchResume = async () => {
        try {
            const response = await api.get("/candidate/resume");
            setResume(response.data);
        } catch (err: any) {
            if (err.response?.status !== 404) {
                setError("Failed to fetch resume");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (file: File) => {
        setUploading(true);
        setError("");
        setSuccess("");

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await api.post("/candidate/resume/upload", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            setResume(response.data);
            setSuccess("Resume uploaded successfully!");
        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to upload resume");
        } finally {
            setUploading(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center h-16">
                        <Link
                            href="/candidate"
                            className="flex items-center text-gray-600 hover:text-gray-900"
                        >
                            <ArrowLeft className="h-5 w-5 mr-2" />
                            Back
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Profile</h1>

                {/* Upload Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                        {resume ? "Update Resume" : "Upload Resume"}
                    </h2>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4 flex items-center">
                            <Check className="h-5 w-5 mr-2" />
                            {success}
                        </div>
                    )}

                    <FileUpload
                        onUpload={handleFileUpload}
                        uploading={uploading}
                        accept=".pdf,.docx"
                    />
                </div>

                {/* Resume Preview */}
                {resume && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-gray-900">
                                Resume Details
                            </h2>
                            {resume.file_name && (
                                <div className="flex items-center text-gray-500 text-sm">
                                    <FileText className="h-4 w-4 mr-2" />
                                    {resume.file_name}
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                            {/* Name */}
                            {resume.parsed_data?.name && (
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900">
                                        {resume.parsed_data.name}
                                    </h3>
                                    <p className="text-gray-600">
                                        {resume.parsed_data.email} • {resume.parsed_data.phone}
                                    </p>
                                </div>
                            )}

                            {/* Summary */}
                            {resume.parsed_data?.summary && (
                                <div>
                                    <h4 className="font-medium text-gray-700 mb-2">Summary</h4>
                                    <p className="text-gray-600">{resume.parsed_data.summary}</p>
                                </div>
                            )}

                            {/* Skills */}
                            {resume.parsed_data?.skills?.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-gray-700 mb-2">Skills</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {resume.parsed_data.skills.map((skill: string, index: number) => (
                                            <span
                                                key={index}
                                                className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Experience */}
                            {resume.parsed_data?.experience?.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-gray-700 mb-2">Experience</h4>
                                    <div className="space-y-4">
                                        {resume.parsed_data.experience.map((exp: any, index: number) => (
                                            <div key={index} className="border-l-2 border-indigo-200 pl-4">
                                                <h5 className="font-medium text-gray-900">
                                                    {exp.title} at {exp.company}
                                                </h5>
                                                <p className="text-gray-500 text-sm">{exp.duration}</p>
                                                {exp.description && (
                                                    <p className="text-gray-600 mt-1">{exp.description}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Education */}
                            {resume.parsed_data?.education?.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-gray-700 mb-2">Education</h4>
                                    <div className="space-y-2">
                                        {resume.parsed_data.education.map((edu: any, index: number) => (
                                            <div key={index}>
                                                <h5 className="font-medium text-gray-900">{edu.degree}</h5>
                                                <p className="text-gray-600">
                                                    {edu.institution} {edu.year && `• ${edu.year}`}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
