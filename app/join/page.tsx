"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { quizSocket } from "@/back/WebSocket";
import { useWebSocket } from "@/app/providers/WebSocketProvider";

const random = (min: number, max: number) =>
    Math.random() * (max - min) + min;

type Profile = "house" | "flat" | "company";

const houseByProfile: Record<Profile, string> = {
    house: "/houses/house.gif",
    flat: "/houses/flat.gif",
    company: "/houses/company.gif",
};

type Player = {
    id: string;
    name: string;
    profile: Profile;
    x: number;
    y: number;
    isMe: boolean;
};

function House({ src, x, y, isMe }: any) {
    const scale = isMe ? 1.3 : random(0.85, 1.1);

    return (
        <img
            alt={`Maison`}
            src={src}
            className={`absolute ${isMe ? "w-20 z-20" : "w-16"}`}
            style={{
                left: x,
                top: y,
                transform: `scale(${scale})`,
            }}
        />
    );
}

function generatePositions(count: number, size: number) {
    const positions: { x: number; y: number }[] = [];
    const gridSize = 60;

    const isTooClose = (x: number, y: number) =>
        positions.some(
            (p) =>
                Math.abs(p.x - x) < gridSize &&
                Math.abs(p.y - y) < gridSize
        );

    for (let i = 0; i < count; i++) {
        let x = 0;
        let y = 0;
        let attempts = 0;

        do {
            x = random(0, size - 60);
            y = random(0, size - 60);
            attempts++;
        } while (isTooClose(x, y) && attempts < 50);

        positions.push({ x, y });
    }

    return positions;
}

export default function JoinPage() {
    const searchParams = useSearchParams();
    const sessionIdFromUrl = searchParams.get("game");

    const [sessionId, setSessionId] = useState(sessionIdFromUrl || "");
    const [name, setName] = useState("");
    const [profile, setProfile] = useState<Profile>("house");
    const [joined, setJoined] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [players, setPlayers] = useState<Player[]>([]);
    const { connect, isConnected } = useWebSocket();

    const handleJoin = async () => {
        if (!name || !sessionId) return;

        setIsJoining(true);

        try {
            await connect();
            await quizSocket.joinRoom(sessionId, name);

            const size = 320;
            const positions = generatePositions(players.length + 1, size);

            setPlayers([
                ...players.map((p, i) => ({
                    ...p,
                    x: positions[i]?.x || 0,
                    y: positions[i]?.y || 0,
                })),
                {
                    id: name,
                    name,
                    profile,
                    x: size / 2 - 40,
                    y: size / 2 - 40,
                    isMe: true,
                },
            ]);

            setJoined(true);
        } catch (err) {
            console.error("Join error", err);
        } finally {
            setIsJoining(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-900 text-white">
            <div className="flex flex-col items-center gap-6 w-80">

                {!joined ? (
                    <>
                        <h1 className="text-2xl font-bold">Rejoindre la partie</h1>

                        {!sessionIdFromUrl && (
                            <input
                                value={sessionId}
                                onChange={(e) => setSessionId(e.target.value)}
                                placeholder="ID session"
                                className="w-full p-3 rounded-lg"
                            />
                        )}

                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Pseudo"
                            className="w-full p-3 rounded-lg "
                        />

                        <select
                            value={profile}
                            onChange={(e) => setProfile(e.target.value as Profile)}
                            className="w-full p-3 rounded-lg "
                        >
                            <option value="house" className="text-black">Maison</option>
                            <option value="flat">Appartement</option>
                            <option value="company">Entreprise</option>
                        </select>

                        <button
                            onClick={handleJoin}
                            disabled={!name || !sessionId || isJoining}
                            className="w-full bg-blue-500 p-3 rounded-lg"
                        >
                            {isJoining ? "Connexion..." : "Rejoindre"}
                        </button>
                    </>
                ) : (
                    <>
                        <h1 className="text-2xl font-bold">En attente...</h1>

                        <div className="relative w-80 h-80 bg-zinc-800 rounded-lg overflow-hidden">
                            {players.map((p) => (
                                <House
                                    key={p.id}
                                    src={houseByProfile[p.profile]}
                                    x={p.x}
                                    y={p.y}
                                    isMe={p.isMe}
                                />
                            ))}
                        </div>
                    </>
                )}

            </div>

            {/* status */}
            <div className="fixed bottom-4 right-4">
                <div className={`w-4 h-4 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
            </div>
        </div>
    );
}