"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { useQuiz } from "@/hooks/useQuiz"
import type { NewEvent } from "@/back/types/socket.t"

// ─── Types ────────────────────────────────────────────────────────────────────

type IssueType  = 1 | 2 | 3          // 1=froid  2=condensation  3=feu
type BackProfile = "proprietaire" | "locataire" | "entreprise"

// ─── GIF mapping ──────────────────────────────────────────────────────────────

const PROFILE_TO_BASE: Record<BackProfile, string> = {
  proprietaire: "house",
  locataire:    "flat",
  entreprise:   "company",
}

const PROFILE_TO_SUFFIX: Record<BackProfile, string> = {
  proprietaire: "House",
  locataire:    "Flat",
  entreprise:   "Company",
}

//  ID  |  problèmes actifs
//  0   |  aucun (normal)
//  1   |  froid
//  2   |  condensation
//  3   |  feu
//  4   |  froid + condensation
//  5   |  condensation + feu
//  6   |  froid + feu
//  7   |  froid + condensation + feu

const STATE_GIF: Record<number, { folder: string; prefix: string }> = {
  0: { folder: "houses",      prefix: ""            },
  1: { folder: "snow",        prefix: "snow"        },
  2: { folder: "wet",         prefix: "wet"         },
  3: { folder: "fire",        prefix: "fire"        },
  4: { folder: "snowWet",     prefix: "snowWet"     },
  5: { folder: "wetFire",     prefix: "wetFire"     },
  6: { folder: "snowFire",    prefix: "snowFire"    },
  7: { folder: "snowWetFire", prefix: "snowWetFire" },
}

