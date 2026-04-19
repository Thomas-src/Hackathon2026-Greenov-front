"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { PlayerSummary, VillageUpdate } from "@/back/types/socket.t";
import { useQuizContext } from "@/app/providers/QuizProvider";

// ─── Config ───────────────────────────────────────────────

const houseByProfile: Record<string, string> = {
    proprietaire: "/houses/house.gif",
    locataire:    "/houses/flat.gif",
    entreprise:   "/houses/company.gif",
};

const GROUND_RATIO = 0.35;

// ─── Styles globaux ───────────────────────────────────────

function GlobalStyles() {
    return (
        <style>{`
      @keyframes flashGreen {
        0%   { opacity: 0; }
        20%  { opacity: 1; }
        100% { opacity: 0; }
      }
      @keyframes flashRed {
        0%   { opacity: 0; }
        15%  { opacity: 1; }
        35%  { opacity: 0.5; }
        50%  { opacity: 1; }
        100% { opacity: 0; }
      }
      @keyframes floatUp {
        0%   { opacity: 0;   transform: translateX(-50%) translateY(0)    scale(0.6); }
        15%  { opacity: 1;   transform: translateX(-50%) translateY(-14px) scale(1.3); }
        65%  { opacity: 1;   transform: translateX(-50%) translateY(-55px) scale(1); }
        100% { opacity: 0;   transform: translateX(-50%) translateY(-90px) scale(0.85); }
      }
      @keyframes shake {
        0%   { transform: translate(-50%, -80%); }
        15%  { transform: translate(calc(-50% - 7px), -80%) rotate(-1deg); }
        30%  { transform: translate(calc(-50% + 7px), -80%) rotate(1deg); }
        50%  { transform: translate(calc(-50% - 4px), -80%) rotate(-0.5deg); }
        70%  { transform: translate(calc(-50% + 4px), -80%) rotate(0.5deg); }
        100% { transform: translate(-50%, -80%); }
      }
      @keyframes popIn {
        0%   { transform: scale(0.7); opacity: 0; }
        60%  { transform: scale(1.12); }
        100% { transform: scale(1);   opacity: 1; }
      }
      .house-shake  { animation: shake 0.55s ease-out; }
      .house-normal { transform: translate(-50%, -80%); }
    `}</style>
    );
}

// ─── Flash plein écran ────────────────────────────────────

function FeedbackFlash({ update }: { update: VillageUpdate | null }) {
    const [visible, setVisible] = useState(false);
    const [good, setGood]       = useState(false);
    const prevKey = useRef<string | null>(null);

    useEffect(() => {
        if (!update) return;
        const key = `${update.username}-${update.playerScore}`;
        if (key === prevKey.current) return;
        prevKey.current = key;
        setGood(update.isGoodMove);
        setVisible(true);
        const t = setTimeout(() => setVisible(false), 650);
        return () => clearTimeout(t);
    }, [update]);

    if (!visible) return null;
    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 100, pointerEvents: "none",
            background: good ? "rgba(74,222,128,0.12)" : "rgba(248,113,113,0.15)",
            animation: good ? "flashGreen 0.65s ease-out" : "flashRed 0.65s ease-out",
        }}/>
    );
}

// ─── Helpers layout ───────────────────────────────────────

function generatePositions(count: number, width: number, height: number) {
    const positions: { x: number; y: number }[] = [];
    const padding     = 15;
    const groundStart = height * GROUND_RATIO;
    const usableW     = width  - padding * 2;
    const usableH     = height - groundStart - padding;
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);
    const cellW = usableW / cols;
    const cellH = usableH / rows;

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

function scoreToColor(score: number): string {
    if (score >= 80) return "#4ade80";
    if (score >= 60) return "#a3e635";
    if (score >= 40) return "#facc15";
    if (score >= 20) return "#fb923c";
    return "#f87171";
}

// ─── Score popper au-dessus de la maison ─────────────────

type PopItem = { id: number; delta: number; good: boolean; x: number; y: number };

// ─── House ───────────────────────────────────────────────

