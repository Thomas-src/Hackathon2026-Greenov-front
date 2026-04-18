"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWebSocket } from "@/app/providers/WebSocketProvider";
import { useQuiz } from "@/hooks/useQuiz";

export default function CreatePage() {
    const [duration, setDuration] = useState(10);
    const [isCreating, setIsCreating] = useState(false);
    const router = useRouter();
    const { isConnected } = useWebSocket();
    const { createRoom } = useQuiz();

    const handleCreate = async () => {
        if (duration <= 0) return;
        setIsCreating(true);
        try {
            const roomCreated = await createRoom(duration);
            if (!roomCreated) { console.warn("Room ID does not exist!"); return; }
            router.push(`/lobby/${roomCreated.roomId}`);
        } catch (err) {
            console.error("Erreur création room", err);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4" style={{ background: "var(--background)" }}>
            <div className="w-full max-w-sm flex flex-col gap-6">

                <div className="text-center">
                    <h1 className="text-4xl font-black" style={{ color: "var(--green)" }}>Jeux&#39;Rénov</h1>
                    <p className="text-sm mt-1" style={{ color: "rgba(232,245,232,0.5)" }}>Créer une nouvelle partie</p>
                </div>

                <div className="flex flex-col gap-5 rounded-2xl p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                    <h2 className="text-xl font-bold text-center">Paramètres</h2>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(232,245,232,0.4)" }}>
                            Durée (minutes)
                        </label>
                        <input
                            type="number"
                            value={duration}
                            onChange={(e) => setDuration(Number(e.target.value))}
                            className="cool-input"
                            placeholder="Ex: 10"
                            min={1}
                        />
                    </div>

                    <button onClick={handleCreate} disabled={duration <= 0 || isCreating} className="cool-btn">
                        {isCreating ? "Création..." : "Créer la partie →"}
                    </button>
                </div>

            </div>

            <div className="fixed bottom-4 right-4 flex items-center gap-2">
                <span className="text-xs" style={{ color: "rgba(232,245,232,0.3)" }}>{isConnected ? "Connecté" : "Déconnecté"}</span>
                <div className={`w-2 h-2 rounded-full ${isConnected ? "animate-pulse" : ""}`} style={{ background: isConnected ? "var(--green)" : "var(--red)" }} />
            </div>
        </div>
    );
}