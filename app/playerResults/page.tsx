"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuiz } from "@/hooks/useQuiz";

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl bg-zinc-900 p-4">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

export default function PlayerResultPage() {
  const params = useParams();
  const roomId = params.id as string;

  const { debrief, getMyDebrief, isConnected } = useQuiz(roomId);

  useEffect(() => {
    if (!isConnected) return;
    getMyDebrief();
  }, [isConnected, getMyDebrief]);

  if (!debrief) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-900 text-white">
        <p className="text-lg">Chargement du bilan...</p>
      </main>
    );
  }

  const totalMoves = debrief.goodMoves + debrief.badMoves;
  const successRate =
    totalMoves > 0 ? Math.round((debrief.goodMoves / totalMoves) * 100) : 0;

  const trajectoryLabel =
    debrief.totalScore >= 75
      ? "Trajectoire cohérente"
      : debrief.totalScore >= 45
      ? "Trajectoire mitigée"
      : "Trajectoire à améliorer";

  return (
    <main className="min-h-screen bg-zinc-900 p-4 text-white sm:p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="rounded-2xl bg-zinc-800 p-6 text-center shadow-lg">
          <p className="text-sm uppercase tracking-wide text-zinc-400">
            Bilan final
          </p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            Ton résultat
          </h1>
          <p className="mt-4 text-5xl font-extrabold text-emerald-400">
            {debrief.totalScore}/100
          </p>
          <p className="mt-3 text-zinc-300">{trajectoryLabel}</p>
          <p className="mt-2 text-sm text-zinc-400">
            Taux de bonnes décisions : {successRate}%
          </p>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Score total" value={`${debrief.totalScore}/100`} />
          <StatCard label="Empreinte carbone" value={debrief.totalCarbon} />
          <StatCard label="Bonnes décisions" value={debrief.goodMoves} />
          <StatCard label="Mauvaises décisions" value={debrief.badMoves} />
        </section>

        <section className="rounded-2xl bg-zinc-800 p-6 shadow-lg">
          <h2 className="text-xl font-semibold">Erreurs à retenir</h2>

          {debrief.mistakes.length === 0 ? (
            <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <p className="font-medium text-emerald-300">
                Bravo, aucune erreur majeure relevée.
              </p>
              <p className="mt-2 text-sm text-zinc-200">
                Tu as pris des décisions globalement cohérentes pendant la
                partie.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {debrief.mistakes.map((mistake, index) => (
                <article
                  key={`${mistake.eventTitle}-${index}`}
                  className="rounded-xl bg-zinc-900 p-4"
                >
                  <p className="text-sm text-zinc-400">
                    Événement : {mistake.eventTitle}
                  </p>

                  <p className="mt-2 font-semibold text-red-400">
                    Réponse choisie : {mistake.actionLabel}
                  </p>

                  <p className="mt-2 text-sm text-zinc-300">
                    {mistake.educationalNote}
                  </p>

                  <div className="mt-3">
                    {mistake.prerequisitesMet ? (
                      <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300">
                        Prérequis respectés
                      </span>
                    ) : (
                      <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-medium text-red-300">
                        Prérequis non respectés
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-6 shadow-lg">
          <h2 className="text-xl font-semibold">Conseil global</h2>
          <p className="mt-3 text-zinc-100">
            Pour améliorer ton impact, il faut d’abord réduire les pertes
            énergétiques, puis choisir des solutions techniques adaptées.
          </p>
        </section>
      </div>
    </main>
  );
}