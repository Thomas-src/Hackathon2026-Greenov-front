"use client"

import {useCallback, useEffect, useRef, useState} from "react"
import {useParams, useRouter, useSearchParams} from "next/navigation"
import {useQuiz} from "@/hooks/useQuiz"
import type {NewEvent} from "@/back/types/socket.t"
import {useQuizContext} from "@/app/providers/QuizProvider";

// ─── Types ────────────────────────────────────────────────────────────────────

type IssueType = 1 | 2 | 3
type BackProfile = "proprietaire" | "locataire" | "entreprise"

// ─── GIF mapping ──────────────────────────────────────────────────────────────

const PROFILE_TO_BASE: Record<BackProfile, string> = {
    proprietaire: "house",
    locataire: "flat",
    entreprise: "company",
}

const PROFILE_TO_SUFFIX: Record<BackProfile, string> = {
    proprietaire: "House",
    locataire: "Flat",
    entreprise: "Company",
}

const STATE_GIF: Record<number, { folder: string; prefix: string }> = {
    0: {folder: "houses", prefix: ""},
    1: {folder: "snow", prefix: "snow"},
    2: {folder: "wet", prefix: "wet"},
    3: {folder: "fire", prefix: "fire"},
    4: {folder: "snowWet", prefix: "snowWet"},
    5: {folder: "wetFire", prefix: "wetFire"},
    6: {folder: "snowFire", prefix: "snowFire"},
    7: {folder: "snowWetFire", prefix: "snowWetFire"},
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
    const h1 = issues.has(1), h2 = issues.has(2), h3 = issues.has(3)
    if (!h1 && !h2 && !h3) return 0
    if (h1 && !h2 && !h3) return 1
    if (!h1 && h2 && !h3) return 2
    if (!h1 && !h2 && h3) return 3
    if (h1 && h2 && !h3) return 4
    if (!h1 && h2 && h3) return 5
    if (h1 && !h2 && h3) return 6
    return 7
}

function getBuildingGif(profile: BackProfile, stateId: number): string {
    const {folder, prefix} = STATE_GIF[stateId]
    const filename = prefix === ""
        ? PROFILE_TO_BASE[profile]
        : `${prefix}${PROFILE_TO_SUFFIX[profile]}`
    return `/${folder}/${filename}.gif`
}

function parseIssueType(raw: string): IssueType | null {
    const n = raw.toLowerCase().trim()
    if (n === "cold") return 1
    if (n === "humidity") return 2
    if (n === "dry") return 3
    return null
}

function scoreToColor(score: number): string {
    if (score >= 80) return "#4ade80"
    if (score >= 60) return "#a3e635"
    if (score >= 40) return "#facc15"
    if (score >= 20) return "#fb923c"
    return "#f87171"
}

// ─── Juice: global keyframes ──────────────────────────────────────────────────

function GlobalStyles() {
    return (
        <style>{`
      @keyframes flashGreen {
        0%   { opacity: 0; }
        20%  { opacity: 1; }
        100% { opacity: 0; }
      }
      @keyframes flashRed {
        0%   { opacity: 0; }
        15%  { opacity: 1; }
        35%  { opacity: 0.5; }
        50%  { opacity: 1; }
        100% { opacity: 0; }
      }
      @keyframes floatUp {
        0%   { opacity: 0;   transform: translateX(-50%) translateY(0)     scale(0.6); }
        15%  { opacity: 1;   transform: translateX(-50%) translateY(-12px)  scale(1.25); }
        65%  { opacity: 1;   transform: translateX(-50%) translateY(-55px)  scale(1); }
        100% { opacity: 0;   transform: translateX(-50%) translateY(-95px)  scale(0.85); }
      }
      @keyframes shake {
        0%   { transform: translateX(0); }
        15%  { transform: translateX(-8px) rotate(-1deg); }
        30%  { transform: translateX(8px)  rotate(1deg); }
        50%  { transform: translateX(-5px) rotate(-0.5deg); }
        70%  { transform: translateX(5px)  rotate(0.5deg); }
        100% { transform: translateX(0); }
      }
      @keyframes popIn {
        0%   { transform: scale(0.82); opacity: 0.4; }
        60%  { transform: scale(1.08); }
        100% { transform: scale(1);    opacity: 1; }
      }
      @keyframes pulseGreen {
        0%   { box-shadow: 0 0 0 0    rgba(74,222,128,0.75); }
        60%  { box-shadow: 0 0 0 12px rgba(74,222,128,0); }
        100% { box-shadow: 0 0 0 0    rgba(74,222,128,0); }
      }
      @keyframes pulseRed {
        0%   { box-shadow: 0 0 0 0    rgba(248,113,113,0.75); }
        60%  { box-shadow: 0 0 0 12px rgba(248,113,113,0); }
        100% { box-shadow: 0 0 0 0    rgba(248,113,113,0); }
      }
      .shake-anim { animation: shake 0.55s ease-out; }
    `}</style>
    )
}

