"use client";

import { useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

type Profile = "house" | "flat" | "company";
const houseByProfile: Record<Profile, string> = { house: "/houses/house.gif", flat: "/houses/flat.gif", company: "/houses/company.gif" };
type Choice = { id: string; label: string };
type Question = { id: string; text: string; multiple: boolean; choices: Choice[] };
type PlayerState = { name: string; profile: Profile; score: number; co2: number; comfort: number; insulation: number };

function StatBar({ label, value }: { label: string; value: number }) {
  return (
      <div>
        <div className="mb-1 flex items-center justify-between text-sm" style={{ color: "rgba(232,245,232,0.6)" }}>
          <span>{label}</span>
          <span className="font-semibold" style={{ color: "var(--green)" }}>{value}%</span>
        </div>
        <div className="h-2 rounded-full" style={{ background: "rgba(76,194,74,0.15)" }}>
          <div className="h-2 rounded-full transition-all" style={{ width: `${value}%`, background: "var(--green)" }} />
        </div>
      </div>
  );
}

function HousePanel({ player }: { player: PlayerState }) {
  const houseStateLabel = useMemo(() => {
    const average = (player.comfort + player.insulation + (100 - player.co2)) / 3;
    if (average >= 75) return "Maison en bon état ✅";
    if (average >= 45) return "Maison en évolution 🔧";
    return "Maison à améliorer ⚠️";
  }, [player]);

  return (
      <div className="flex h-full flex-col rounded-2xl p-5 shadow-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(232,245,232,0.4)" }}>Ton habitation</p>
          <h2 className="text-xl font-black mt-1">{player.name}</h2>
          <p className="text-sm mt-1" style={{ color: "rgba(232,245,232,0.5)" }}>{houseStateLabel}</p>
        </div>
        <div className="flex flex-1 items-center justify-center py-6">
          <div className="flex flex-col items-center">
            <img src={houseByProfile[player.profile]} alt="Maison du joueur" className="image-pixel w-28 sm:w-36 md:w-44" />
            <p className="mt-3 rounded-full px-4 py-1 text-sm font-bold" style={{ background: "rgba(168,224,99,0.15)", color: "var(--accent)", border: "1px solid rgba(168,224,99,0.3)" }}>
              Score : {player.score}/100
            </p>
          </div>
        </div>
        <div className="space-y-4">
          <StatBar label="Isolation" value={player.insulation} />
          <StatBar label="Confort" value={player.comfort} />
          <StatBar label="Empreinte carbone" value={player.co2} />
        </div>
      </div>
  );
}

function QuestionContent({ question, selectedChoices, feedback, onToggleChoice, onSubmit, onClose, isMobileModal = false }: {
  question: Question; selectedChoices: string[]; feedback: string | null;
  onToggleChoice: (id: string) => void; onSubmit: () => void; onClose?: () => void; isMobileModal?: boolean;
}) {
  const getColorClasses = (index: number, isSelected: boolean) => {
    const base = [
      { normal: "bg-blue-500/20 border-blue-400 text-white",       selected: "bg-blue-500 border-blue-300 text-white" },
      { normal: "bg-emerald-500/20 border-emerald-400 text-white",  selected: "bg-emerald-500 border-emerald-300 text-black" },
      { normal: "bg-yellow-500/20 border-yellow-400 text-white",    selected: "bg-yellow-400 border-yellow-300 text-black" },
      { normal: "bg-orange-500/20 border-orange-400 text-white",    selected: "bg-orange-500 border-orange-300 text-black" },
    ];
    const color = base[index % base.length];
    return isSelected ? color.selected : color.normal;
  };

  return (
      <div className="flex h-full min-h-0 flex-col rounded-2xl p-5 shadow-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex shrink-0 items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(232,245,232,0.4)" }}>Question en cours</p>
            <h2 className="mt-2 text-lg font-semibold leading-7 sm:text-xl">{question.text}</h2>
            <p className="mt-2 text-sm" style={{ color: "rgba(232,245,232,0.4)" }}>
              {question.multiple ? "Plusieurs réponses possibles" : "Une seule réponse possible"}
            </p>
          </div>
          {isMobileModal && onClose && (
              <button onClick={onClose} className="shrink-0 rounded-lg px-3 py-2 text-sm" style={{ background: "rgba(232,245,232,0.1)" }}>
                Fermer
              </button>
          )}
        </div>

        {feedback && (
            <div className="mt-4 shrink-0 rounded-xl p-4 text-sm sm:text-base" style={{ background: "rgba(76,194,74,0.1)", border: "1px solid var(--border-strong)", color: "var(--green)" }}>
              {feedback}
            </div>
        )}

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="space-y-3">
            {question.choices.map((choice, index) => (
                <button key={choice.id} onClick={() => onToggleChoice(choice.id)}
                        className={`w-full rounded-xl border p-4 text-left font-medium transition cursor-pointer hover:scale-[1.01] active:scale-[0.99] ${getColorClasses(index, selectedChoices.includes(choice.id))}`}>
                  <span className="flex items-center gap-2 text-sm sm:text-base">{choice.label}</span>
                </button>
            ))}
          </div>
        </div>

        <div className="mt-4 shrink-0">
          <button onClick={onSubmit} disabled={selectedChoices.length === 0} className="cool-btn"
                  style={selectedChoices.length === 0 ? { opacity: 0.4, cursor: "not-allowed" } : {}}>
            Valider ma réponse
          </button>
        </div>
      </div>
  );
}

