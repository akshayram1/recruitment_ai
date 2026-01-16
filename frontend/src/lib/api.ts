import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("token");
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            if (typeof window !== "undefined") {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authApi = {
    login: async (email: string, password: string) => {
        const response = await api.post("/auth/login", { email, password });
        return response.data;
    },

    register: async (data: {
        email: string;
        password: string;
        name: string;
        company?: string;
        role: "candidate" | "recruiter";
    }) => {
        const endpoint = data.role === "candidate" ? "/auth/register/candidate" : "/auth/register/recruiter";
        const response = await api.post(endpoint, data);
        return response.data;
    },

    getProfile: async () => {
        const response = await api.get("/auth/me");
        return response.data;
    },
};

// Chat API
export const chatApi = {
    sendMessage: async (message: string, conversationId?: string) => {
        const response = await api.post("/chat/message", {
            message,
            conversation_id: conversationId,
        });
        return response.data;
    },

    streamMessage: (
        message: string,
        conversationId: string | undefined,
        onChunk: (chunk: string) => void,
        onComplete: (data: any) => void,
        onError: (error: any) => void
    ) => {
        const token = localStorage.getItem("token");
        const eventSource = new EventSource(
            `${API_URL}/chat/stream?message=${encodeURIComponent(message)}${conversationId ? `&conversation_id=${conversationId}` : ""
            }&token=${token}`
        );

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === "chunk") {
                onChunk(data.content);
            } else if (data.type === "complete") {
                onComplete(data);
                eventSource.close();
            }
        };

        eventSource.onerror = (error) => {
            onError(error);
            eventSource.close();
        };

        return () => eventSource.close();
    },

    getHistory: async (conversationId: string) => {
        const response = await api.get(`/chat/history/${conversationId}`);
        return response.data;
    },

    getConversations: async () => {
        const response = await api.get("/chat/conversations");
        return response.data;
    },
};

// Candidate API
export const candidateApi = {
    uploadResume: async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        const response = await api.post("/candidate/resume/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data;
    },

    getResume: async () => {
        const response = await api.get("/candidate/resume");
        return response.data;
    },

    searchJobs: async (query: string) => {
        const response = await api.post("/candidate/search/jobs", { query });
        return response.data;
    },
};

// Recruiter API
export const recruiterApi = {
    uploadJob: async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        const response = await api.post("/recruiter/job/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data;
    },

    getJobs: async () => {
        const response = await api.get("/recruiter/jobs");
        return response.data;
    },

    getJob: async (jobId: string) => {
        const response = await api.get(`/recruiter/job/${jobId}`);
        return response.data;
    },

    deleteJob: async (jobId: string) => {
        const response = await api.delete(`/recruiter/job/${jobId}`);
        return response.data;
    },

    searchCandidates: async (query: string, jobId?: string) => {
        const response = await api.post("/recruiter/search/candidates", {
            query,
            job_id: jobId,
        });
        return response.data;
    },
};

export default api;