// ─── Juice: screen flash ──────────────────────────────────────────────────────

function FeedbackFlash({feedback}: { feedback: ReturnType<typeof useQuiz>["feedback"] }) {
    const [visible, setVisible] = useState(false)
    const [good, setGood] = useState(false)
    const prevKey = useRef<string | null>(null)

    useEffect(() => {
        if (!feedback) return
        const key = `${feedback.newScore}-${feedback.isGoodMove}`
        if (key === prevKey.current) return
        prevKey.current = key
        setGood(feedback.isGoodMove)
        setVisible(true)
        const t = setTimeout(() => setVisible(false), 650)
        return () => clearTimeout(t)
    }, [feedback])

    if (!visible) return null
    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 100, pointerEvents: "none",
            background: good ? "rgba(74,222,128,0.15)" : "rgba(248,113,113,0.18)",
            animation: good ? "flashGreen 0.65s ease-out" : "flashRed 0.65s ease-out",
        }}/>
    )
}

// ─── Juice: floating score delta ──────────────────────────────────────────────

function ScorePopper({feedback}: { feedback: ReturnType<typeof useQuiz>["feedback"] }) {
    const [items, setItems] = useState<{ id: number; delta: number; good: boolean }[]>([])
    const prevKey = useRef<string | null>(null)
    const prevScore = useRef<number>(0)
    const counter = useRef(0)

    useEffect(() => {
        if (!feedback) return
        const key = `${feedback.newScore}-${feedback.isGoodMove}`
        if (key === prevKey.current) return
        prevKey.current = key

        const delta = feedback.newScore - prevScore.current
        prevScore.current = feedback.newScore

        const id = counter.current++
        setItems(prev => [...prev, {id, delta, good: feedback.isGoodMove}])
        const t = setTimeout(() => setItems(prev => prev.filter(i => i.id !== id)), 1300)
        return () => clearTimeout(t)
    }, [feedback])

    return (
        <>
            {items.map(item => (
                <div key={item.id} style={{
                    position: "fixed", top: "38%", left: "50%",
                    zIndex: 200, pointerEvents: "none",
                    fontSize: "2.8rem", fontWeight: 900, letterSpacing: "-1px",
                    color: item.good ? "#4ade80" : "#f87171",
                    textShadow: item.good
                        ? "0 0 24px rgba(74,222,128,0.55)"
                        : "0 0 24px rgba(248,113,113,0.55)",
                    animation: "floatUp 1.3s ease-out forwards",
                }}>
                    {item.delta > 0 ? `+${item.delta}` : item.delta === 0 ? "±0" : item.delta}
                </div>
            ))}
        </>
    )
}

// ─── House Panel ──────────────────────────────────────────────────────────────

