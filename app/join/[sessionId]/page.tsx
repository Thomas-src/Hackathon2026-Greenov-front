"use client";

import {Suspense, useEffect, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {useWebSocket} from "@/app/providers/WebSocketProvider";
import {BACKEND_URL} from "@/utils/constants";
import Image from "next/image";
import {useQuizContext} from "@/app/providers/QuizProvider";

type Profile = { id: string; label: string; image: string };
type Player = { name: string; profile: Profile; x: number; y: number; isMe: boolean };

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
        } while (attempts < 50 && positions.some(p => Math.abs(p.x - x) < minDist && Math.abs(p.y - y) < minDist));
        positions.push({x, y});
    }
    return positions;
}

function House({src}: { src: string }) {
    return (
        <div className="flex items-center justify-center w-32 h-32">
            <Image
                alt="Maison"
                width={128}
                height={128}
                src={src}
                className="image-pixel"
            />
        </div>
    );
}

function ProfileWheel({
                          profiles,
                          selectedId,
                          onSelect,
                      }: {
    profiles: Profile[];
    selectedId: string;
    onSelect: (id: string) => void;
}) {
    const radius = 95;

    return (
        <div className="relative mx-auto h-72 w-72">
            <div className="absolute inset-0 flex items-center justify-center -translate-y-5">
                <div
                    className="rounded-full px-4 py-2 text-sm font-semibold"
                    style={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        color: "var(--green)",
                    }}
                >
                    Choisis ton profil
                </div>
            </div>

            {profiles.slice(0, 3).map((profile, index) => {
                const angle = -Math.PI / 2 + (index * 2 * Math.PI) / 3;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                const isSelected = selectedId === profile.id;

                return (
                    <button
                        key={profile.id}
                        type="button"
                        onClick={() => onSelect(profile.id)}
                        className="absolute flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-full text-center transition hover:scale-105 active:scale-95"
                        style={{
                            left: `calc(50% + ${x}px)`,
                            top: `calc(50% + ${y}px)`,
                            transform: "translate(-50%, -50%)",
                            background: isSelected ? "var(--green)" : "var(--card)",
                            color: isSelected ? "#0d1117" : "var(--foreground)",
                            border: isSelected
                                ? "2px solid var(--green)"
                                : "1px solid var(--border)",
                            boxShadow: isSelected
                                ? "0 0 0 4px rgba(74, 222, 128, 0.15)"
                                : "none",
                        }}
                    >
                        <img
                            src={`/houses/${profile.image}.gif`}
                            alt={profile.label}
                            className="image-pixel mb-1 w-8"
                        />
                        <span className="text-xs font-semibold leading-tight">
                            {profile.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

export default function JoinPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <JoinGate/>
        </Suspense>
    );
}

function JoinGate() {
    const {sessionId} = useParams<{ sessionId?: string; }>();
    const [ready, setReady] = useState(false);

    useEffect(() => {
        setReady(true);
    }, []);

    if (!ready) return <div>Loading...</div>;
    return <JoinContent roomIdFromUrl={sessionId ?? null}/>;
}

export function JoinContent({roomIdFromUrl}: { roomIdFromUrl: string | null }) {
    const router = useRouter();

    const [roomId, setRoomId] = useState(roomIdFromUrl ?? "");
    const [name, setName] = useState("");
    const [profileId, setProfileId] = useState("");
    const [joinError, setJoinError] = useState<string | null>(null);
    const [joined, setJoined] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);

    const {connect, isConnected} = useWebSocket();
    const {joinRoom, gameStarted, playersCount} = useQuizContext();

    useEffect(() => {
        if (gameStarted) router.push(`/play/${roomId}?name=${name}&profile=${profileId.toLowerCase()}`);
    }, [gameStarted, name, profileId, roomId, router]);

    useEffect(() => {
        fetch(`${BACKEND_URL}/api/profiles`).then(r => r.json()).then(setAllProfiles).catch(console.error);
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
            const SIZE = 320;
            // Fix: use players.length + 1 positions and assign the last one to the new player
            const positions = generatePositions(players.length + 1, SIZE);
            setPlayers(prev => [
                ...prev.map((p, i) => ({...p, x: positions[i].x, y: positions[i].y})),
                {name, profile, x: positions[prev.length].x, y: positions[prev.length].y, isMe: true},
            ]);
            setJoined(true);
        } catch (err: any) {
            setJoinError(err.message ?? "Erreur de connexion");
        } finally {
            setIsJoining(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4" style={{background: "var(--background)"}}>
            <div className="flex flex-col items-center gap-6 w-full max-w-sm">

                <div className="text-center">
                    <h1 className="text-4xl font-black" style={{color: "var(--green)"}}>Jeux'Rénov</h1>
                    <p className="text-sm mt-1" style={{color: "rgba(232,245,232,0.5)"}}>Le quiz sur la transition
                        écologique</p>
                </div>

                {!joined ? (
                    <div className="w-full flex flex-col gap-4 rounded-2xl p-6"
                         style={{background: "var(--card)", border: "1px solid var(--border)"}}>
                        <h2 className="text-xl font-bold text-center">Rejoindre une partie</h2>

                        {!roomIdFromUrl && (
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-semibold uppercase tracking-wider"
                                       style={{color: "rgba(232,245,232,0.4)"}}>Code de session</label>
                                <input value={roomId} onChange={e => setRoomId(e.target.value)} placeholder="Ex: ABC123"
                                       className="cool-input"/>
                            </div>
                        )}

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold uppercase tracking-wider"
                                   style={{color: "rgba(232,245,232,0.4)"}}>Pseudo</label>
                            <input value={name} onChange={e => setName(e.target.value)} placeholder="Ton nom de joueur"
                                   className="cool-input"/>
                        </div>

                        <div className="flex flex-col gap-3">

                            {allProfiles.length >= 3 ? (
                                <ProfileWheel
                                    profiles={allProfiles}
                                    selectedId={profileId}
                                    onSelect={setProfileId}
                                />
                            ) : (
                                <p className="text-sm text-center" style={{color: "rgba(232,245,232,0.5)"}}>
                                    Chargement des profils...
                                </p>
                            )}
                        </div>

                        <button onClick={handleJoin} disabled={!name || !roomId || !profileId || isJoining}
                                className="cool-btn mt-2">
                            {isJoining ? "Connexion..." : "Rejoindre →"}
                        </button>

                        {joinError && (
                            <p className="text-sm text-center rounded-lg p-2" style={{
                                background: "var(--red-bg)",
                                color: "var(--red)",
                                border: "1px solid var(--red-border)"
                            }}>
                                {joinError}
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="w-full flex flex-col items-center gap-4">
                        <div className="text-center">
                            <p className="text-lg font-bold">En attente du début...</p>
                            <p className="text-sm mt-1" style={{color: "rgba(232,245,232,0.5)"}}>
                                {playersCount == 0 ? 1 : playersCount} joueur{playersCount > 1 ? "s" : ""} dans la salle
                            </p>
                        </div>

                        <div
                            className="w-80 h-80 rounded-2xl overflow-hidden flex items-center justify-center gap-2 flex-wrap"
                            style={{
                                background: "linear-gradient(to bottom, #87CEEB 0%, #87CEEB 60%, #4a7c4e 60%)",
                                border: "1px solid var(--border-strong)"
                            }}
                        >
                            {players.map((p, i) => (
                                <House key={i} src={`/square/square${p.profile.image}.gif`}/>
                            ))}
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full animate-pulse" style={{background: "var(--green)"}}/>
                            <span className="text-sm"
                                  style={{color: "rgba(232,245,232,0.5)"}}>En attente de l'hôte</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="fixed bottom-4 right-4 flex items-center gap-2">
                <span className="text-xs"
                      style={{color: "rgba(232,245,232,0.3)"}}>{isConnected ? "Connecté" : "Déconnecté"}</span>
                <div className={`w-2 h-2 rounded-full ${isConnected ? "animate-pulse" : ""}`}
                     style={{background: isConnected ? "var(--green)" : "var(--red)"}}/>
            </div>
        </div>
    );
}