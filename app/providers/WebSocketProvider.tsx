"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import { quizSocket } from "@/back/WebSocket";

type WebSocketContextValue = {
    isConnected: boolean;
    connect: () => Promise<void>;
};

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

export function WebSocketProvider({ children }: { children: ReactNode }) {
    const [isConnected, setIsConnected] = useState(false);

    const connect = useCallback(async () => {
        await quizSocket.connect();
        setIsConnected(quizSocket.isConnected());
    }, []);

    useEffect(() => {
        connect().catch(() => setIsConnected(false));
    }, [connect]);

    useEffect(() => {
        connect().catch((err) => {
            console.error("SignalR connection failed", err);
            setIsConnected(false);
        });
    }, [connect]);

    const value = useMemo(
        () => ({
            isConnected,
            connect,
        }),
        [isConnected, connect]
    );

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
}

export function useWebSocket() {
    const context = useContext(WebSocketContext);

    if (!context) {
        throw new Error("useWebSocket must be used inside WebSocketProvider");
    }

    return context;
}