"use client"

import {useEffect, useRef} from "react"
import {useParams, useRouter} from "next/navigation"
import Chart from "chart.js/auto"
import type {ProfileStats} from "@/back/types/socket.t"
import {useQuizContext} from "@/app/providers/QuizProvider";

const PROFILE_CONFIG: Record<string, { label: string; color: string }> = {
    proprietaire: {label: "Propriétaire", color: "#60a5fa"},
    locataire: {label: "Locataire", color: "#a8e063"},
    entreprise: {label: "Entreprise", color: "#fb923c"},
}

export default function ResultsPage() {
    const {sessionId} = useParams<{ sessionId: string }>()
    const router = useRouter()
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const chartRef = useRef<Chart | null>(null)

    const {globalDebrief} = useQuizContext()

    const stats = globalDebrief?.statsByProfile ?? []
    const totalScore = globalDebrief?.leaderboard.reduce((s, p) => s + p.score, 0) ?? 0
    const playerCount = globalDebrief?.leaderboard.length ?? 0

    useEffect(() => {
        if (!canvasRef.current || stats.length === 0) return
        chartRef.current?.destroy()

        chartRef.current = new Chart(canvasRef.current, {
            type: "bar",
            data: {
                labels: stats.map((s) => PROFILE_CONFIG[s.profile]?.label ?? s.profile),
                datasets: [{
                    data: stats.map((s) => Math.round(s.avgScore * s.playerCount)),
                    backgroundColor: stats.map((s) => PROFILE_CONFIG[s.profile]?.color ?? "#888"),
                    borderRadius: 8,
                    borderSkipped: false,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {legend: {display: false}},
                scales: {
                    x: {
                        ticks: {color: "rgba(232,245,232,0.4)"},
                        grid: {display: false},
                        border: {display: false},
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {color: "rgba(232,245,232,0.4)", callback: (v) => v + " pts"},
                        grid: {color: "rgba(76,194,74,0.08)"},
                        border: {display: false},
                    },
                },
            },
        })

        return () => chartRef.current?.destroy()
    }, [stats])

    if (!globalDebrief) {
        return (
            <main className="min-h-screen flex items-center justify-center" style={{background: "var(--background)"}}>
                <p className="text-lg font-semibold animate-pulse" style={{color: "rgba(232,245,232,0.5)"}}>
                    Chargement du bilan...
                </p>
            </main>
        )
    }

    return (
        <main className="min-h-screen p-4 text-white" style={{background: "var(--background)"}}>
            <div className="mx-auto max-w-7xl space-y-6">

                <div className="text-center space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wider"
                       style={{color: "rgba(232,245,232,0.4)"}}>
                        Session {sessionId}
                    </p>
                    <p className="text-sm" style={{color: "rgba(232,245,232,0.5)"}}>Score total de la ville</p>
                    <p className="text-7xl font-black" style={{color: "var(--green)"}}>{totalScore}</p>
                    <p className="text-sm" style={{color: "rgba(232,245,232,0.4)"}}>
                        {playerCount} joueur{playerCount > 1 ? "s" : ""}
                    </p>
                </div>

                <div className="flex gap-6">

                    <aside className="w-64 space-y-3">
                        <h2 className="text-xs font-semibold uppercase tracking-wider"
                            style={{color: "rgba(232,245,232,0.4)"}}>
                            Par profil
                        </h2>
                        {stats.map((s: ProfileStats) => {
                            const total = Math.round(s.avgScore * s.playerCount)
                            const config = PROFILE_CONFIG[s.profile]
                            return (
                                <div key={s.profile} className="rounded-2xl p-4"
                                     style={{background: "var(--card)", border: "1px solid var(--border)"}}>
                                    <div className="flex justify-between items-baseline mb-1">
                                        <p className="text-sm"
                                           style={{color: "rgba(232,245,232,0.5)"}}>{config?.label ?? s.profile}</p>
                                        <p className="text-xs" style={{color: "rgba(232,245,232,0.3)"}}>
                                            {s.playerCount} joueur{s.playerCount > 1 ? "s" : ""}
                                        </p>
                                    </div>
                                    <p className="text-2xl font-black" style={{color: config?.color}}>
                                        {total} pts
                                    </p>
                                </div>
                            )
                        })}

                        <button
                            onClick={() => router.push("/")}
                            className="w-full rounded-xl p-3 text-sm transition-colors"
                            style={{
                                background: "var(--card)",
                                border: "1px solid var(--border)",
                                color: "rgba(232,245,232,0.5)"
                            }}
                        >
                            ← Retour à l'accueil
                        </button>
                    </aside>

                    <section className="flex-1 rounded-2xl p-5"
                             style={{background: "var(--card)", border: "1px solid var(--border)"}}>
                        <div className="flex gap-4 mb-4">
                            {stats.map((s: ProfileStats) => (
                                <span key={s.profile} className="flex items-center gap-2 text-xs"
                                      style={{color: "rgba(232,245,232,0.5)"}}>
                  <span className="w-2.5 h-2.5 rounded-sm inline-block"
                        style={{background: PROFILE_CONFIG[s.profile]?.color}}/>
                                    {PROFILE_CONFIG[s.profile]?.label ?? s.profile}
                </span>
                            ))}
                        </div>
                        <div className="relative h-72">
                            <canvas ref={canvasRef}/>
                        </div>
                    </section>

                </div>
            </div>
        </main>
    )
}