function HousePanel({
                        profile, playerName, score, carbon, issueStates, feedbackCorrect, feedbackNote, feedback,
                    }: {
    profile: BackProfile
    playerName: string
    score: number
    carbon: number
    issueStates: Set<IssueType>
    feedbackCorrect: boolean | null
    feedbackNote: string | null
    feedback: ReturnType<typeof useQuiz>["feedback"]
}) {
    const stateId = getStateId(issueStates)
    const gifSrc = getBuildingGif(profile, stateId)
    const color = scoreToColor(score)

    const [shaking, setShaking] = useState(false)
    const prevKey = useRef<string | null>(null)

    useEffect(() => {
        if (!feedback) return
        const key = `${feedback.newScore}-${feedback.isGoodMove}`
        if (key === prevKey.current) return
        prevKey.current = key
        if (!feedback.isGoodMove) {
            setShaking(true)
            const t = setTimeout(() => setShaking(false), 600)
            return () => clearTimeout(t)
        }
    }, [feedback])

    return (
        <div
            className={`flex flex-col items-center justify-center gap-5 w-full h-full py-6 px-4 ${shaking ? "shake-anim" : ""}`}>

            {/* Score / CO₂ */}
            <div className="flex gap-3 w-full max-w-xs">
                <div className="flex-1 bg-[#0d1f14] border border-[#1e3a28] rounded-xl p-3 text-center">
                    <p className="text-[10px] font-mono text-[#3d5c45] uppercase mb-1">Score</p>
                    <p
                        className="text-2xl font-bold transition-colors duration-500"
                        style={{
                            color,
                            animation: feedback ? "popIn 0.3s ease-out" : "none",
                        }}
                    >
                        {score}
                    </p>
                </div>
                <div className="flex-1 bg-[#0d1f14] border border-[#1e3a28] rounded-xl p-3 text-center">
                    <p className="text-[10px] font-mono text-[#3d5c45] uppercase mb-1">CO₂</p>
                    <p className="text-2xl font-bold text-[#fb923c]">{carbon}</p>
                    <p className="text-[9px] text-[#3d5c45]">kg/an</p>
                </div>
            </div>

            {/* GIF */}
            <div className="relative flex items-center justify-center">
                <div
                    className="absolute inset-0 rounded-full blur-3xl opacity-20 transition-all duration-1000"
                    style={{background: stateId === 0 ? "#4ade80" : "#f87171"}}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    key={gifSrc}
                    src={gifSrc}
                    alt={STATE_LABEL[stateId]}
                    className="relative z-10 w-36 sm:w-44 md:w-52 drop-shadow-2xl"
                    style={{
                        imageRendering: "pixelated",
                        transition: "filter 0.4s ease",
                        filter: feedback
                            ? feedback.isGoodMove
                                ? "drop-shadow(0 0 16px rgba(74,222,128,0.75))"
                                : "drop-shadow(0 0 16px rgba(248,113,113,0.75))"
                            : "none",
                    }}
                />
            </div>

            {/* État */}
            <div className="flex flex-col items-center gap-2">
                <p className="text-xs font-semibold" style={{color: stateId === 0 ? "#4ade80" : "#f87171"}}>
                    {STATE_LABEL[stateId]}
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                    {issueStates.size === 0 && (
                        <span
                            className="text-[10px] px-2 py-1 rounded-full bg-[#4ade80]/10 border border-[#4ade80]/30 text-[#4ade80]">
              Aucun problème actif
            </span>
                    )}
                    {issueStates.has(1) && (
                        <span
                            className="text-[10px] px-2 py-1 rounded-full bg-[#60a5fa]/10 border border-[#60a5fa]/30 text-[#60a5fa]">❄️ Froid</span>
                    )}
                    {issueStates.has(2) && (
                        <span
                            className="text-[10px] px-2 py-1 rounded-full bg-[#818cf8]/10 border border-[#818cf8]/30 text-[#818cf8]">💧 Condensation</span>
                    )}
                    {issueStates.has(3) && (
                        <span
                            className="text-[10px] px-2 py-1 rounded-full bg-[#f87171]/10 border border-[#f87171]/30 text-[#f87171]">🔥 Incendie</span>
                    )}
                </div>
            </div>

            {/* Feedback note */}
            {feedbackCorrect !== null && feedbackNote && (
                <div
                    className="w-full max-w-xs rounded-xl p-3 border text-xs"
                    style={{
                        background: feedbackCorrect ? "rgba(74,222,128,0.05)" : "rgba(248,113,113,0.05)",
                        borderColor: feedbackCorrect ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)",
                        animation: "popIn 0.3s ease-out",
                    }}
                >
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
    {
        normal: "border-[#60a5fa]/30 bg-[#60a5fa]/5 hover:bg-[#60a5fa]/10",
        selected: "border-[#60a5fa] bg-[#60a5fa]/20 text-white"
    },
    {
        normal: "border-[#4ade80]/30 bg-[#4ade80]/5 hover:bg-[#4ade80]/10",
        selected: "border-[#4ade80] bg-[#4ade80]/20 text-white"
    },
    {
        normal: "border-[#facc15]/30 bg-[#facc15]/5 hover:bg-[#facc15]/10",
        selected: "border-[#facc15] bg-[#facc15]/20 text-white"
    },
    {
        normal: "border-[#f87171]/30 bg-[#f87171]/5 hover:bg-[#f87171]/10",
        selected: "border-[#f87171] bg-[#f87171]/20 text-white"
    },
]

const ISSUE_BADGE: Record<number, string> = {1: "❄️ Froid", 2: "💧 Condensation", 3: "🔥 Incendie"}

function EventPanel({
                        event, onSubmit, onClose, isMobileModal = false, lastFeedback,
                    }: {
    event: NewEvent
    onSubmit: (actionId: string) => void
    onClose?: () => void
    isMobileModal?: boolean
    lastFeedback: ReturnType<typeof useQuiz>["feedback"]
}) {
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)
    const [submittedId, setSubmittedId] = useState<string | null>(null)
    const issueType = parseIssueType(event.type)

    useEffect(() => {
        setSelectedId(null)
        setIsPending(false)
        setSubmittedId(null)
    }, [event.id])

    useEffect(() => {
        if (lastFeedback && isPending && selectedId) {
            setSubmittedId(selectedId)
        }
    }, [lastFeedback])

    const handleSubmit = () => {
        if (!selectedId || isPending) return
        setIsPending(true)
        onSubmit(selectedId)
    }

    const getPulseStyle = (actionId: string): React.CSSProperties => {
        if (submittedId !== actionId || !lastFeedback) return {}
        return {
            animation: lastFeedback.isGoodMove
                ? "pulseGreen 0.7s ease-out"
                : "pulseRed 0.7s ease-out",
        }
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
                            <span
                                className="text-[10px] px-2 py-0.5 rounded-full bg-[#1e3a28] border border-[#2e5a38] text-[#5a7a62]">
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
                    const isSubmitted = submittedId === action.id
                    return (
                        <button
                            key={action.id}
                            onClick={() => {
                                if (!isPending) setSelectedId(action.id)
                            }}
                            disabled={isPending}
                            className={`
                w-full text-left px-4 py-3 rounded-xl border text-sm font-medium text-[#a3b8a8]
                transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-60
                ${!isPending ? "hover:scale-[1.01] active:scale-[0.99]" : ""}
                ${isSelected ? s.selected : s.normal}
              `}
                            style={{
                                animation: isSelected && !isPending
                                    ? "popIn 0.2s ease-out"
                                    : isSubmitted
                                        ? getPulseStyle(action.id).animation as string
                                        : undefined,
                            }}
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
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                    strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor"
                                  d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"/>
                        </svg>
                        En attente…
                    </>
                ) : "Valider mon choix"}
            </button>
        </div>
    )
}

