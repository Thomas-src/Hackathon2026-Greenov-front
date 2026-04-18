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

type Player = {
  username: string;
  profile: Profile;
  score: number;
  co2: number;
};

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
    positions.push({
      x: padding + col * cellW + cellW / 2,
      y: padding + row * cellH + cellH / 2,
    });
  }

  return { positions, cellW, cellH };
}

function House({ player, x, y, size }: { player: Player; x: number; y: number; size: number }) {
  return (
      <div
          className="absolute flex flex-col items-center transition-all duration-300"
          style={{ left: x, top: y, transform: "translate(-50%, -50%)" }}
      >
        <Image
            src={houseByProfile[player.profile]}
            alt={player.username}
            width={size}
            height={size * 0.6}
            className="image-pixel"
        />
        <p className="mt-1 rounded bg-black/60 px-2 py-1 text-xs text-white whitespace-nowrap">
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
      const updated: Player = {
        username: village.username,
        profile: village.profile as Profile,
        score: village.playerScore,
        co2: village.globalCarbon,
      };
      const exists = prev.find((p) => p.username === village.username);
      if (exists) {
        return prev.map((p) => (p.username === village.username ? updated : p));
      }
      return [...prev, updated];
    });
  }, [village]);

  const [layout, setLayout] = useState<{
    positions: { x: number; y: number }[];
    size: number;
  }>({ positions: [], size: 50 });

  useEffect(() => {
    function updateLayout() {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const { positions, cellW, cellH } = generateResponsivePositions(
          players.length,
          rect.width,
          rect.height
      );
      setLayout({ positions, size: Math.min(cellW, cellH) * 0.6 });
    }

    updateLayout();
    const ro = new ResizeObserver(updateLayout);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener("resize", updateLayout);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateLayout);
    };
  }, [players.length]);

  const timeLeft = timer?.remaining ?? 0;

  function formatTime(seconds: number) {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }

  const averageScore =
      players.length > 0
          ? Math.round(players.reduce((sum, p) => sum + p.score, 0) / players.length)
          : 0;

  const averageCo2 =
      players.length > 0
          ? Math.round(players.reduce((sum, p) => sum + p.co2, 0) / players.length)
          : 0;

  const progress = 100 - averageCo2;

  return (
      <main className="min-h-screen bg-zinc-900 text-white p-6">
        <div className="mx-auto flex max-w-7xl gap-6">

          <aside className="w-72 space-y-4">
            <div className="rounded-xl bg-zinc-800 p-4">
              <h1 className="text-sm text-zinc-400">Temps restant</h1>
              <p className="mt-2 text-3xl font-bold">{formatTime(timeLeft)}</p>
            </div>

            <div className="rounded-xl bg-zinc-800 p-4 space-y-3">
              <h2 className="text-lg font-semibold">Tableau de bord</h2>

              <div>
                <p className="text-sm text-zinc-400">Joueurs</p>
                <p className="text-2xl font-bold">{playersCount}</p>
              </div>

              <div>
                <p className="text-sm text-zinc-400">Score moyen</p>
                <p className="text-2xl font-bold">{averageScore}/100</p>
              </div>

              <div>
                <p className="text-sm text-zinc-400">CO₂ moyen</p>
                <p className="text-2xl font-bold">{averageCo2}%</p>
              </div>

              <div>
                <p className="text-sm text-zinc-400">Progression vers zéro émission</p>
                <p className="text-2xl font-bold">{progress}%</p>
              </div>
            </div>

            <button
                onClick={forceEnd}
                className="w-full rounded-lg bg-red-600 p-3 font-bold hover:bg-red-500"
            >
              Forcer la fin
            </button>
          </aside>

          <section className="flex-1">
            <div className="rounded-xl bg-zinc-800 p-4">
              <div
                  ref={containerRef}
                  className="relative h-[520px] w-full rounded-lg overflow-hidden bg-gradient-to-b from-sky-300 to-green-700"
              >
                {layout.positions.map((pos, i) =>
                    players[i] ? (
                        <House
                            key={players[i].username}
                            player={players[i]}
                            x={pos.x}
                            y={pos.y}
                            size={layout.size}
                        />
                    ) : null
                )}
              </div>
            </div>
          </section>

        </div>
      </main>
  );
}