"use client";

import { useAuth } from "@/lib/auth";
import { useState, useCallback, useRef, useEffect } from "react";
import { Send, Sparkles, User, Bot, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamically import heavy SDK components to reduce initial bundle size
const C1Component = dynamic(
    () => import("@thesysai/genui-sdk").then((mod) => ({ default: mod.C1Component })),
    { 
        ssr: false,
        loading: () => (
            <div className="flex items-center gap-2 text-white/50">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading component...</span>
            </div>
        ),
    }
);

const ThemeProvider = dynamic(
    () => import("@thesysai/genui-sdk").then((mod) => ({ default: mod.ThemeProvider })),
    { ssr: false }
);

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    humanFriendlyContent?: string;
}

interface C1ChatContainerProps {
    userRole: "candidate" | "recruiter";
}

export default function C1ChatContainer({ userRole }: C1ChatContainerProps) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Get the token for authenticated API calls
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    // API URL with auth token - uses the C1 endpoint
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/c1/completions`;

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const sendMessage = useCallback(async (text: string, humanFriendlyText?: string) => {
        if (!text.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: text,
            humanFriendlyContent: humanFriendlyText || text,
        };

        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsStreaming(true);

        const assistantMessageId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, {
            id: assistantMessageId,
            role: "assistant",
            content: "",
        }]);

        try {
            const response = await fetch(`${apiUrl}?role=${userRole}${token ? `&token=${token}` : ""}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    messages: [
                        ...messages.map(m => ({ role: m.role, content: m.content })),
                        { role: "user", content: text }
                    ],
                    stream: true,
                    model: "c1/anthropic/claude-sonnet-4/v-20250815",
                }),
            });

            if (!response.ok) throw new Error("Failed to send message");

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let fullContent = "";

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split("\n");

                    for (const line of lines) {
                        if (line.startsWith("data: ") && line !== "data: [DONE]") {
                            try {
                                const data = JSON.parse(line.slice(6));
                                if (data.choices?.[0]?.delta?.content) {
                                    fullContent += data.choices[0].delta.content;
                                    setMessages(prev => prev.map(m =>
                                        m.id === assistantMessageId
                                            ? { ...m, content: fullContent }
                                            : m
                                    ));
                                }
                            } catch (e) {
                                // Ignore parse errors for incomplete JSON
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Error sending message:", error);
            setMessages(prev => prev.map(m =>
                m.id === assistantMessageId
                    ? { ...m, content: "Sorry, there was an error processing your request. Please try again." }
                    : m
            ));
        } finally {
            setIsStreaming(false);
            inputRef.current?.focus();
        }
    }, [messages, apiUrl, userRole, token]);

    const handleC1Action = useCallback(({ llmFriendlyMessage, humanFriendlyMessage }: {
        llmFriendlyMessage: string;
        humanFriendlyMessage: string;
    }) => {
        sendMessage(llmFriendlyMessage, humanFriendlyMessage);
    }, [sendMessage]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input);
    };

    const accentColor = userRole === "candidate" ? "purple" : "cyan";

    return (
        <ThemeProvider>
            <div className="h-full flex flex-col bg-neutral-950">
                {/* Messages area */}
                <div className="flex-1 overflow-auto">
                    <div className="max-w-4xl mx-auto p-4 space-y-6">
                        {messages.length === 0 && (
                            <div className="text-center py-20">
                                <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${userRole === "candidate"
                                    ? "from-purple-500/20 to-purple-500/10"
                                    : "from-cyan-500/20 to-cyan-500/10"
                                    } flex items-center justify-center mx-auto mb-6`}>
                                    <Sparkles className={`h-10 w-10 ${userRole === "candidate" ? "text-purple-400" : "text-cyan-400"
                                        }`} />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-3">
                                    {userRole === "candidate"
                                        ? "AI Career Assistant"
                                        : "AI Recruitment Assistant"}
                                </h2>
                                <p className="text-white/50 text-lg max-w-md mx-auto mb-8">
                                    {userRole === "candidate"
                                        ? "Ask about jobs, get resume feedback, or career advice"
                                        : "Search for candidates, analyze profiles, or get hiring recommendations"}
                                </p>

                                {/* Quick prompts */}
                                <div className="flex flex-wrap justify-center gap-3">
                                    {(userRole === "candidate" ? [
                                        "Find me remote React jobs",
                                        "Review my resume",
                                        "Career advice for developers"
                                    ] : [
                                        "Find senior developers",
                                        "Analyze candidate skills",
                                        "Interview questions for React"
                                    ]).map((prompt, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => sendMessage(prompt)}
                                            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${userRole === "candidate"
                                                ? "bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 hover:border-purple-500/40"
                                                : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 hover:border-cyan-500/40"
                                                }`}
                                        >
                                            {prompt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.map((message, index) => (
                            <div
                                key={message.id}
                                className={`flex gap-4 animate-fade-in ${message.role === "user" ? "justify-end" : "justify-start"
                                    }`}
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                {message.role === "assistant" && (
                                    <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${userRole === "candidate"
                                        ? "bg-gradient-to-br from-purple-500 to-purple-600"
                                        : "bg-gradient-to-br from-cyan-500 to-cyan-600"
                                        }`}>
                                        <Bot className="h-5 w-5 text-white" />
                                    </div>
                                )}

                                <div className={`max-w-[80%] ${message.role === "user" ? "order-first" : ""
                                    }`}>
                                    {message.role === "user" ? (
                                        <div className={`px-5 py-3.5 rounded-2xl ${userRole === "candidate"
                                            ? "bg-purple-500 text-white"
                                            : "bg-cyan-500 text-white"
                                            }`}>
                                            <p>{message.humanFriendlyContent || message.content}</p>
                                        </div>
                                    ) : (
                                        <div className="px-5 py-4 rounded-2xl bg-white/5 border border-white/10">
                                            {message.content ? (
                                                <C1Component
                                                    isStreaming={isStreaming && message.id === messages[messages.length - 1]?.id}
                                                    c1Response={message.content}
                                                    onAction={handleC1Action}
                                                />
                                            ) : (
                                                <div className="flex items-center gap-2 text-white/50">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    <span>Thinking...</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {message.role === "user" && (
                                    <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center bg-white/10">
                                        <User className="h-5 w-5 text-white/60" />
                                    </div>
                                )}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input area */}
                <div className="border-t border-white/10 p-4 bg-neutral-950/80 backdrop-blur-xl">
                    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
                        <div className={`flex items-center gap-3 p-2 rounded-2xl bg-white/5 border transition-all ${isStreaming
                            ? "border-white/10"
                            : userRole === "candidate"
                                ? "border-white/10 focus-within:border-purple-500/50"
                                : "border-white/10 focus-within:border-cyan-500/50"
                            }`}>
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                disabled={isStreaming}
                                placeholder={
                                    userRole === "candidate"
                                        ? "Ask about jobs, resume feedback, career advice..."
                                        : "Search candidates, analyze profiles, hiring tips..."
                                }
                                className="flex-1 px-4 py-3 bg-transparent text-white placeholder-white/30 focus:outline-none disabled:cursor-not-allowed"
                            />
                            <button
                                type="submit"
                                disabled={isStreaming || !input.trim()}
                                className={`p-3 rounded-xl font-medium text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed ${userRole === "candidate"
                                    ? "bg-gradient-to-r from-purple-500 to-purple-600 hover:opacity-90 shadow-lg shadow-purple-500/25"
                                    : "bg-gradient-to-r from-cyan-500 to-cyan-600 hover:opacity-90 shadow-lg shadow-cyan-500/25"
                                    }`}
                            >
                                {isStreaming ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Send className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                        <p className="text-center text-white/30 text-xs mt-3">
                            AI responses may not always be accurate. Verify important information.
                        </p>
                    </form>
                </div>
            </div>
        </ThemeProvider>
    );
}
