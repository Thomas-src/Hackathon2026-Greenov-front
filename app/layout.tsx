import type {Metadata} from "next";
import {Geist, Geist_Mono} from "next/font/google";
import "./globals.css";
import {WebSocketProvider} from "./providers/WebSocketProvider";
import {GameStateProvider} from "@/app/providers/GameStateProvider";
import {QuizProvider} from "@/app/providers/QuizProvider";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Greenov",
    description: "Objetif rénovation, le tout de manière écolo",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="fr"
            className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        >
        <body className="min-h-full flex flex-col">
        <WebSocketProvider>
            <GameStateProvider>
                <QuizProvider>
                    {children}
                </QuizProvider>
            </GameStateProvider>
        </WebSocketProvider>
        </body>
        </html>
    );
}
