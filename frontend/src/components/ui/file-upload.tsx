"use client";

import { useCallback, useState } from "react";
import { Upload, File, X, Loader2 } from "lucide-react";

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
                    className={`relative border-2 border-dashed rounded-xl p-8 transition-colors ${dragActive
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-gray-300 hover:border-gray-400"
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
                        <Upload className="h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-lg font-medium text-gray-700 mb-1">
                            Drop your file here, or{" "}
                            <span className="text-indigo-600">browse</span>
                        </p>
                        <p className="text-sm text-gray-500">
                            Supports: {accept.replace(/\./g, "").toUpperCase().replace(/,/g, ", ")}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="border rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                <File className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                                <p className="text-sm text-gray-500">
                                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={clearFile}
                            className="text-gray-400 hover:text-gray-600"
                            disabled={uploading}
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <button
                        onClick={handleUpload}
                        disabled={uploading}
                        className={`mt-4 w-full py-2 rounded-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors ${uploading ? "opacity-70 cursor-not-allowed" : ""
                            }`}
                    >
                        {uploading ? (
                            <span className="flex items-center justify-center">
                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                Uploading...
                            </span>
                        ) : (
                            "Upload File"
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
