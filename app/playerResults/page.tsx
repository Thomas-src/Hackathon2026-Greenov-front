"use client";

import { useMemo } from "react";

type Mistake = {
  question: string;
  explanation: string;
};

export default function PlayerResultPage() {
  const score = 68;
  const co2 = 42;
  const comfort = 70;
  const insulation = 55;

  const mistakes: Mistake[] = [
    {
      question: "Installer une PAC sans isoler",
      explanation:
        "Sans isolation, les pertes restent élevées, ce qui réduit l’efficacité du système.",
    },
    {
      question: "Ajouter uniquement des panneaux solaires",
      explanation:
        "Cela ne traite pas la consommation initiale du bâtiment.",
    },
  ];

  const profile = useMemo(() => {
    if (score > 75) return "Trajectoire optimale";
    if (score > 45) return "Trajectoire moyenne";
    return "Trajectoire incohérente";
  }, [score]);

  return (
    <main className="min-h-screen bg-zinc-900 text-white p-6">
      <div className="mx-auto max-w-3xl space-y-6">

        {/* Résumé */}
        <div className="rounded-xl bg-zinc-800 p-6 text-center">
          <h1 className="text-2xl font-bold">Bilan final</h1>
          <p className="mt-2 text-zinc-400">{profile}</p>

          <p className="mt-4 text-4xl font-bold">{score}/100</p>
        </div>

        {/* Stats */}
        <div className="rounded-xl bg-zinc-800 p-6 space-y-4">
          <h2 className="text-lg font-semibold">Ton impact</h2>

          <div className="space-y-3">
            <Stat label="CO₂" value={co2} color="red" />
            <Stat label="Confort" value={comfort} color="green" />
            <Stat label="Isolation" value={insulation} color="blue" />
          </div>
        </div>

        {/* Erreurs */}
        <div className="rounded-xl bg-zinc-800 p-6 space-y-4">
          <h2 className="text-lg font-semibold">Tes erreurs clés</h2>

          {mistakes.map((m, i) => (
            <div key={i} className="rounded-lg bg-zinc-900 p-4">
              <p className="font-semibold text-red-400">
                ❌ {m.question}
              </p>
              <p className="text-sm text-zinc-300 mt-1">
                {m.explanation}
              </p>
            </div>
          ))}
        </div>

        {/* Message final */}
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-6">
          <h2 className="font-semibold">Conseil</h2>
          <p className="text-sm mt-2">
            Commence toujours par réduire les pertes avant d’investir dans des systèmes énergétiques.
          </p>
        </div>

      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "red" | "green" | "blue";
}) {
  const colors = {
    red: "bg-red-500",
    green: "bg-green-500",
    blue: "bg-blue-500",
  };

  return (
    <div>
      <div className="flex justify-between text-sm text-zinc-300">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 bg-zinc-700 rounded">
        <div
          className={`h-2 rounded ${colors[color]}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}