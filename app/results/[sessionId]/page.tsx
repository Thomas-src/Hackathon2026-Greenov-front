"use client"

import { useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Chart from "chart.js/auto"

type Profile = "house" | "flat" | "company"

type Player = {
  profile: Profile
  score: number
}

const PROFILE_CONFIG: Record<Profile, { label: string; color: string }> = {
  house:   { label: "Maison",      color: "#60a5fa" },
  flat:    { label: "Appartement", color: "#34d399" },
  company: { label: "Entreprise",  color: "#fb923c" },
}

function totalByProfile(players: Player[]) {
  return (Object.keys(PROFILE_CONFIG) as Profile[]).map((profile) => {
    const group = players.filter((p) => p.profile === profile)
    const total = group.reduce((s, p) => s + p.score, 0)
    return { profile, total, count: group.length }
  })
}

const MOCK_PLAYERS: Player[] = [
  { profile: "house",   score: 12 },
  { profile: "house",   score: 74 },
  { profile: "house",   score: 69 },
  { profile: "flat",    score: 67 },
  { profile: "flat",    score: 58 },
  { profile: "flat",    score: 77 },
  { profile: "company", score: 91 },
  { profile: "company", score: 43 },
]

export default function ResultsPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)

  const stats = totalByProfile(MOCK_PLAYERS)
  const totalScore = MOCK_PLAYERS.reduce((s, p) => s + p.score, 0)

  useEffect(() => {
    if (!canvasRef.current) return
    chartRef.current?.destroy()

    chartRef.current = new Chart(canvasRef.current, {
      type: "bar",
      data: {
        labels: stats.map((s) => PROFILE_CONFIG[s.profile].label),
        datasets: [{
          data: stats.map((s) => s.total),
          backgroundColor: stats.map((s) => PROFILE_CONFIG[s.profile].color),
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

        {/* Score ville — centré, grand */}
        <div className="text-center space-y-1">
          <p className="text-sm text-zinc-500">Session {sessionId}</p>
          <p className="text-zinc-400 text-base">Score total de la ville</p>
          <p className="text-7xl font-bold">{totalScore}</p>
          <p className="text-zinc-500 text-sm">{MOCK_PLAYERS.length} joueurs</p>
        </div>

        {/* Contenu */}
        <div className="flex gap-6">

          <aside className="w-64 space-y-3">
            <h2 className="text-sm text-zinc-400 uppercase tracking-wider">Par profil</h2>
            {stats.map(({ profile, total, count }) => (
              <div key={profile} className="rounded-xl bg-zinc-800 p-4">
                <div className="flex justify-between items-baseline mb-1">
                  <p className="text-sm text-zinc-400">{PROFILE_CONFIG[profile].label}</p>
                  <p className="text-xs text-zinc-600">{count} joueur{count > 1 ? "s" : ""}</p>
                </div>
                <p className="text-2xl font-bold" style={{ color: PROFILE_CONFIG[profile].color }}>
                  {total} pts
                </p>
              </div>
            ))}

            <button
              onClick={() => router.push("/")}
              className="w-full rounded-xl bg-zinc-800 p-3 text-sm text-zinc-300 hover:bg-zinc-700 transition-colors"
            >
              ← Retour à l'accueil
            </button>
          </aside>

          <section className="flex-1 rounded-xl bg-zinc-800 p-4">
            <div className="flex gap-4 mb-4">
              {stats.map(({ profile }) => (
                <span key={profile} className="flex items-center gap-2 text-xs text-zinc-400">
                  <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: PROFILE_CONFIG[profile].color }} />
                  {PROFILE_CONFIG[profile].label}
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