"use client";

import {useEffect, useMemo, useState} from "react";
import {useParams, useSearchParams} from "next/navigation";
import type {ActionFeedback, NewEvent, Profile} from "@/back/types/socket.t";
import {useQuiz} from "@/hooks/useQuiz";

const houseByProfile: Record<Profile, string> = {
    proprietaire: "/houses/house.gif",
    locataire: "/houses/flat.gif",
    entreprise: "/houses/company.gif",
};

// ── StatBar ───────────────────────────────────────────────

function StatBar({label, value}: { label: string; value: number }) {
    return (
        <div>
            <div className="mb-1 flex items-center justify-between text-sm"
                 style={{color: "rgba(232,245,232,0.6)"}}>
                <span>{label}</span>
                <span className="font-semibold" style={{color: "var(--green)"}}>{value}</span>
            </div>
            <div className="h-2 rounded-full" style={{background: "rgba(76,194,74,0.15)"}}>
                <div className="h-2 rounded-full transition-all"
                     style={{width: `${Math.min(value, 100)}%`, background: "var(--green)"}}/>
            </div>
        </div>
    );
}

// ── HousePanel ────────────────────────────────────────────

type HousePanelProps = {
    name: string;
    profile: Profile;
    score: number;
    feedback: ActionFeedback | null;
};

function HousePanel({name, profile, score, feedback}: HousePanelProps) {
    const stateLabel = useMemo(() => {
        if (score >= 75) return "Maison en bon état ✅";
        if (score >= 45) return "Maison en évolution 🔧";
        return "Maison à améliorer ⚠️";
    }, [score]);

    return (
        <div className="flex h-full flex-col rounded-2xl p-5 shadow-lg"
             style={{background: "var(--card)", border: "1px solid var(--border)"}}>
            <div>
                <p className="text-xs font-semibold uppercase tracking-wider"
                   style={{color: "rgba(232,245,232,0.4)"}}>Ton habitation</p>
                <h2 className="text-xl font-black mt-1">{name}</h2>
                <p className="text-sm mt-1" style={{color: "rgba(232,245,232,0.5)"}}>{stateLabel}</p>
            </div>

            <div className="flex flex-1 items-center justify-center py-6">
                <div className="flex flex-col items-center">
                    <img src={houseByProfile[profile]} alt="Maison du joueur"
                         className="image-pixel w-28 sm:w-36 md:w-44"/>
                    <p className="mt-3 rounded-full px-4 py-1 text-sm font-bold" style={{
                        background: "rgba(168,224,99,0.15)",
                        color: "var(--accent)",
                        border: "1px solid rgba(168,224,99,0.3)",
                    }}>
                        Score : {score}
                    </p>
                </div>
            </div>

            {feedback && (
                <div className="mb-4 rounded-xl p-3 text-sm"
                     style={{
                         background: feedback.isGoodMove
                             ? "rgba(76,194,74,0.1)"
                             : "rgba(255,100,100,0.1)",
                         border: `1px solid ${feedback.isGoodMove
                             ? "rgba(76,194,74,0.3)"
                             : "rgba(255,100,100,0.3)"}`,
                         color: "rgba(232,245,232,0.8)",
                     }}>
                    <p className="font-semibold mb-1">
                        {feedback.isGoodMove ? "✅ Bon choix !" : "⚠️ Pas optimal"}
                    </p>
                    <p>{feedback.educationalNote}</p>
                </div>
            )}

            <div className="space-y-4">
                <StatBar label="Score" value={score}/>
            </div>
        </div>
    );
}

// ── EventContent ──────────────────────────────────────────

const ACTION_COLORS = [
    {normal: "bg-blue-500/20 border-blue-400", selected: "bg-blue-500 border-blue-300 text-black"},
    {normal: "bg-emerald-500/20 border-emerald-400", selected: "bg-emerald-500 border-emerald-300 text-black"},
    {normal: "bg-yellow-500/20 border-yellow-400", selected: "bg-yellow-400 border-yellow-300 text-black"},
    {normal: "bg-orange-500/20 border-orange-400", selected: "bg-orange-500 border-orange-300 text-black"},
];

