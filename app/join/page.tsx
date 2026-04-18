"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useWebSocket } from "@/app/providers/WebSocketProvider";
import { useQuiz } from "@/app/hooks/useQuiz";
import { BACKEND_URL } from "@/utils/constants";

const random = (min: number, max: number) =>
    Math.random() * (max - min) + min;

type Profile = {
    id: string;
    label: string;
    image: string;
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
            alt="Maison"
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
    const roomIdFromUrl = searchParams.get("game");

    const [roomId, setRoomId] = useState(roomIdFromUrl || "");
    const [name, setName] = useState("");
    const [profileId, setProfileId] = useState<string>("");

    const [joined, setJoined] = useState(false);
    const [isJoining, setIsJoining] = useState(false);

    const [players, setPlayers] = useState<Player[]>([]);
    const [allProfiles, setAllProfiles] = useState<Profile[]>([]);

    const { connect, isConnected } = useWebSocket();
    const { joinRoom } = useQuiz(roomId);

    // ─────────────────────────────
    // FETCH PROFILES
    // ─────────────────────────────

    useEffect(() => {
        const fetchProfiles = async () => {
            try {
                console.log("Fetching profiles with backend: " + `${BACKEND_URL}/api/profiles`);
                const res = await fetch(`${BACKEND_URL}/api/profiles`);
                if (!res.ok) throw new Error("API error");

                const json = await res.json();
                setAllProfiles(json);
            } catch (err) {
                console.error(err);
            }
        };

        fetchProfiles();
    }, []);

    // ─────────────────────────────
    // JOIN
    // ─────────────────────────────

    const handleJoin = async () => {
        if (!name || !roomId || !profileId) return;

        setIsJoining(true);

        try {
            await connect();

            const profile = allProfiles.find((p) => p.id === profileId);
            if (!profile) throw new Error("Profile not found");

            await joinRoom(name, profile.id);

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

    // ─────────────────────────────
    // UI
    // ─────────────────────────────

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
                                className="w-full p-3 rounded-lg"
                            />
                        )}

                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Pseudo"
                            className="w-full p-3 rounded-lg"
                        />

                        <select
                            value={profileId}
                            onChange={(e) => setProfileId(e.target.value)}
                            className="w-full p-3 rounded-lg"
                        >
                            <option value="">Choisir un profil</option>
                            {allProfiles.map((p) => (
                                <option key={p.id} value={p.id} className="text-black">
                                    {p.label}
                                </option>
                            ))}
                        </select>

                        <button
                            onClick={handleJoin}
                            disabled={!name || !roomId || !profileId || isJoining}
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
                                    src={`/houses/${p.profile.image}`}
                                    x={p.x}
                                    y={p.y}
                                    isMe={p.isMe}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>

            <div className="fixed bottom-4 right-4">
                <div
                    className={`w-4 h-4 rounded-full ${
                        isConnected ? "bg-green-500" : "bg-red-500"
                    }`}
                />
            </div>
        </div>
    );
}