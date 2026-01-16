"use client";

import { ReactNode } from "react";
import { ThemeProvider } from "@thesysai/genui-sdk";

interface ThesysProviderProps {
    children: ReactNode;
}

/**
 * ThesysProvider - Wrapper for Thesys C1 Generative UI
 * 
 * This provider initializes the Thesys C1 SDK for generative UI components.
 * It wraps children with the ThemeProvider for consistent styling.
 */
export function ThesysProvider({ children }: ThesysProviderProps) {
    return <ThemeProvider>{children}</ThemeProvider>;
}

export default ThesysProvider;