function EventContent({
                          event,
                          onSubmit,
                          onClose,
                          isMobileModal = false,
                      }: {
    event: NewEvent;
    onSubmit: (actionId: string) => void;
    onClose?: () => void;
    isMobileModal?: boolean;
}) {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isPending, setIsPending] = useState(false);

    useEffect(() => {
        console.log("[EventContent] event.id changed:", event.id, "→ reset pending");
        setSelectedId(null);
        setIsPending(false);
    }, [event.id]);

    const handleSubmit = async () => {
        if (!selectedId || isPending) return;
        setIsPending(true);
        onSubmit(selectedId);
    };

    return (
        <div className="flex h-full min-h-0 flex-col rounded-2xl p-5 shadow-lg"
             style={{background: "var(--card)", border: "1px solid var(--border)"}}>

            <div className="flex shrink-0 items-start justify-between gap-4">
                <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wider"
                       style={{color: "rgba(232,245,232,0.4)"}}>
                        Événement {event.eventNumber}/{event.totalEvents}
                    </p>
                    <h2 className="mt-2 text-lg font-semibold leading-7 sm:text-xl">{event.title}</h2>
                    <p className="mt-1 text-sm" style={{color: "rgba(232,245,232,0.55)"}}>{event.description}</p>
                </div>
                {isMobileModal && onClose && (
                    <button onClick={onClose} className="shrink-0 rounded-lg px-3 py-2 text-sm"
                            style={{background: "rgba(232,245,232,0.1)"}}>
                        Fermer
                    </button>
                )}
            </div>

            <div className="mt-5 min-h-0 flex-1 overflow-y-auto pr-1">
                <div className="space-y-3">
                    {event.actions.map((action, index) => {
                        const colors = ACTION_COLORS[index % ACTION_COLORS.length];
                        const isSelected = selectedId === action.id;
                        return (
                            <button
                                key={action.id}
                                onClick={() => !isPending && setSelectedId(action.id)}
                                disabled={isPending}
                                className={`w-full rounded-xl border p-4 text-left font-medium transition cursor-pointer
                                    hover:scale-[1.01] active:scale-[0.99] text-white
                                    ${isSelected ? colors.selected : colors.normal}
                                    ${isPending ? "opacity-60 cursor-not-allowed" : ""}`}
                            >
                                <span className="flex items-center gap-2 text-sm sm:text-base">
                                    {action.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="mt-4 shrink-0">
                <button
                    onClick={handleSubmit}
                    disabled={!selectedId || isPending}
                    className="cool-btn"
                    style={(!selectedId || isPending) ? {opacity: 0.4, cursor: "not-allowed"} : {}}
                >
                    {isPending ? "En attente…" : "Valider mon choix"}
                </button>
            </div>
        </div>
    );
}

// ── AnimatedEvent ─────────────────────────────────────────

function AnimatedEvent({
                           event,
                           onSubmit,
                           onClose,
                           isMobileModal,
                       }: {
    event: NewEvent | null;
    onSubmit: (actionId: string) => void;
    onClose?: () => void;
    isMobileModal?: boolean;
}) {
    const [displayed, setDisplayed] = useState<NewEvent | null>(event);
    const [visible, setVisible] = useState(!!event);

    useEffect(() => {
        if (!event) return;

        if (!displayed) {
            setDisplayed(event);
            setVisible(true);
            return;
        }

        if (event.id === displayed.id) return;

        setVisible(false);
        const swap = setTimeout(() => {
            setDisplayed(event);
            setVisible(true);
        }, 400);

        return () => clearTimeout(swap);
    }, [event?.id]);

    if (!displayed) {
        return (
            <div className="flex h-full items-center justify-center rounded-2xl"
                 style={{background: "var(--card)", border: "1px solid var(--border)"}}>
                <p className="text-sm" style={{color: "rgba(232,245,232,0.4)"}}>
                    En attente d'un événement…
                </p>
            </div>
        );
    }

    return (
        <div style={{
            transition: "opacity 0.35s ease, transform 0.35s ease",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(10px)",
            height: "100%",
        }}>
            <EventContent
                event={displayed}
                onSubmit={onSubmit}
                onClose={onClose}
                isMobileModal={isMobileModal}
            />
        </div>
    );
}

// ── PlayPage ──────────────────────────────────────────────

export default function PlayPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const sessionId = params.sessionId as string;
    const playerName = searchParams.get("name") || "Joueur";
    const playerProfile = (searchParams.get("profile") as Profile) || "proprietaire";

    const {currentEvent, submitAction, feedback} = useQuiz(sessionId);

    // Score local mis à jour via feedback
    const [score, setScore] = useState(0);
    useEffect(() => {
        if (feedback) setScore(feedback.newScore);
    }, [feedback]);

    const [isQuestionOpen, setIsQuestionOpen] = useState(false);

    return (
        <main className="min-h-screen p-3 text-white sm:p-4" style={{background: "var(--background)"}}>
            <div className="mx-auto max-w-7xl">

                {/* Mobile */}
                <div className="flex min-h-[calc(100vh-24px)] flex-col gap-4 lg:hidden">
                    <section className="flex-1">
                        <HousePanel
                            name={playerName}
                            profile={playerProfile}
                            score={score}
                            feedback={feedback}
                        />
                    </section>
                    <button onClick={() => setIsQuestionOpen(true)} className="cool-btn">
                        Répondre à l'événement
                    </button>
                </div>

                {isQuestionOpen && (
                    <div className="fixed inset-0 z-50 lg:hidden" style={{background: "rgba(0,0,0,0.8)"}}>
                        <div className="flex h-full items-end">
                            <div className="h-[92dvh] w-full rounded-t-3xl p-3"
                                 style={{background: "var(--background)"}}>
                                <AnimatedEvent
                                    event={currentEvent}
                                    onSubmit={submitAction}
                                    onClose={() => setIsQuestionOpen(false)}
                                    isMobileModal
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Desktop */}
                <div className="hidden min-h-[calc(100vh-32px)] gap-4 lg:grid lg:grid-cols-2">
                    <section className="min-h-0">
                        <HousePanel
                            name={playerName}
                            profile={playerProfile}
                            score={score}
                            feedback={feedback}
                        />
                    </section>
                    <section className="min-h-0">
                        <AnimatedEvent event={currentEvent} onSubmit={submitAction}/>
                    </section>
                </div>

            </div>
        </main>
    );
}