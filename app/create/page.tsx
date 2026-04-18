"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { quizSocket } from "@/back/WebSocket";
import { useWebSocket } from "@/app/providers/WebSocketProvider";

export default function CreatePage() {
    const [duration, setDuration] = useState(10);
    const [isCreating, setIsCreating] = useState(false);
    const router = useRouter();
    const { isConnected } = useWebSocket();

    const handleCreate = async () => {
        if (duration <= 0) return;

        setIsCreating(true);

        try {
            await quizSocket.connect();

            const roomId = await quizSocket.createRoom();

            router.push(`/lobby/${encodeURIComponent(roomId)}`);
        } catch (err) {
            console.error("Erreur création room", err);
        } finally {
            setIsCreating(false);
        }
    };
    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-900 text-white">
            <div className="flex flex-col gap-6 w-80">

                <h1 className="text-2xl font-bold text-center">
                    Créer une partie
                </h1>

                <label htmlFor="time">Durée (min)</label>
                <input
                    id="time"
                    name="time"
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full p-3 rounded-lg text-white border border-zinc-700 bg-zinc-800"
                    placeholder="Durée (minutes)"
                />

                <button
                    onClick={handleCreate}
                    disabled={duration <= 0 || isCreating}
                    className="cursor-pointer w-full bg-blue-500 hover:bg-blue-600 p-3 rounded-lg disabled:opacity-50"
                >
                    {isCreating ? "Creation..." : "Creer"}
                </button>

            </div>

            <div className="fixed bottom-4 right-4">
    <div
        className={`w-4 h-4 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
        title={isConnected ? "WebSocket connecté" : "WebSocket déconnecté"}
    />
</div>
        </div>
    )
}
