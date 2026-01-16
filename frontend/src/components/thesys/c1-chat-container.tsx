"use client";

import { C1Component, ThemeProvider } from "@thesysai/genui-sdk";
import { useAuth } from "@/lib/auth";
import { useState, useCallback } from "react";

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

    // Get the token for authenticated API calls
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    // API URL with auth token - uses the C1 endpoint
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/c1/completions`;

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
                    ? { ...m, content: "Sorry, there was an error processing your request." }
                    : m
            ));
        } finally {
            setIsStreaming(false);
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

    return (
        <ThemeProvider>
            <div className="h-full flex flex-col bg-white">
                {/* Messages area */}
                <div className="flex-1 overflow-auto p-4">
                    <div className="max-w-3xl mx-auto space-y-4">
                        {messages.length === 0 && (
                            <div className="text-center text-gray-500 py-12">
                                <h2 className="text-xl font-semibold mb-2">
                                    {userRole === "candidate"
                                        ? "Welcome to AI Career Assistant"
                                        : "Welcome to AI Recruitment Assistant"}
                                </h2>
                                <p>
                                    {userRole === "candidate"
                                        ? "Ask about jobs, get resume feedback, or career advice"
                                        : "Search for candidates, analyze profiles, or get hiring recommendations"}
                                </p>
                            </div>
                        )}

                        {messages.map((message) => (
                            <div key={message.id} className="p-4 rounded-lg bg-gray-50">
                                {message.role === "user" ? (
                                    <div className="text-gray-700">
                                        <span className="font-semibold text-blue-600">You: </span>
                                        {message.humanFriendlyContent || message.content}
                                    </div>
                                ) : (
                                    <div>
                                        <span className="font-semibold text-green-600">Assistant: </span>
                                        <C1Component
                                            isStreaming={isStreaming && message.id === messages[messages.length - 1]?.id}
                                            c1Response={message.content}
                                            onAction={handleC1Action}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Input area */}
                <div className="border-t p-4">
                    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={isStreaming}
                            placeholder={
                                userRole === "candidate"
                                    ? "Ask about jobs, resume feedback, career advice..."
                                    : "Search candidates, analyze profiles, hiring recommendations..."
                            }
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            type="submit"
                            disabled={isStreaming || !input.trim()}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Send
                        </button>
                    </form>
                </div>
            </div>
        </ThemeProvider>
    );
}