export default function PlayPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const sessionId = params.id as string;
  const playerName = searchParams.get("name") || "Joueur";

  const [player] = useState<PlayerState>({ name: playerName, profile: "house", score: 64, co2: 38, comfort: 72, insulation: 55 });
  const [question] = useState<Question>({
    id: "q1",
    text: "Quelle action permet de réduire durablement la consommation énergétique d'un logement ?",
    multiple: false,
    choices: [
      { id: "a", label: "Changer uniquement le thermostat" },
      { id: "b", label: "Réduire les pertes thermiques avant de changer le système" },
      { id: "c", label: "Ajouter des panneaux solaires sans autre réflexion" },
      { id: "d", label: "Augmenter le chauffage pour améliorer le confort" },
    ],
  });

  const [selectedChoices, setSelectedChoices] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isQuestionOpen, setIsQuestionOpen] = useState(false);

  const handleToggleChoice = (choiceId: string) => {
    if (question.multiple) {
      setSelectedChoices(prev => prev.includes(choiceId) ? prev.filter(id => id !== choiceId) : [...prev, choiceId]);
    } else {
      setSelectedChoices([choiceId]);
    }
  };

  const handleSubmit = () => {
    if (selectedChoices.length === 0) return;
    setFeedback(selectedChoices.includes("b")
        ? "Bonne décision : tu réduis d'abord les pertes."
        : "Cette réponse n'est pas optimale pour atteindre une trajectoire durable."
    );
  };

  return (
      <main className="min-h-screen p-3 text-white sm:p-4" style={{ background: "var(--background)" }}>
        <div className="mx-auto max-w-7xl">
          <div className="flex min-h-[calc(100vh-24px)] flex-col gap-4 lg:hidden">
            <section className="flex-1"><HousePanel player={player} /></section>
            <button onClick={() => setIsQuestionOpen(true)} className="cool-btn">Répondre à la question</button>
          </div>

          {isQuestionOpen && (
              <div className="fixed inset-0 z-50 lg:hidden" style={{ background: "rgba(0,0,0,0.8)" }}>
                <div className="flex h-full items-end">
                  <div className="h-[92dvh] w-full rounded-t-3xl p-3" style={{ background: "var(--background)" }}>
                    <QuestionContent question={question} selectedChoices={selectedChoices} feedback={feedback}
                                     onToggleChoice={handleToggleChoice} onSubmit={handleSubmit}
                                     onClose={() => setIsQuestionOpen(false)} isMobileModal />
                  </div>
                </div>
              </div>
          )}

          <div className="hidden min-h-[calc(100vh-32px)] gap-4 lg:grid lg:grid-cols-2">
            <section className="min-h-0"><HousePanel player={player} /></section>
            <section className="min-h-0">
              <QuestionContent question={question} selectedChoices={selectedChoices} feedback={feedback}
                               onToggleChoice={handleToggleChoice} onSubmit={handleSubmit} />
            </section>
          </div>
        </div>
      </main>
  );
}