function House({
                   player, x, y, size, lastUpdate,
               }: {
    player: PlayerSummary;
    x: number; y: number; size: number;
    lastUpdate: VillageUpdate | null;
}) {
    const isTarget   = lastUpdate?.username === player.username;
    const [shaking, setShaking] = useState(false);
    const [glowColor, setGlowColor] = useState<string | null>(null);
    const prevKey = useRef<string | null>(null);

    useEffect(() => {
        if (!isTarget || !lastUpdate) return;
        const key = `${lastUpdate.username}-${lastUpdate.playerScore}`;
        if (key === prevKey.current) return;
        prevKey.current = key;

        setGlowColor(lastUpdate.isGoodMove ? "#4ade80" : "#f87171");

        if (!lastUpdate.isGoodMove) {
            setShaking(true);
            const t = setTimeout(() => setShaking(false), 600);
            return () => clearTimeout(t);
        } else {
            const t = setTimeout(() => setGlowColor(null), 800);
            return () => clearTimeout(t);
        }
    }, [lastUpdate]);

    const score = isTarget ? lastUpdate!.playerScore : player.score;
    const color = scoreToColor(score);

    return (
        <div
            className={`absolute flex flex-col items-center ${shaking ? "house-shake" : "house-normal"}`}
            style={{ left: x, top: y }}
        >
            {/* Glow */}
            {glowColor && (
                <div style={{
                    position: "absolute", inset: "-12px", borderRadius: "50%",
                    background: glowColor, opacity: 0.25,
                    filter: "blur(16px)", pointerEvents: "none",
                    animation: "popIn 0.3s ease-out",
                }}/>
            )}

            <Image
                src={houseByProfile[player.profile.toLowerCase()] ?? "/houses/house.gif"}
                alt={player.username}
                width={size}
                height={size * 0.6}
                className="image-pixel relative z-10"
                style={{
                    filter: glowColor
                        ? `drop-shadow(0 0 10px ${glowColor})`
                        : "none",
                    transition: "filter 0.4s ease",
                }}
            />

            {/* Badge score */}
            <p className="mt-1 rounded-full px-2 py-0.5 text-[10px] font-bold whitespace-nowrap relative z-10"
               style={{
                   background: "rgba(0,0,0,0.7)",
                   color,
                   border: `1px solid ${color}40`,
                   transition: "color 0.3s ease",
                   animation: isTarget && lastUpdate ? "popIn 0.3s ease-out" : "none",
               }}>
                {player.username.substring(0, 8)} · {score}
            </p>
        </div>
    );
}

// ─── StatCard ─────────────────────────────────────────────

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

// ─── Page ─────────────────────────────────────────────────

