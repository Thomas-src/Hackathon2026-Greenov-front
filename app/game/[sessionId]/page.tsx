"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

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
  score: number;
  co2: number;
};

function random(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

/**
 * Place les maisons en grille souple :
 * - structure lisible
 * - léger décalage pour garder un aspect village
 */
function generateVillagePositions(count: number) {
  const positions: { x: number; y: number }[] = [];

  const columns = 4;
  const startX = 80;
  const startY = 80;
  const gapX = 140;
  const gapY = 120;

  for (let i = 0; i < count; i++) {
    const col = i % columns;
    const row = Math.floor(i / columns);

    const x = startX + col * gapX + random(-18, 18);
    const y = startY + row * gapY + random(-12, 12);

    positions.push({ x, y });
  }

  return positions;
}

function House({ player }: { player: Player }) {
  return (
    <div
      className="absolute flex flex-col items-center"
      style={{ left: player.x, top: player.y }}
    >
      <img
        src={houseByProfile[player.profile]}
        alt={player.name}
        className="w-16 image-pixel"
      />
      <p className="mt-1 rounded bg-black/60 px-2 py-1 text-xs text-white">
        {player.name}
      </p>
    </div>
  );
}

export default function HostGamePage() {
  const params = useParams();
  const sessionId = params.id as string;

  const [timeLeft, setTimeLeft] = useState(120);

  const initialPlayers = useMemo(() => {
    const basePlayers = [
      { id: "1", name: "Alice", profile: "house" as Profile, score: 80, co2: 20 },
      { id: "2", name: "Bob", profile: "house" as Profile, score: 60, co2: 35 },
      { id: "3", name: "Chloé", profile: "house" as Profile, score: 40, co2: 55 },
      { id: "4", name: "Léo", profile: "house" as Profile, score: 70, co2: 25 },
      { id: "5", name: "Maya", profile: "house" as Profile, score: 66, co2: 32 },
      { id: "6", name: "Noah", profile: "house" as Profile, score: 50, co2: 41 },
      { id: "7", name: "Emma", profile: "house" as Profile, score: 74, co2: 27 },
      { id: "8", name: "Lucas", profile: "house" as Profile, score: 58, co2: 39 },
    ];

    const positions = generateVillagePositions(basePlayers.length);

    return basePlayers.map((player, index) => ({
      ...player,
      x: positions[index].x,
      y: positions[index].y,
    }));
  }, []);

  const [players] = useState<Player[]>(initialPlayers);

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
            <h1 className="text-xl font-bold">Session {sessionId}</h1>
            <p className="text-sm text-zinc-400">Vue host</p>
          </div>

          <div className="rounded-xl bg-zinc-800 p-4">
            <p className="text-sm text-zinc-400">Temps restant</p>
            <p className="mt-2 text-3xl font-bold">{formatTime(timeLeft)}</p>
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
              <p className="text-sm text-zinc-400">Progression vers zéro émission</p>
              <p className="text-2xl font-bold">{progress}%</p>
            </div>
          </div>
        </aside>

        <section className="flex-1">
          <div className="rounded-xl bg-zinc-800 p-4">
            <h2 className="mb-4 text-lg font-semibold">Village</h2>

            <div className="relative h-[520px] rounded-lg overflow-hidden bg-gradient-to-b from-sky-300 to-green-700">
              {players.map((player) => (
                <House key={player.id} player={player} />
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}