const STATE_LABEL: Record<number, string> = {
  0: "Bâtiment sain ✅",
  1: "Problème de froid ❄️",
  2: "Condensation 💧",
  3: "Risque incendie 🔥",
  4: "Froid + condensation ❄️💧",
  5: "Condensation + incendie 💧🔥",
  6: "Froid + incendie ❄️🔥",
  7: "Toutes menaces actives ⚠️",
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStateId(issues: Set<IssueType>): number {
  const h1 = issues.has(1)
  const h2 = issues.has(2)
  const h3 = issues.has(3)
  if (!h1 && !h2 && !h3) return 0
  if ( h1 && !h2 && !h3) return 1
  if (!h1 &&  h2 && !h3) return 2
  if (!h1 && !h2 &&  h3) return 3
  if ( h1 &&  h2 && !h3) return 4
  if (!h1 &&  h2 &&  h3) return 5
  if ( h1 && !h2 &&  h3) return 6
  return 7
}

function getBuildingGif(profile: BackProfile, stateId: number): string {
  const { folder, prefix } = STATE_GIF[stateId]
  const filename = prefix === ""
    ? PROFILE_TO_BASE[profile]
    : `${prefix}${PROFILE_TO_SUFFIX[profile]}`
  return `/${folder}/${filename}.gif`
}

function parseIssueType(raw: string): IssueType | null {
  const n = raw.toLowerCase().trim()
  if (n === "cold")     return 1
  if (n === "humidity") return 2
  if (n === "dry")      return 3
  return null
}

function scoreToColor(score: number): string {
  if (score >= 80) return "#4ade80"
  if (score >= 60) return "#a3e635"
  if (score >= 40) return "#facc15"
  if (score >= 20) return "#fb923c"
  return "#f87171"
}

// ─── House Panel ──────────────────────────────────────────────────────────────

function HousePanel({
  profile, playerName, score, carbon, issueStates, feedbackCorrect, feedbackNote,
}: {
  profile: BackProfile
  playerName: string
  score: number
  carbon: number
  issueStates: Set<IssueType>
  feedbackCorrect: boolean | null
  feedbackNote: string | null
}) {
  const stateId = getStateId(issueStates)
  const gifSrc  = getBuildingGif(profile, stateId)
  const color   = scoreToColor(score)

  return (
    <div className="flex flex-col items-center justify-center gap-5 w-full h-full py-6 px-4">

      {/* Score / CO₂ */}
      <div className="flex gap-3 w-full max-w-xs">
        <div className="flex-1 bg-[#0d1f14] border border-[#1e3a28] rounded-xl p-3 text-center">
          <p className="text-[10px] font-mono text-[#3d5c45] uppercase mb-1">Score</p>
          <p className="text-2xl font-bold transition-colors duration-500" style={{ color }}>
            {score}
          </p>
        </div>
        <div className="flex-1 bg-[#0d1f14] border border-[#1e3a28] rounded-xl p-3 text-center">
          <p className="text-[10px] font-mono text-[#3d5c45] uppercase mb-1">CO₂</p>
          <p className="text-2xl font-bold text-[#fb923c]">{carbon}</p>
          <p className="text-[9px] text-[#3d5c45]">kg/an</p>
        </div>
      </div>

      {/* GIF — key force le rechargement à chaque changement d'état */}
      <div className="relative flex items-center justify-center">
        <div
          className="absolute inset-0 rounded-full blur-3xl opacity-20 transition-all duration-1000"
          style={{ background: stateId === 0 ? "#4ade80" : "#f87171" }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={gifSrc}
          src={gifSrc}
          alt={STATE_LABEL[stateId]}
          className="relative z-10 w-36 sm:w-44 md:w-52 drop-shadow-2xl"
          style={{ imageRendering: "pixelated" }}
        />
      </div>

      {/* État */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-xs font-semibold" style={{ color: stateId === 0 ? "#4ade80" : "#f87171" }}>
          {STATE_LABEL[stateId]}
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {issueStates.size === 0 && (
            <span className="text-[10px] px-2 py-1 rounded-full bg-[#4ade80]/10 border border-[#4ade80]/30 text-[#4ade80]">
              Aucun problème actif
            </span>
          )}
          {issueStates.has(1) && (
            <span className="text-[10px] px-2 py-1 rounded-full bg-[#60a5fa]/10 border border-[#60a5fa]/30 text-[#60a5fa]">❄️ Froid</span>
          )}
          {issueStates.has(2) && (
            <span className="text-[10px] px-2 py-1 rounded-full bg-[#818cf8]/10 border border-[#818cf8]/30 text-[#818cf8]">💧 Condensation</span>
          )}
          {issueStates.has(3) && (
            <span className="text-[10px] px-2 py-1 rounded-full bg-[#f87171]/10 border border-[#f87171]/30 text-[#f87171]">🔥 Incendie</span>
          )}
        </div>
      </div>

      {/* Feedback */}
      {feedbackCorrect !== null && feedbackNote && (
        <div className={`w-full max-w-xs rounded-xl p-3 border text-xs ${
          feedbackCorrect
            ? "bg-[#4ade80]/5 border-[#4ade80]/30"
            : "bg-[#f87171]/5 border-[#f87171]/30"
        }`}>
          <p className={`font-bold mb-1 ${feedbackCorrect ? "text-[#4ade80]" : "text-[#f87171]"}`}>
            {feedbackCorrect ? "✓ Bon choix !" : "✗ Pas optimal"}
          </p>
          <p className="text-[#a3b8a8] leading-relaxed">{feedbackNote}</p>
        </div>
      )}

      <p className="text-[10px] font-mono text-[#3d5c45]">{playerName}</p>
    </div>
  )
}

// ─── Event Panel ──────────────────────────────────────────────────────────────

const ACTION_STYLES = [
  { normal: "border-[#60a5fa]/30 bg-[#60a5fa]/5 hover:bg-[#60a5fa]/10", selected: "border-[#60a5fa] bg-[#60a5fa]/20 text-white" },
  { normal: "border-[#4ade80]/30 bg-[#4ade80]/5 hover:bg-[#4ade80]/10", selected: "border-[#4ade80] bg-[#4ade80]/20 text-white" },
  { normal: "border-[#facc15]/30 bg-[#facc15]/5 hover:bg-[#facc15]/10", selected: "border-[#facc15] bg-[#facc15]/20 text-white" },
  { normal: "border-[#f87171]/30 bg-[#f87171]/5 hover:bg-[#f87171]/10", selected: "border-[#f87171] bg-[#f87171]/20 text-white" },
]

const ISSUE_BADGE: Record<number, string> = { 1: "❄️ Froid", 2: "💧 Condensation", 3: "🔥 Incendie" }

function EventPanel({
  event, onSubmit, onClose, isMobileModal = false,
}: {
  event: NewEvent
  onSubmit: (actionId: string) => void
  onClose?: () => void
  isMobileModal?: boolean
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isPending,  setIsPending]  = useState(false)
  const issueType = parseIssueType(event.type)

  useEffect(() => {
    setSelectedId(null)
    setIsPending(false)
  }, [event.id])

  const handleSubmit = () => {
    if (!selectedId || isPending) return
    setIsPending(true)
    onSubmit(selectedId)
  }

  return (
    <div className="flex h-full flex-col rounded-2xl p-5 gap-4 bg-[#0d1f14] border border-[#1e3a28]">

      {/* Header */}
      <div className="flex items-start justify-between gap-3 shrink-0">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-mono text-[#3d5c45] uppercase tracking-widest">
              Événement {event.eventNumber}/{event.totalEvents}
            </span>
            {issueType && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1e3a28] border border-[#2e5a38] text-[#5a7a62]">
                {ISSUE_BADGE[issueType]}
              </span>
            )}
          </div>
          <h2 className="text-base sm:text-lg font-semibold text-white leading-snug">{event.title}</h2>
          <p className="mt-1 text-sm text-[#5a7a62]">{event.description}</p>
        </div>
        {isMobileModal && onClose && (
          <button
            onClick={onClose}
            className="shrink-0 text-xs px-3 py-2 rounded-lg bg-[#1e3a28] text-[#5a7a62] hover:text-white transition-colors"
          >
            Fermer
          </button>
        )}
      </div>

      {/* Choices */}
      <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
        {event.actions.map((action, i) => {
          const s = ACTION_STYLES[i % ACTION_STYLES.length]
          const isSelected = selectedId === action.id
          return (
            <button
              key={action.id}
              onClick={() => !isPending && setSelectedId(action.id)}
              disabled={isPending}
              className={`
                w-full text-left px-4 py-3 rounded-xl border text-sm font-medium text-[#a3b8a8]
                transition-all duration-150 hover:scale-[1.01] active:scale-[0.99]
                disabled:cursor-not-allowed disabled:opacity-60
                ${isSelected ? s.selected : s.normal}
              `}
            >
              <span className="font-mono text-[10px] mr-2 opacity-50">
                {String.fromCharCode(65 + i)}
              </span>
              {action.label}
            </button>
          )
        })}
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!selectedId || isPending}
        className="shrink-0 w-full py-3.5 rounded-xl bg-[#4ade80] text-[#0d1f14] font-bold text-sm
          hover:bg-[#22c55e] active:scale-[0.98] transition-all
          disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isPending ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"/>
            </svg>
            En attente…
          </>
        ) : "Valider mon choix"}
      </button>
    </div>
  )
}

function WaitingScreen({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-2xl bg-[#0d1f14] border border-[#1e3a28]">
      <div className="text-center space-y-3">
        <div className="w-6 h-6 border-2 border-[#4ade80] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-mono text-[#5a7a62]">{message}</p>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlayPage() {
  const params       = useParams()
  const searchParams = useSearchParams()

  const sessionId  = params.sessionId as string
  const playerName = searchParams.get("name")    || "Joueur"
  const profile    = (searchParams.get("profile") || "proprietaire") as BackProfile

  const { currentEvent, waiting, feedback, submitAction, gameStarted } = useQuiz(sessionId)

  const [score,       setScore]       = useState(0)
  const [carbon,      setCarbon]      = useState(0)
  const [issueStates, setIssueStates] = useState<Set<IssueType>>(new Set())

  const [feedbackCorrect, setFeedbackCorrect] = useState<boolean | null>(null)
  const [feedbackNote,    setFeedbackNote]    = useState<string | null>(null)

  const [isMobileEventOpen, setIsMobileEventOpen] = useState(false)

  // useRef — synchrone, jamais stale dans le useEffect feedback
  const lastEventRef = useRef<NewEvent | null>(null)

  // ── Algo issue states ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!feedback || !lastEventRef.current) return

    setScore(feedback.newScore)
    setFeedbackCorrect(feedback.isGoodMove)
    setFeedbackNote(feedback.educationalNote)

    const issueType = parseIssueType(lastEventRef.current.type)
    if (!issueType) return // question générale → pas d'impact visuel

    if (feedback.isGoodMove) {
      // Bonne réponse → retire le problème
      setIssueStates((prev) => {
        const next = new Set(prev)
        next.delete(issueType)
        return next
      })
    } else {
      // Mauvaise réponse → ajoute le problème
      setIssueStates((prev) => new Set(prev).add(issueType))
    }
  }, [feedback])

  const handleSubmit = useCallback((actionId: string) => {
    lastEventRef.current = currentEvent  // synchrone — capturé avant submitAction
    submitAction(actionId)
  }, [currentEvent, submitAction])

  if (!gameStarted) {
    return (
      <main className="min-h-screen bg-[#0a1a0f] text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-[#4ade80] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[#4ade80] font-mono text-sm">En attente du lancement…</p>
          <p className="text-[#2e4a35] text-xs">{playerName}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#0a1a0f] text-white font-sans flex flex-col">

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-[#1e3a28] bg-[#0d1f14] shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[#4ade80]">🌿</span>
          <span className="font-mono text-xs text-[#3d5c45] uppercase tracking-widest hidden sm:block">Jeux'Rénov</span>
          <span className="font-mono text-xs text-[#2e4a35]">· {sessionId}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full border border-[#1e3a28] text-[#3d5c45] font-mono">
            {playerName}
          </span>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full border"
            style={{ color: scoreToColor(score), borderColor: scoreToColor(score) + "40" }}
          >
            {score} pts
          </span>
        </div>
      </header>

      {/* ── Mobile (< lg) ── */}
      <div className="flex-1 flex flex-col lg:hidden overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <HousePanel
            profile={profile} playerName={playerName}
            score={score} carbon={carbon}
            issueStates={issueStates}
            feedbackCorrect={feedbackCorrect}
            feedbackNote={feedbackNote}
          />
        </div>
        <div className="p-4 shrink-0 border-t border-[#1e3a28]">
          <button
            onClick={() => setIsMobileEventOpen(true)}
            className="w-full py-4 rounded-xl bg-[#4ade80] text-[#0d1f14] font-bold text-sm
              hover:bg-[#22c55e] active:scale-[0.98] transition-all"
          >
            {currentEvent
              ? `Répondre · événement ${currentEvent.eventNumber}/${currentEvent.totalEvents}`
              : "Répondre à l'événement"}
          </button>
        </div>
      </div>

      {/* Modal mobile */}
      {isMobileEventOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" style={{ background: "rgba(0,0,0,0.85)" }}>
          <div className="flex h-full items-end">
            <div className="h-[92dvh] w-full rounded-t-3xl p-3 bg-[#0a1a0f]">
              {currentEvent ? (
                <EventPanel
                  event={currentEvent}
                  onSubmit={(id) => { handleSubmit(id); setIsMobileEventOpen(false) }}
                  onClose={() => setIsMobileEventOpen(false)}
                  isMobileModal
                />
              ) : (
                <WaitingScreen message={waiting?.message ?? "En attente d'un événement…"} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Desktop (≥ lg) ── */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        <div className="w-1/2 border-r border-[#1e3a28] overflow-y-auto">
          <HousePanel
            profile={profile} playerName={playerName}
            score={score} carbon={carbon}
            issueStates={issueStates}
            feedbackCorrect={feedbackCorrect}
            feedbackNote={feedbackNote}
          />
        </div>
        <div className="w-1/2 p-5 overflow-y-auto">
          {currentEvent ? (
            <EventPanel event={currentEvent} onSubmit={handleSubmit} />
          ) : (
            <WaitingScreen message={waiting?.message ?? "En attente d'un événement…"} />
          )}
        </div>
      </div>

    </main>
  )
}
