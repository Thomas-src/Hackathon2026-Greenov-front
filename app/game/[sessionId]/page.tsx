"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { useQuiz } from "@/hooks/useQuiz";

type Profile = "house" | "flat" | "company";

const houseByProfile: Record<Profile, string> = {
  house: "/houses/house.gif",
  flat: "/houses/flat.gif",
  company: "/houses/company.gif",
};

type Player = { username: string; profile: Profile; score: number; co2: number };

function generateResponsivePositions(count: number, width: number, height: number) {
  const positions: { x: number; y: number }[] = [];
  const padding = 15;
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const cellW = usableWidth / cols;
  const cellH = usableHeight / rows;
  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    positions.push({ x: padding + col * cellW + cellW / 2, y: padding + row * cellH + cellH / 2 });
  }
  return { positions, cellW, cellH };
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
      <div className="flex flex-col gap-1 rounded-xl p-4" style={{ background: "rgba(76,194,74,0.07)", border: "1px solid var(--border)" }}>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(232,245,232,0.4)" }}>{label}</p>
        <p className="text-2xl font-black" style={{ color: "var(--green)" }}>{value}</p>
      </div>
  );
}

function House({ player, x, y, size }: { player: Player; x: number; y: number; size: number }) {
  return (
      <div className="absolute flex flex-col items-center transition-all duration-300" style={{ left: x, top: y, transform: "translate(-50%, -50%)" }}>
        <Image src={houseByProfile[player.profile]} alt={player.username} width={size} height={size * 0.6} className="image-pixel" />
        <p className="mt-1 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap"
           style={{ background: "rgba(0,0,0,0.6)", color: "white", border: "1px solid rgba(255,255,255,0.15)" }}>
          {player.username.substring(0, 10)}
        </p>
      </div>
  );
}

export default function HostGamePage() {
  const { id: sessionId } = useParams<{ id: string }>();
  const containerRef = useRef<HTMLDivElement>(null);
  const { playersCount, village, timer, forceEnd } = useQuiz(sessionId);
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    if (!village) return;
    setPlayers((prev) => {
      const updated: Player = { username: village.username, profile: village.profile as Profile, score: village.playerScore, co2: village.globalCarbon };
      const exists = prev.find(p => p.username === village.username);
      if (exists) return prev.map(p => p.username === village.username ? updated : p);
      return [...prev, updated];
    });
  }, [village]);

  const [layout, setLayout] = useState<{ positions: { x: number; y: number }[]; size: number }>({ positions: [], size: 50 });

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

  const averageScore = players.length > 0 ? Math.round(players.reduce((sum, p) => sum + p.score, 0) / players.length) : 0;
  const averageCo2 = players.length > 0 ? Math.round(players.reduce((sum, p) => sum + p.co2, 0) / players.length) : 0;
  const progress = 100 - averageCo2;

  return (
      <main className="min-h-screen p-6 text-white" style={{ background: "var(--background)" }}>
        <div className="mx-auto flex max-w-7xl gap-6">

          <aside className="w-72 space-y-4">
            <div className="rounded-2xl p-5 text-center" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(232,245,232,0.4)" }}>Temps restant</p>
              <p className="mt-2 text-5xl font-black tabular-nums" style={{ color: timeLeft < 30 ? "var(--red)" : "var(--accent)" }}>
                {formatTime(timeLeft)}
              </p>
            </div>

            <div className="rounded-2xl p-5 space-y-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(232,245,232,0.4)" }}>Tableau de bord</h2>
              <StatCard label="Joueurs" value={String(playersCount)} />
              <StatCard label="Score moyen" value={`${averageScore}/100`} />
              <StatCard label="CO₂ moyen" value={`${averageCo2}%`} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "rgba(232,245,232,0.4)" }}>Progression zéro émission</p>
                <div className="h-3 rounded-full" style={{ background: "rgba(76,194,74,0.15)" }}>
                  <div className="h-3 rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: "var(--green)" }} />
                </div>
                <p className="text-right text-sm font-bold mt-1" style={{ color: "var(--green)" }}>{progress}%</p>
              </div>
            </div>

            <button onClick={forceEnd} className="w-full rounded-xl p-3 font-bold transition hover:opacity-90"
                    style={{ background: "var(--red-bg)", color: "var(--red)", border: "1px solid var(--red-border)" }}>
              Forcer la fin
            </button>
          </aside>

          <section className="flex-1">
            <div className="rounded-2xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div ref={containerRef} className="relative h-[520px] w-full rounded-xl overflow-hidden"
                   style={{ background: "linear-gradient(to bottom, #87CEEB 0%, #87CEEB 55%, #4a7c4e 55%)" }}>
                {layout.positions.map((pos, i) =>
                    players[i] ? <House key={players[i].username} player={players[i]} x={pos.x} y={pos.y} size={layout.size} /> : null
                )}
                {players.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-sm" style={{ color: "rgba(0,0,0,0.4)" }}>En attente des joueurs...</p>
                    </div>
                )}
              </div>
            </div>
          </section>

        </div>
      </main>
  );
}