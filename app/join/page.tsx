"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

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

function House({
                   src,
                   x,
                   y,
                   isMe,
               }: {
    src: string;
    x: number;
    y: number;
    isMe?: boolean;
}) {
    const [config] = useState(() => ({
        scale: isMe ? 1.3 : random(0.85, 1.1),
    }));

    return (
        <img
            src={src}
            className={`absolute image-pixel ${
                isMe ? "w-20 z-20 drop-shadow-lg" : "w-16"
            }`}
            style={{
                left: x,
                top: y,
                transform: `scale(${config.scale})`,
                filter: isMe ? "drop-shadow(0 0 10px #4ade80)" : "none",
            }}
        />
    );
}

/**
 * Génère les positions des maisons sans les faire apparaître les unes dans les autres
 * @param count Le nombre de maisons
 * @param size La taille
 */
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
    const sessionIdFromUrl = searchParams.get("sessionId");

    const [sessionId, setSessionId] = useState(sessionIdFromUrl || "");
    const [name, setName] = useState("");
    const [profile, setProfile] = useState<Profile>("house");
    const [joined, setJoined] = useState(false);

    const [players, setPlayers] = useState<Player[]>([]);

    const handleJoin = () => {
        if (!name || !sessionId) return;

        const size = 320;

        const positions = generatePositions(players.length + 1, size);

        const newPlayers: Player[] = [
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
        ];

        setPlayers(newPlayers);
        setJoined(true);

        console.log("Join session:", {
            sessionId,
            name,
            profile,
        });
    };

    const me = players.find((p) => p.isMe);

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
                                placeholder="ID de la session"
                                className="w-full p-3 rounded-lg text-black"
                            />
                        )}

                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ton pseudo"
                            className="w-full p-3 rounded-lg text-black"
                        />

                        <select
                            value={profile}
                            onChange={(e) => setProfile(e.target.value as Profile)}
                            className="w-full p-3 rounded-lg text-black"
                        >
                            <option value="house">Maison</option>
                            <option value="flat">Appartement</option>
                            <option value="company">Entreprise</option>
                        </select>

                        <button
                            onClick={handleJoin}
                            disabled={!name || !sessionId}
                            className="w-full bg-blue-500 hover:bg-blue-600 p-3 rounded-lg"
                        >
                            Rejoindre
                        </button>
                    </>
                ) : (
                    <>
                        <h1 className="text-2xl font-bold">En attente...</h1>

                        <p className="text-zinc-400">
                            {name}, tu es dans le village
                        </p>

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

                        <p className="text-sm text-zinc-500">
                            Le host va bientôt démarrer la session
                        </p>
                    </>
                )}

            </div>
        </div>
    );
}