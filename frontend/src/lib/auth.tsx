"use client";

import {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from "react";
import { authApi } from "./api";

export interface User {
    id: string;
    email: string;
    name: string;
    role: "candidate" | "recruiter";
    company?: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (email: string, password: string) => Promise<User>;
    register: (data: {
        email: string;
        password: string;
        name: string;
        company?: string;
        role: "candidate" | "recruiter";
    }) => Promise<User>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for existing session
        const token = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (token && storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
            }
        }
        setLoading(false);
    }, []);

    const login = async (email: string, password: string): Promise<User> => {
        const response = await authApi.login(email, password);
        const { access_token, user: userData } = response;

        localStorage.setItem("token", access_token);
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);

        return userData;
    };

    const register = async (data: {
        email: string;
        password: string;
        name: string;
        company?: string;
        role: "candidate" | "recruiter";
    }): Promise<User> => {
        const response = await authApi.register(data);
        const { access_token, user: userData } = response;

        localStorage.setItem("token", access_token);
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);

        return userData;
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                loading,
                login,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

export default AuthProvider;
