"use client";

import {Suspense, useEffect, useState} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import {useWebSocket} from "@/app/providers/WebSocketProvider";
import {useQuiz} from "@/hooks/useQuiz";
import {BACKEND_URL} from "@/utils/constants";
import Image from "next/image";

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

function House({
                   src,
                   x,
                   y,
                   isMe,
               }: {
    src: string;
    x: number;
    y: number;
    isMe: boolean;
}) {
    return (
        <Image
            alt="Maison"
            width={128}
            height={128}
            src={src}
            className={`absolute image-pixel ${isMe ? "z-20" : ""}`}
            style={{
                left: x,
                top: y,
                transform: "translate(-50%, -50%)",
            }}
        />
    );
}

export default function JoinPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <JoinContent/>
        </Suspense>
    );
}

function JoinContent() {
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

    const {connect, isConnected} = useWebSocket();
    const {joinRoom, gameStarted, playersCount} = useQuiz(roomId);

    useEffect(() => {
        if (gameStarted) router.push(`/play/${roomId}`);
    }, [gameStarted, roomId, router]);

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
            const positions = generatePositions(players.length + 1, SIZE);
            setPlayers(prev => [
                ...prev.map((p, i) => ({...p, x: positions[i].x, y: positions[i].y})),
                {name, profile, x: SIZE / 2 - 30, y: SIZE / 2 - 30, isMe: true},
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

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold uppercase tracking-wider"
                                   style={{color: "rgba(232,245,232,0.4)"}}>Profil</label>
                            <select value={profileId} onChange={e => setProfileId(e.target.value)}
                                    className="cool-input" style={{appearance: "none"}}>
                                <option value="">Choisir un profil...</option>
                                {allProfiles.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                            </select>
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

                        <div className="relative w-80 h-80 rounded-2xl overflow-hidden" style={{
                            background: "linear-gradient(to bottom, #87CEEB 0%, #87CEEB 60%, #4a7c4e 60%)",
                            border: "1px solid var(--border-strong)"
                        }}>
                            {players.map((p, i) => (
                                <House key={i} src={`/houses/${p.profile.image}.gif`} x={p.x} y={p.y} isMe={p.isMe}/>
                            ))}
                            {players.length === 0 && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <p className="text-sm" style={{color: "rgba(0,0,0,0.4)"}}>Tu seras affiché
                                        ici...</p>
                                </div>
                            )}
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