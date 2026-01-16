"use client";

import { useCallback, useState } from "react";
import { Upload, File, X, Loader2, CheckCircle } from "lucide-react";

interface FileUploadProps {
    onUpload: (file: File) => Promise<void>;
    uploading: boolean;
    accept?: string;
}

export default function FileUpload({
    onUpload,
    uploading,
    accept = ".pdf,.docx",
}: FileUploadProps) {
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            setSelectedFile(file);
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (selectedFile) {
            await onUpload(selectedFile);
            setSelectedFile(null);
        }
    };

    const clearFile = () => {
        setSelectedFile(null);
    };

    return (
        <div className="w-full">
            {!selectedFile ? (
                <div
                    className={`relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300 ${dragActive
                        ? "border-purple-500 bg-purple-500/10"
                        : "border-white/20 hover:border-white/40 bg-white/5"
                        }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <input
                        type="file"
                        accept={accept}
                        onChange={handleChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center text-center">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors ${dragActive ? "bg-purple-500/20" : "bg-white/10"
                            }`}>
                            <Upload className={`h-8 w-8 transition-colors ${dragActive ? "text-purple-400" : "text-white/50"
                                }`} />
                        </div>
                        <p className="text-lg font-medium text-white mb-2">
                            Drop your file here, or{" "}
                            <span className="text-purple-400">browse</span>
                        </p>
                        <p className="text-sm text-white/50">
                            Supports: {accept.replace(/\./g, "").toUpperCase().replace(/,/g, ", ")}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                                <File className="h-6 w-6 text-purple-400" />
                            </div>
                            <div>
                                <p className="font-medium text-white">{selectedFile.name}</p>
                                <p className="text-sm text-white/50">
                                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={clearFile}
                            className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
                            disabled={uploading}
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <button
                        onClick={handleUpload}
                        disabled={uploading}
                        className={`w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-500 to-purple-600 hover:opacity-90 transition-all shadow-lg shadow-purple-500/25 ${uploading ? "opacity-70 cursor-not-allowed" : ""
                            }`}
                    >
                        {uploading ? (
                            <span className="flex items-center justify-center">
                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                Uploading...
                            </span>
                        ) : (
                            <span className="flex items-center justify-center">
                                <CheckCircle className="h-5 w-5 mr-2" />
                                Upload File
                            </span>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