export default function HostGamePage() {
    const params = useParams<{ sessionId: string }>();
    const router = useRouter();
    const containerRef = useRef<HTMLDivElement>(null);

    const { playersCount, players, timer, globalCarbon, forceEnd, globalDebrief, village } = useQuizContext();

    // Score poppers flottants
    const [pops, setPops]     = useState<PopItem[]>([]);
    const popCounter          = useRef(0);
    const prevVillage         = useRef<VillageUpdate | null>(null);

    // Scores locaux par username (mis à jour via VillageUpdate)
    const [localScores, setLocalScores] = useState<Record<string, number>>({});

    useEffect(() => {
        if (!village) return;
        const prev = prevVillage.current;
        const key  = `${village.username}-${village.playerScore}`;
        if (prev && `${prev.username}-${prev.playerScore}` === key) return;
        prevVillage.current = village;

        // Met à jour le score local
        setLocalScores(s => ({ ...s, [village.username]: village.playerScore }));

        // Cherche la position de la maison pour le popper
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const sortedUsernames = [...players].sort((a, b) => a.username.localeCompare(b.username)).map(p => p.username);
        const idx = sortedUsernames.indexOf(village.username);
        if (idx === -1) return;

        const { positions } = generatePositions(players.length, rect.width, rect.height);
        const pos = positions[idx];
        if (!pos) return;

        const id = popCounter.current++;
        const delta = prev ? village.playerScore - (prev.playerScore ?? 0) : village.playerScore;

        setPops(p => [...p, { id, delta, good: village.isGoodMove, x: pos.x, y: pos.y }]);
        setTimeout(() => setPops(p => p.filter(i => i.id !== id)), 1400);
    }, [village, players]);

    // Redirection sur GlobalDebrief
    useEffect(() => {
        if (globalDebrief) router.push(`/results/${params.sessionId}`);
    }, [globalDebrief]);

    // Layout responsive
    const [layout, setLayout] = useState<{ positions: { x: number; y: number }[]; size: number }>({ positions: [], size: 50 });

    useEffect(() => {
        function update() {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const { positions, cellW, cellH } = generatePositions(players.length, rect.width, rect.height);
            setLayout({ positions, size: Math.min(cellW, cellH) * 0.6 });
        }
        update();
        const ro = new ResizeObserver(update);
        if (containerRef.current) ro.observe(containerRef.current);
        window.addEventListener("resize", update);
        return () => { ro.disconnect(); window.removeEventListener("resize", update); };
    }, [players.length]);

    const timeLeft = timer?.remaining ?? 0;
    const formatTime = (s: number) =>
        `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

    const sortedPlayers = [...players].sort((a, b) => a.username.localeCompare(b.username));
    const enrichedPlayers = sortedPlayers.map(p => ({
        ...p,
        score: localScores[p.username] ?? p.score,
    }));

    const averageScore = enrichedPlayers.length > 0
        ? Math.round(enrichedPlayers.reduce((s, p) => s + p.score, 0) / enrichedPlayers.length)
        : 0;

    const progress = Math.max(0, Math.min(100, 100 - globalCarbon));

    return (
        <main className="min-h-screen p-6 text-white" style={{ background: "var(--background)" }}>
            <GlobalStyles/>
            <FeedbackFlash update={village}/>

            {/* Score poppers */}
            {pops.map(pop => (
                <div key={pop.id} style={{
                    position: "fixed",
                    left: pop.x,
                    top:  pop.y - 60,
                    zIndex: 200,
                    pointerEvents: "none",
                    fontSize: "1.6rem",
                    fontWeight: 900,
                    color: pop.good ? "#4ade80" : "#f87171",
                    textShadow: pop.good
                        ? "0 0 20px rgba(74,222,128,0.6)"
                        : "0 0 20px rgba(248,113,113,0.6)",
                    animation: "floatUp 1.4s ease-out forwards",
                }}>
                    {pop.delta > 0 ? `+${pop.delta}` : pop.delta === 0 ? "±0" : pop.delta}
                </div>
            ))}

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
                        <StatCard label="Joueurs" value={String(playersCount)}/>
                        <StatCard label="Score moyen" value={`${averageScore} pts`}/>
                        <StatCard label="CO₂ global" value={`${Math.round(globalCarbon)} kg`}/>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider mb-2"
                               style={{ color: "rgba(232,245,232,0.4)" }}>Zéro émission</p>
                            <div className="h-3 rounded-full" style={{ background: "rgba(76,194,74,0.15)" }}>
                                <div className="h-3 rounded-full transition-all duration-500"
                                     style={{ width: `${progress}%`, background: "var(--green)" }}/>
                            </div>
                            <p className="text-right text-sm font-bold mt-1" style={{ color: "var(--green)" }}>
                                {progress}%
                            </p>
                        </div>
                    </div>

                    {/* Leaderboard live */}
                    <div className="rounded-2xl p-4 space-y-2"
                         style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                        <h2 className="text-xs font-semibold uppercase tracking-wider mb-3"
                            style={{ color: "rgba(232,245,232,0.4)" }}>Classement</h2>
                        {[...enrichedPlayers]
                            .sort((a, b) => b.score - a.score)
                            .map((p, i) => (
                                <div key={p.username} className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-mono w-4 shrink-0"
                                          style={{ color: i === 0 ? "#facc15" : "rgba(232,245,232,0.3)" }}>
                                        {i + 1}
                                    </span>
                                    <span className="text-xs flex-1 truncate"
                                          style={{ color: "rgba(232,245,232,0.7)" }}>
                                        {p.username}
                                    </span>
                                    <span className="text-xs font-bold"
                                          style={{ color: scoreToColor(p.score) }}>
                                        {p.score}
                                    </span>
                                </div>
                            ))}
                    </div>

                    <button
                        onClick={() => forceEnd()}
                        className="w-full rounded-xl p-3 font-bold transition hover:opacity-90"
                        style={{
                            background: "var(--red-bg)", color: "var(--red)",
                            border: "1px solid var(--red-border)", cursor: "pointer",
                        }}
                    >
                        Forcer la fin
                    </button>
                </aside>

                {/* VILLAGE */}
                <section className="flex-1">
                    <div className="rounded-2xl p-4"
                         style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                        <div
                            ref={containerRef}
                            className="relative w-full rounded-xl overflow-hidden"
                            style={{
                                height: "calc(100vh - 120px)",
                                background: `linear-gradient(to bottom, #87CEEB 0%, #87CEEB ${GROUND_RATIO * 100}%, #4a7c4e ${GROUND_RATIO * 100}%)`,
                            }}
                        >
                            <div className="absolute left-0 w-full h-[2px]"
                                 style={{ top: `${GROUND_RATIO * 100}%`, background: "rgba(0,0,0,0.2)" }}/>

                            {enrichedPlayers.map((player, i) => {
                                const pos = layout.positions[i];
                                if (!pos) return null;
                                return (
                                    <House
                                        key={player.username}
                                        player={player}
                                        x={pos.x} y={pos.y}
                                        size={layout.size}
                                        lastUpdate={village?.username === player.username ? village : null}
                                    />
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