function WaitingScreen({message}: { message: string }) {
    return (
        <div className="flex h-full items-center justify-center rounded-2xl bg-[#0d1f14] border border-[#1e3a28]">
            <div className="text-center space-y-3">
                <div
                    className="w-6 h-6 border-2 border-[#4ade80] border-t-transparent rounded-full animate-spin mx-auto"/>
                <p className="text-sm font-mono text-[#5a7a62]">{message}</p>
            </div>
        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlayPage() {
    const params = useParams()
    const searchParams = useSearchParams()

    const sessionId = params.sessionId as string
    const playerName = searchParams.get("name") || "Joueur"
    const profile = (searchParams.get("profile") || "proprietaire") as BackProfile
    const router = useRouter();

    const {currentEvent, waiting, feedback, submitAction, gameStarted} = useQuizContext()

    const [score, setScore] = useState(0)
    const [carbon, setCarbon] = useState(0)
    const [issueStates, setIssueStates] = useState<Set<IssueType>>(new Set())

    const [feedbackCorrect, setFeedbackCorrect] = useState<boolean | null>(null)
    const [feedbackNote, setFeedbackNote] = useState<string | null>(null)

    const [isMobileEventOpen, setIsMobileEventOpen] = useState(false)

    const lastEventRef = useRef<NewEvent | null>(null)

    useEffect(() => {
        if (!feedback || !lastEventRef.current) return

        setScore(feedback.newScore)
        setFeedbackCorrect(feedback.isGoodMove)
        setFeedbackNote(feedback.educationalNote)

        const issueType = parseIssueType(lastEventRef.current.type)
        if (!issueType) return

        if (feedback.isGoodMove) {
            setIssueStates(prev => {
                const next = new Set(prev)
                next.delete(issueType)
                return next
            })
        } else {
            setIssueStates(prev => new Set(prev).add(issueType))
        }
    }, [feedback])

    const {debrief} = useQuizContext()

    useEffect(() => {
        if (debrief) {
            router.push(`/debrief/${sessionId}?name=${playerName}&profile=${profile}`)
        }
    }, [debrief])

    const handleSubmit = useCallback((actionId: string) => {
        lastEventRef.current = currentEvent
        submitAction(actionId)
    }, [currentEvent, submitAction])

    if (!gameStarted) {
        return (
            <main className="min-h-screen bg-[#0a1a0f] text-white flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div
                        className="w-8 h-8 border-2 border-[#4ade80] border-t-transparent rounded-full animate-spin mx-auto"/>
                    <p className="text-[#4ade80] font-mono text-sm">En attente du lancement…</p>
                    <p className="text-[#2e4a35] text-xs">{playerName}</p>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-[#0a1a0f] text-white font-sans flex flex-col">
            <GlobalStyles/>
            <FeedbackFlash feedback={feedback}/>
            <ScorePopper feedback={feedback}/>

            {/* Header */}
            <header
                className="flex items-center justify-between px-4 py-3 border-b border-[#1e3a28] bg-[#0d1f14] shrink-0">
                <div className="flex items-center gap-2">
                    <span className="text-[#4ade80]">🌿</span>
                    <span
                        className="font-mono text-xs text-[#3d5c45] uppercase tracking-widest hidden sm:block">Jeux'Rénov</span>
                    <span className="font-mono text-xs text-[#2e4a35]">· {sessionId}</span>
                </div>
                <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full border border-[#1e3a28] text-[#3d5c45] font-mono">
            {playerName}
          </span>
                    <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full border"
                        style={{
                            color: scoreToColor(score),
                            borderColor: scoreToColor(score) + "40",
                            animation: feedback ? "popIn 0.3s ease-out" : "none",
                        }}
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
                        feedback={feedback}
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
                <div className="fixed inset-0 z-50 lg:hidden" style={{background: "rgba(0,0,0,0.85)"}}>
                    <div className="flex h-full items-end">
                        <div className="h-[92dvh] w-full rounded-t-3xl p-3 bg-[#0a1a0f]">
                            {currentEvent ? (
                                <EventPanel
                                    event={currentEvent}
                                    onSubmit={(id) => {
                                        handleSubmit(id);
                                        setIsMobileEventOpen(false)
                                    }}
                                    onClose={() => setIsMobileEventOpen(false)}
                                    isMobileModal
                                    lastFeedback={feedback}
                                />
                            ) : (
                                <WaitingScreen message={waiting?.message ?? "En attente d'un événement…"}/>
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
                        feedback={feedback}
                    />
                </div>
                <div className="w-1/2 p-5 overflow-y-auto">
                    {currentEvent ? (
                        <EventPanel event={currentEvent} onSubmit={handleSubmit} lastFeedback={feedback}/>
                    ) : (
                        <WaitingScreen message={waiting?.message ?? "En attente d'un événement…"}/>
                    )}
                </div>
            </div>

        </main>
    )
}