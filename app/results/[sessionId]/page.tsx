"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Chart from "chart.js/auto"
import { quizSocket } from "@/back/WebSocket"

type StatByProfile = {
  Profile: string
  PlayerCount: number
  AvgScore: number
  AvgAccuracy: number
}

type LeaderboardEntry = {
  Rank: number
  Username: string
  Profile: string
  Score: number
}

type GlobalDebriefData = {
  Reason: string
  GlobalCarbon: number
  Leaderboard: LeaderboardEntry[]
  StatsByProfile: StatByProfile[]
}

const PROFILE_CONFIG: Record<string, { label: string; color: string }> = {
  house:   { label: "Maison",      color: "#60a5fa" },
  flat:    { label: "Appartement", color: "#34d399" },
  company: { label: "Entreprise",  color: "#fb923c" },
}

export default function ResultsPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)

  const [stats, setStats] = useState<StatByProfile[]>([])
  const [totalScore, setTotalScore] = useState(0)
  const [playerCount, setPlayerCount] = useState(0)

  useEffect(() => {
  quizSocket.on<GlobalDebriefData>("GlobalDebrief", (data) => {
    setStats(data.StatsByProfile)
    setTotalScore(data.Leaderboard.reduce((s, p) => s + p.Score, 0))
    setPlayerCount(data.Leaderboard.length)
  })

  const tryGetDebrief = async () => {
    if (!quizSocket.isConnected()) {
      await quizSocket.connect()
    }
    await quizSocket.getGlobalDebrief(sessionId)
  }

  tryGetDebrief()

  //return () => { quizSocket.off("GlobalDebrief") }
}, [sessionId])

  useEffect(() => {
    if (!canvasRef.current || stats.length === 0) return
    chartRef.current?.destroy()

    chartRef.current = new Chart(canvasRef.current, {
      type: "bar",
      data: {
        labels: stats.map((s) => PROFILE_CONFIG[s.Profile]?.label ?? s.Profile),
        datasets: [{
          data: stats.map((s) => Math.round(s.AvgScore * s.PlayerCount)),
          backgroundColor: stats.map((s) => PROFILE_CONFIG[s.Profile]?.color ?? "#888"),
          borderRadius: 8,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            ticks: { color: "#71717a" },
            grid: { display: false },
            border: { display: false },
          },
          y: {
            beginAtZero: true,
            ticks: { color: "#71717a", callback: (v) => v + " pts" },
            grid: { color: "rgba(113,113,122,0.15)" },
            border: { display: false },
          },
        },
      },
    })

    return () => chartRef.current?.destroy()
  }, [stats])

  return (
    <main className="min-h-screen bg-zinc-900 text-white p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        <div className="text-center space-y-1">
          <p className="text-sm text-zinc-500">Session {sessionId}</p>
          <p className="text-zinc-400 text-base">Score total de la ville</p>
          <p className="text-7xl font-bold">{totalScore}</p>
          <p className="text-zinc-500 text-sm">{playerCount} joueurs</p>
        </div>

        <div className="flex gap-6">

          <aside className="w-64 space-y-3">
            <h2 className="text-sm text-zinc-400 uppercase tracking-wider">Par profil</h2>
            {stats.map((s) => {
              const total = Math.round(s.AvgScore * s.PlayerCount)
              const config = PROFILE_CONFIG[s.Profile]
              return (
                <div key={s.Profile} className="rounded-xl bg-zinc-800 p-4">
                  <div className="flex justify-between items-baseline mb-1">
                    <p className="text-sm text-zinc-400">{config?.label ?? s.Profile}</p>
                    <p className="text-xs text-zinc-600">{s.PlayerCount} joueur{s.PlayerCount > 1 ? "s" : ""}</p>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: config?.color }}>
                    {total} pts
                  </p>
                </div>
              )
            })}

            <button
              onClick={() => router.push("/")}
              className="w-full rounded-xl bg-zinc-800 p-3 text-sm text-zinc-300 hover:bg-zinc-700 transition-colors"
            >
              ← Retour à l'accueil
            </button>
          </aside>

          <section className="flex-1 rounded-xl bg-zinc-800 p-4">
            <div className="flex gap-4 mb-4">
              {stats.map((s) => (
                <span key={s.Profile} className="flex items-center gap-2 text-xs text-zinc-400">
                  <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: PROFILE_CONFIG[s.Profile]?.color }} />
                  {PROFILE_CONFIG[s.Profile]?.label ?? s.Profile}
                </span>
              ))}
            </div>
            <div className="relative h-72">
              <canvas ref={canvasRef} />
            </div>
          </section>

        </div>
      </div>
    </main>
  )
}