"use client";

import {useEffect, useRef, useState} from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { PlayerSummary } from "@/back/types/socket.t";
import {useQuizContext} from "@/app/providers/QuizProvider";

const houseByProfile: Record<string, string> = {
    proprietaire: "/houses/house.gif",
    locataire: "/houses/flat.gif",
    entreprise: "/houses/company.gif",
};

const GROUND_RATIO = 0.35;

function generateResponsivePositions(count: number, width: number, height: number) {
    const positions: { x: number; y: number }[] = [];
    const padding = 15;
    const groundStart = height * GROUND_RATIO;
    const usableWidth = width - padding * 2;
    const usableHeight = height - groundStart - padding;
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);
    const cellW = usableWidth / cols;
    const cellH = usableHeight / rows;

    for (let i = 0; i < count; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        positions.push({
            x: padding + col * cellW + cellW / 2,
            y: groundStart + padding + row * cellH + cellH / 2,
        });
    }

    return { positions, cellW, cellH };
}

function StatCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-col gap-1 rounded-xl p-4"
             style={{ background: "rgba(76,194,74,0.07)", border: "1px solid var(--border)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider"
               style={{ color: "rgba(232,245,232,0.4)" }}>{label}</p>
            <p className="text-2xl font-black" style={{ color: "var(--green)" }}>{value}</p>
        </div>
    );
}

function House({ player, x, y, size }: { player: PlayerSummary; x: number; y: number; size: number }) {
    return (
        <div className="absolute flex flex-col items-center transition-all duration-300"
             style={{ left: x, top: y, transform: "translate(-50%, -80%)" }}>
            <Image
                src={houseByProfile[player.profile.toLowerCase()]}
                alt={player.username}
                width={size}
                height={size * 0.6}
                className="image-pixel"
            />
            <p className="mt-1 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap"
               style={{ background: "rgba(0,0,0,0.6)", color: "white", border: "1px solid rgba(255,255,255,0.15)" }}>
                {player.username.substring(0, 10)}
            </p>
        </div>
    );
}

export default function HostGamePage() {
    const params = useParams<{ sessionId: string }>();
    const router = useRouter();
    const containerRef = useRef<HTMLDivElement>(null);

    const { playersCount, players, timer, globalCarbon, forceEnd, globalDebrief } = useQuizContext();

    // Redirection automatique quand le GlobalDebrief arrive
    useEffect(() => {
        if (globalDebrief) {
            router.push(`/results/${params.sessionId}`);
        }
    }, [globalDebrief]);

    const [layout, setLayout] = useState<{ positions: { x: number; y: number }[]; size: number }>({
        positions: [],
        size: 50,
    });

    useEffect(() => {
        function updateLayout() {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const { positions, cellW, cellH } = generateResponsivePositions(players.length, rect.width, rect.height);
            setLayout({ positions, size: Math.min(cellW, cellH) * 0.6 });
        }

        updateLayout();
        const ro = new ResizeObserver(updateLayout);
        if (containerRef.current) ro.observe(containerRef.current);
        window.addEventListener("resize", updateLayout);
        return () => { ro.disconnect(); window.removeEventListener("resize", updateLayout); };
    }, [players.length]);

    const timeLeft = timer?.remaining ?? 0;

    function formatTime(seconds: number) {
        const min = Math.floor(seconds / 60);
        const sec = seconds % 60;
        return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    }

    const sortedPlayers = [...players].sort((a, b) => a.username.localeCompare(b.username));

    const averageScore = players.length > 0
        ? Math.round(players.reduce((sum, p) => sum + p.score, 0) / players.length)
        : 0;

    const progress = Math.max(0, Math.min(100, 100 - globalCarbon));

    return (
        <main className="min-h-screen p-6 text-white" style={{ background: "var(--background)" }}>
            <div className="mx-auto flex max-w-7xl gap-6">

                {/* SIDEBAR */}
                <aside className="w-72 space-y-4">
                    <div className="rounded-2xl p-5 text-center"
                         style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                        <p className="text-xs font-semibold uppercase tracking-wider"
                           style={{ color: "rgba(232,245,232,0.4)" }}>Temps restant</p>
                        <p className="mt-2 text-5xl font-black tabular-nums"
                           style={{ color: timeLeft < 30 ? "var(--red)" : "var(--accent)" }}>
                            {formatTime(timeLeft)}
                        </p>
                    </div>

                    <div className="rounded-2xl p-5 space-y-3"
                         style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                        <h2 className="text-xs font-semibold uppercase tracking-wider"
                            style={{ color: "rgba(232,245,232,0.4)" }}>Tableau de bord</h2>
                        <StatCard label="Joueurs" value={String(playersCount)} />
                        <StatCard label="Score moyen" value={`${averageScore}/100`} />
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider mb-2"
                               style={{ color: "rgba(232,245,232,0.4)" }}>Progression zéro émission</p>
                            <div className="h-3 rounded-full" style={{ background: "rgba(76,194,74,0.15)" }}>
                                <div className="h-3 rounded-full transition-all duration-500"
                                     style={{ width: `${progress}%`, background: "var(--green)" }}/>
                            </div>
                            <p className="text-right text-sm font-bold mt-1" style={{ color: "var(--green)" }}>
                                {progress}%
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => forceEnd()}
                        className="w-full rounded-xl p-3 font-bold transition hover:opacity-90"
                        style={{ background: "var(--red-bg)", color: "var(--red)", border: "1px solid var(--red-border)", cursor: "pointer" }}
                    >
                        Forcer la fin
                    </button>
                </aside>

                {/* VILLAGE */}
                <section className="flex-1">
                    <div className="rounded-2xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                        <div ref={containerRef} className="relative w-full rounded-xl overflow-hidden"
                             style={{
                                 height: "calc(100vh - 120px)",
                                 background: `linear-gradient(to bottom, #87CEEB 0%, #87CEEB ${GROUND_RATIO * 100}%, #4a7c4e ${GROUND_RATIO * 100}%)`,
                             }}>
                            <div className="absolute left-0 w-full h-[2px]"
                                 style={{ top: `${GROUND_RATIO * 100}%`, background: "rgba(0,0,0,0.2)" }}/>

                            {sortedPlayers.map((player, i) => {
                                const pos = layout.positions[i];
                                if (!pos) return null;
                                return (
                                    <House key={player.username} player={player} x={pos.x} y={pos.y} size={layout.size}/>
                                );
                            })}

                            {players.length === 0 && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <p className="text-sm" style={{ color: "rgba(0,0,0,0.4)" }}>
                                        En attente des joueurs...
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}