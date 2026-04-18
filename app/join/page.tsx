"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useWebSocket } from "@/app/providers/WebSocketProvider";
import { useQuiz } from "@/hooks/useQuiz";
import { BACKEND_URL } from "@/utils/constants";

type Profile = {
    id: string;
    label: string;
    image: string;
};

type Player = {
    name: string;
    profile: Profile;
    x: number;
    y: number;
    isMe: boolean;
};

const random = (min: number, max: number) => Math.random() * (max - min) + min;

function generatePositions(count: number, size: number) {
    const positions: { x: number; y: number }[] = [];
    const minDist = 60;

    for (let i = 0; i < count; i++) {
        let x = 0, y = 0, attempts = 0;
        do {
            x = random(0, size - 60);
            y = random(0, size - 60);
            attempts++;
        } while (
            attempts < 50 &&
            positions.some(p => Math.abs(p.x - x) < minDist && Math.abs(p.y - y) < minDist)
            );
        positions.push({ x, y });
    }

    return positions;
}

function House({ src, x, y, isMe, scale }: {
    src: string;
    x: number;
    y: number;
    isMe: boolean;
    scale: number;
}) {
    return (
        <img
            alt="Maison"
            src={src}
            className={`absolute image-pixel ${isMe ? "w-20 z-20" : "w-16"}`}
            style={{ left: x, top: y, transform: `scale(${scale})` }}
        />
    );
}

export default function JoinPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const roomIdFromUrl = searchParams.get("game");

    const [roomId, setRoomId] = useState(roomIdFromUrl ?? "");
    const [name, setName] = useState("");
    const [profileId, setProfileId] = useState("");
    const [joinError, setJoinError] = useState<string | null>(null);
    const [joined, setJoined] = useState(false);
    const [isJoining, setIsJoining] = useState(false);

    const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);

    const { connect, isConnected } = useWebSocket();
    const { joinRoom, gameStarted } = useQuiz(roomId);

    // Redirection quand la partie démarre
    useEffect(() => {
        if (gameStarted) router.push(`/play/${roomId}`);
    }, [gameStarted, roomId, router]);

    // Fetch profils
    useEffect(() => {
        fetch(`${BACKEND_URL}/api/profiles`)
            .then(r => r.json())
            .then(setAllProfiles)
            .catch(console.error);
    }, []);

    const handleJoin = async () => {
        if (!name || !roomId || !profileId) return;
        setIsJoining(true);
        setJoinError(null);

        try {
            await connect();

            const profile = allProfiles.find(p => p.id === profileId);
            if (!profile) throw new Error("Profil introuvable");

            await joinRoom(name, profile.id);

            // Place le nouveau joueur au centre + les autres autour
            const SIZE = 320;
            const existing = players.length;
            const positions = generatePositions(existing + 1, SIZE);

            setPlayers(prev => [
                ...prev.map((p, i) => ({ ...p, x: positions[i].x, y: positions[i].y })),
                {
                    name,
                    profile,
                    x: SIZE / 2 - 30,
                    y: SIZE / 2 - 30,
                    isMe: true,
                },
            ]);

            setJoined(true);
        } catch (err: any) {
            setJoinError(err.message ?? "Erreur de connexion");
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

                        {!roomIdFromUrl && (
                            <input
                                value={roomId}
                                onChange={(e) => setRoomId(e.target.value)}
                                placeholder="ID session"
                                className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700"
                            />
                        )}

                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Pseudo"
                            className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700"
                        />

                        <select
                            value={profileId}
                            onChange={e => setProfileId(e.target.value)}
                            className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700"
                        >
                            <option value="">Choisir un profil</option>
                            {allProfiles.map(p => (
                                <option key={p.id} value={p.id}>{p.label}</option>
                            ))}
                        </select>

                        <button
                            onClick={handleJoin}
                            disabled={!name || !roomId || !profileId || isJoining}
                            className="w-full bg-blue-500 hover:bg-blue-600 p-3 rounded-lg disabled:opacity-50"
                        >
                            {isJoining ? "Connexion..." : "Rejoindre"}
                        </button>

                        {joinError && (
                            <p className="bg-red-500 text-white p-2 rounded text-sm">{joinError}</p>
                        )}
                    </>
                ) : (
                    <>
                        <h1 className="text-2xl font-bold">En attente...</h1>

                        <div className="relative w-80 h-80 bg-zinc-800 rounded-lg overflow-hidden">
                            {players.map((p, i) => (
                                <House
                                    key={i}
                                    src={`/houses/${p.profile.image}.gif`}
                                    x={p.x}
                                    y={p.y}
                                    isMe={p.isMe}
                                    scale={p.isMe ? 1.3 : random(0.85, 1.1)}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>

            <div className="fixed bottom-4 right-4">
                <div className={`w-4 h-4 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
            </div>
        </div>
    );
}