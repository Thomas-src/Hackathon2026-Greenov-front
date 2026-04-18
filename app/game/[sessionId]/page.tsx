"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";

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
  score: number;
  co2: number;
};

/**
 * Génère une grille CARTÉSIENNE basée sur la taille réelle
 */
function generateResponsivePositions(
    count: number,
    width: number,
    height: number
) {
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

    const x = padding + col * cellW + cellW / 2;
    const y = padding + row * cellH + cellH / 2;

    positions.push({ x, y });
  }

  return { positions, cols, rows, cellW, cellH };
}

function House({player, x, y, size,}: {
  player: Player;
  x: number;
  y: number;
  size: number;
}) {
  return (
      <div
          className="absolute flex flex-col items-center transition-all duration-300"
          style={{
            left: x,
            top: y,
            transform: "translate(-50%, -50%)",
          }}
      >
        <Image
            src={houseByProfile[player.profile]}
            alt={player.name}
            width={size}
            height={size * 0.6}
            className="image-pixel"
        />
        <p className="mt-1 rounded bg-black/60 px-2 py-1 text-xs text-white whitespace-nowrap">
          {player.name.substring(0,10)}
        </p>
      </div>
  );
}

export default function HostGamePage() {
  const params = useParams();
  const sessionId = params.id as string;

  const containerRef = useRef<HTMLDivElement>(null);

  const [timeLeft, setTimeLeft] = useState(120);
  const [layout, setLayout] = useState<{
    positions: { x: number; y: number }[];
    size: number;
  }>({
    positions: [],
    size: 50,
  });

  const players = useMemo(() => {
    const base: Player[] = [
      { id:"0", name: "Alice", profile: "house", score: 80, co2: 20 },
      { id:"1", name: "Bob", profile: "flat", score: 60, co2: 35 },
      { id:"2", name: "Chloé", profile: "company", score: 40, co2: 55 },
    ];

    return Array.from({ length: 50 }, (_, i) => {
      const template = base[i % base.length];

      return {
        ...template,
      };
    });
  }, []);

  useEffect(() => {
    function updateLayout() {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();

      const { positions, cellW, cellH } = generateResponsivePositions(
          players.length,
          rect.width,
          rect.height
      );

      const size = Math.min(cellW, cellH) * 0.6;

      setLayout({ positions, size });
    }

    updateLayout();

    const resizeObserver = new ResizeObserver(updateLayout);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener("resize", updateLayout);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateLayout);
    };
  }, [players.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const averageScore = Math.round(
      players.reduce((sum, p) => sum + p.score, 0) / players.length
  );

  const averageCo2 = Math.round(
      players.reduce((sum, p) => sum + p.co2, 0) / players.length
  );

  const progress = 100 - averageCo2;

  function formatTime(seconds: number) {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }

  return (
      <main className="min-h-screen bg-zinc-900 text-white p-6">
        <div className="mx-auto flex max-w-7xl gap-6">
          <aside className="w-72 space-y-4">
            <div className="rounded-xl bg-zinc-800 p-4">
              <h1 className="text-sm text-zinc-400">Temps restant</h1>
              <p className="mt-2 text-3xl font-bold">
                {formatTime(timeLeft)}
              </p>
            </div>

            <div className="rounded-xl bg-zinc-800 p-4 space-y-3">
              <h2 className="text-lg font-semibold">Tableau de bord</h2>

              <div>
                <p className="text-sm text-zinc-400">Joueurs</p>
                <p className="text-2xl font-bold">{players.length}</p>
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
                <p className="text-sm text-zinc-400">
                  Progression vers zéro émission
                </p>
                <p className="text-2xl font-bold">{progress}%</p>
              </div>
            </div>
          </aside>

          <section className="flex-1">
            <div className="rounded-xl bg-zinc-800 p-4">
              <div
                  ref={containerRef}
                  className="relative h-[520px] w-full rounded-lg overflow-hidden bg-gradient-to-b from-sky-300 to-green-700"
              >
                {/* axes */}
                <div className="absolute top-0 left-0 w-full h-[1px] bg-white/20" />
                <div className="absolute top-0 left-0 h-full w-[1px] bg-white/20" />

                {layout.positions.map((pos, i) => (
                    <House
                        key={i}
                        player={players[i]}
                        x={pos.x}
                        y={pos.y}
                        size={layout.size}
                    />
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
  );
}