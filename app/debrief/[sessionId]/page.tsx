"use client"

import {useEffect} from "react"
import {useParams, useSearchParams} from "next/navigation"
import type {Mistake} from "@/back/types/socket.t"
import {useQuizContext} from "@/app/providers/QuizProvider";

// ─── Helpers ──────────────────────────────────────────────

function scoreToColor(score: number): string {
    if (score >= 80) return "#4ade80"
    if (score >= 60) return "#a3e635"
    if (score >= 40) return "#facc15"
    if (score >= 20) return "#fb923c"
    return "#f87171"
}

function scoreLabel(score: number): string {
    if (score >= 80) return "Excellent ! 🌿"
    if (score >= 60) return "Bien joué 👍"
    if (score >= 40) return "Peut mieux faire 🔧"
    return "À améliorer ⚠️"
}

// ─── Composants ───────────────────────────────────────────

function StatCard({label, value, sub}: { label: string; value: string; sub?: string }) {
    return (
        <div className="flex flex-col gap-1 rounded-2xl p-5"
             style={{background: "#0d1f14", border: "1px solid #1e3a28"}}>
            <p className="text-[10px] font-mono uppercase tracking-widest" style={{color: "#3d5c45"}}>
                {label}
            </p>
            <p className="text-3xl font-black" style={{color: "#4ade80"}}>{value}</p>
            {sub && <p className="text-xs" style={{color: "#3d5c45"}}>{sub}</p>}
        </div>
    )
}

function MistakeCard({mistake}: { mistake: Mistake }) {
    return (
        <div className="rounded-2xl p-4 space-y-2"
             style={{background: "#0d1f14", border: "1px solid #2a1a1a"}}>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-semibold text-white">{mistake.eventTitle}</p>
                    <p className="text-xs mt-0.5" style={{color: "#7a4a4a"}}>
                        Réponse donnée : <span className="text-[#f87171]">{mistake.actionLabel}</span>
                    </p>
                    {!mistake.prerequisitesMet && (
                        <span className="inline-block mt-1 text-[9px] px-2 py-0.5 rounded-full"
                              style={{
                                  background: "rgba(251,146,60,0.1)",
                                  border: "1px solid rgba(251,146,60,0.3)",
                                  color: "#fb923c"
                              }}>
                            Prérequis non remplis
                        </span>
                    )}
                </div>
                <span className="shrink-0 text-[#f87171] text-lg">✗</span>
            </div>
            <p className="text-xs leading-relaxed" style={{color: "#5a7a62"}}>
                💡 {mistake.educationalNote}
            </p>
        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────

export default function DebriefPage() {
    const params = useParams<{ sessionId: string }>()
    const searchParams = useSearchParams()
    const playerName = searchParams.get("name") || "Joueur"

    const {debrief, getMyDebrief} = useQuizContext()

    // Demande le debrief au mount si pas encore reçu
    useEffect(() => {
        if (!debrief) {
            getMyDebrief()
        }
    }, [])

    if (!debrief) {
        return (
            <main className="min-h-screen flex items-center justify-center"
                  style={{background: "#0a1a0f"}}>
                <div className="text-center space-y-4">
                    <div
                        className="w-8 h-8 border-2 border-[#4ade80] border-t-transparent rounded-full animate-spin mx-auto"/>
                    <p className="font-mono text-sm" style={{color: "#4ade80"}}>Chargement du bilan…</p>
                </div>
            </main>
        )
    }

    const accuracy = debrief.goodMoves + debrief.badMoves > 0
        ? Math.round((debrief.goodMoves / (debrief.goodMoves + debrief.badMoves)) * 100)
        : 0

    const color = scoreToColor(debrief.totalScore)

    return (
        <main className="min-h-screen p-4 sm:p-6 text-white"
              style={{background: "#0a1a0f", fontFamily: "var(--font-sans)"}}>
            <div className="mx-auto max-w-2xl space-y-6">

                {/* Header */}
                <div className="text-center space-y-2 pt-4">
                    <p className="text-[10px] font-mono uppercase tracking-widest" style={{color: "#3d5c45"}}>
                        Bilan · {playerName}
                    </p>
                    <p className="text-7xl font-black tabular-nums" style={{color}}>{debrief.totalScore}</p>
                    <p className="text-sm font-semibold" style={{color}}>{scoreLabel(debrief.totalScore)}</p>
                    <p className="text-xs" style={{color: "#3d5c45"}}>points accumulés</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                    <StatCard
                        label="Précision"
                        value={`${accuracy}%`}
                        sub={`${debrief.goodMoves} / ${debrief.goodMoves + debrief.badMoves} actions`}
                    />
                    <StatCard
                        label="Bons choix"
                        value={String(debrief.goodMoves)}
                    />
                    <StatCard
                        label="CO₂ cumulé"
                        value={`${Math.round(debrief.totalCarbon)}`}
                        sub="kg/an"
                    />
                </div>

                {/* Accuracy bar */}
                <div className="rounded-2xl p-5 space-y-3"
                     style={{background: "#0d1f14", border: "1px solid #1e3a28"}}>
                    <div className="flex justify-between text-xs font-mono" style={{color: "#3d5c45"}}>
                        <span>Précision globale</span>
                        <span style={{color: scoreToColor(accuracy)}}>{accuracy}%</span>
                    </div>
                    <div className="h-2 rounded-full" style={{background: "#1e3a28"}}>
                        <div className="h-2 rounded-full transition-all duration-700"
                             style={{width: `${accuracy}%`, background: scoreToColor(accuracy)}}/>
                    </div>
                    <div className="flex gap-4 text-xs" style={{color: "#3d5c45"}}>
                        <span
                            style={{color: "#4ade80"}}>✓ {debrief.goodMoves} correct{debrief.goodMoves > 1 ? "s" : ""}</span>
                        <span
                            style={{color: "#f87171"}}>✗ {debrief.badMoves} incorrect{debrief.badMoves > 1 ? "s" : ""}</span>
                    </div>
                </div>

                {/* Erreurs */}
                {debrief.mistakes.length > 0 && (
                    <div className="space-y-3">
                        <h2 className="text-xs font-mono uppercase tracking-widest" style={{color: "#3d5c45"}}>
                            Points à améliorer ({debrief.mistakes.length})
                        </h2>
                        {debrief.mistakes.map((mistake, i) => (
                            <MistakeCard key={i} mistake={mistake}/>
                        ))}
                    </div>
                )}

                {debrief.mistakes.length === 0 && (
                    <div className="rounded-2xl p-6 text-center"
                         style={{background: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.2)"}}>
                        <p className="text-2xl mb-2">🌿</p>
                        <p className="font-semibold" style={{color: "#4ade80"}}>Aucune erreur !</p>
                        <p className="text-xs mt-1" style={{color: "#3d5c45"}}>Parfaite maîtrise des enjeux
                            écologiques.</p>
                    </div>
                )}

            </div>
        </main>
    )
}