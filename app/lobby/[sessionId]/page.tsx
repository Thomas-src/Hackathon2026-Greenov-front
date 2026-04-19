"use client";

import {useParams, useRouter} from "next/navigation";
import QRCode from "react-qr-code";
import {useWebSocket} from "@/app/providers/WebSocketProvider";
import {getBaseUrl} from "@/utils/constants";
import {useQuizContext} from "@/app/providers/QuizProvider";

export default function LobbyPage() {
    const {sessionId} = useParams<{ sessionId: string }>();
    const router = useRouter();
    const {isConnected} = useWebSocket();
    const {startGame, playersCount} = useQuizContext();

    const joinUrl = `${getBaseUrl()}/join/${sessionId}`;

    const handleStart = async () => {
        await startGame();
        router.push(`/game/${sessionId}`);
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-4"
             style={{background: "var(--background)"}}>

            <div className="text-center">
                <h1 className="text-4xl font-black" style={{color: "var(--green)"}}>Greenov</h1>
                <p className="text-sm mt-1" style={{color: "rgba(232,245,232,0.5)"}}>Scanne le QR code pour
                    rejoindre</p>
            </div>
            <div className="flex flex-col items-center gap-4 rounded-2xl p-6"
                 style={{background: "var(--card)", border: "1px solid var(--border)"}}>
                <div className="rounded-xl overflow-hidden p-3" style={{background: "white"}}>
                    <QRCode value={joinUrl} size={350}/>
                </div>
                <p className="text-sm font-mono px-3 py-2 rounded-lg" style={{
                    background: "rgba(76,194,74,0.07)",
                    color: "rgba(232,245,232,0.5)",
                    border: "1px solid var(--border)"
                }}>
                    {joinUrl}
                </p>
            </div>

            <div className="absolute bottom-5 right-5">
            <div className="flex flex-col items-center gap-4 w-full max-w-xs">
                <div
                    className="w-full flex flex-col items-center justify-center gap-1 rounded-xl px-4 py-3 text-center"
                    style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
    <span className="text-2xl font-black" style={{ color: "var(--green)" }}>
        {playersCount}
    </span>
                    <span className="text-sm" style={{ color: "rgba(232,245,232,0.5)" }}>
        Joueurs connectés
    </span>
                </div>

                <button onClick={handleStart} disabled={playersCount === 0} className="cool-btn">
                   Démarrer
                </button>
            </div>

            </div>

            <div className="fixed top-4 left-4 flex items-center gap-2">
                <span className="text-xs"
                      style={{color: "rgba(232,245,232,0.3)"}}>{isConnected ? "Connecté" : "Déconnecté"}</span>
                <div className={`w-2 h-2 rounded-full ${isConnected ? "animate-pulse" : ""}`}
                     style={{background: isConnected ? "var(--green)" : "var(--red)"}}/>
            </div>
        </div>
    );
}