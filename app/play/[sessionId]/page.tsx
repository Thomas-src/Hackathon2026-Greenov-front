"use client";

import { useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

type Profile = "house" | "flat" | "company";

const houseByProfile: Record<Profile, string> = {
  house: "/houses/house.gif",
  flat: "/houses/flat.gif",
  company: "/houses/company.gif",
};

const colors = [
  "blue",
  "green",
  "pink",
  "orange"
];

type Choice = {
  id: string;
  label: string;
};

type Question = {
  id: string;
  text: string;
  multiple: boolean;
  choices: Choice[];
};

type PlayerState = {
  name: string;
  profile: Profile;
  score: number;
  co2: number;
  comfort: number;
  insulation: number;
};

function StatBar({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm text-zinc-300">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-zinc-700">
        <div
          className="h-2 rounded-full bg-emerald-500 transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function HousePanel({ player }: { player: PlayerState }) {
  const houseStateLabel = useMemo(() => {
    const average =
      (player.comfort + player.insulation + (100 - player.co2)) / 3;

    if (average >= 75) return "Maison en bon état";
    if (average >= 45) return "Maison en évolution";
    return "Maison à améliorer";
  }, [player]);

  return (
    <div className="flex h-full flex-col rounded-2xl bg-zinc-800 p-4 shadow-lg">
      <div>
        <p className="text-sm text-zinc-400">Ton habitation</p>
        <h2 className="text-xl font-bold">{player.name}</h2>
        <p className="text-sm text-zinc-400">{houseStateLabel}</p>
      </div>

      <div className="flex flex-1 items-center justify-center py-6">
        <div className="flex flex-col items-center">
          <img
            src={houseByProfile[player.profile]}
            alt="Maison du joueur"
            className="image-pixel w-28 sm:w-36 md:w-44"
          />
          <p className="mt-3 rounded-full bg-black/30 px-3 py-1 text-sm text-white">
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

function QuestionContent({
  question,
  selectedChoices,
  feedback,
  onToggleChoice,
  onSubmit,
  onClose,
  isMobileModal = false,
}: {
  question: Question;
  selectedChoices: string[];
  feedback: string | null;
  onToggleChoice: (choiceId: string) => void;
  onSubmit: () => void;
  onClose?: () => void;
  isMobileModal?: boolean;
}) {
  const getColorClasses = (index: number, isSelected: boolean) => {
    const base = [
      {
        normal: "bg-blue-500/20 border-blue-400 text-white",
        selected: "bg-blue-500 border-blue-300 text-white",
      },
      {
        normal: "bg-green-500/20 border-green-400 text-white",
        selected: "bg-green-500 border-green-300 text-black",
      },
      {
        normal: "bg-pink-500/20 border-pink-400 text-white",
        selected: "bg-pink-500 border-pink-300 text-white",
      },
      {
        normal: "bg-orange-500/20 border-orange-400 text-white",
        selected: "bg-orange-500 border-orange-300 text-black",
      },
    ];

    const color = base[index % base.length];
    return isSelected ? color.selected : color.normal;
  };
  return (
    <div className="flex h-full min-h-0 flex-col rounded-2xl bg-zinc-800 p-4 shadow-lg">
      <div className="flex shrink-0 items-start justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-400">Question en cours</p>
          <h2 className="mt-2 text-lg font-semibold leading-7 sm:text-xl">
            {question.text}
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            {question.multiple
              ? "Plusieurs réponses possibles"
              : "Une seule réponse possible"}
          </p>
        </div>

        {isMobileModal && onClose && (
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg bg-zinc-700 px-3 py-2 text-sm text-white"
          >
            Fermer
          </button>
        )}
      </div>

      {feedback && (
        <div className="mt-4 shrink-0 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm sm:text-base">
          {feedback}
        </div>
      )}

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="space-y-3">
          {question.choices.map((choice, index) => {
            const isSelected = selectedChoices.includes(choice.id);
            const colorClasses = getColorClasses(index, isSelected);

            return (
              <button
                key={choice.id}
                onClick={() => onToggleChoice(choice.id)}
                className={`w-full rounded-xl border p-4 text-left font-medium transition cursor-pointer hover:scale-[1.01] active:scale-[0.99] ${colorClasses}`}
              >
                <span className="flex items-center gap-2 text-sm sm:text-base">
                  {choice.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 shrink-0">
        <button
          onClick={onSubmit}
          disabled={selectedChoices.length === 0}
          className="w-full rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-zinc-600 disabled:text-zinc-300"
        >
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

  const [player] = useState<PlayerState>({
    name: playerName,
    profile: "house",
    score: 64,
    co2: 38,
    comfort: 72,
    insulation: 55,
  });

  const [question] = useState<Question>({
    id: "q1",
    text: "Quelle action permet de réduire durablement la consommation énergétique d’un logement ?",
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
      setSelectedChoices((prev) =>
        prev.includes(choiceId)
          ? prev.filter((id) => id !== choiceId)
          : [...prev, choiceId]
      );
    } else {
      setSelectedChoices([choiceId]);
    }
  };

  const handleSubmit = () => {
    if (selectedChoices.length === 0) return;

    const isGoodAnswer = selectedChoices.includes("b");

    setFeedback(
      isGoodAnswer
        ? "Bonne décision : tu réduis d’abord les pertes."
        : "Cette réponse n’est pas optimale pour atteindre une trajectoire durable."
    );

    console.log("submit_answer", {
      sessionId,
      answers: selectedChoices,
    });
  };

  return (
    <main className="min-h-screen bg-zinc-900 p-3 text-white sm:p-4">
      <div className="mx-auto max-w-7xl">
        {/* Mobile */}
        <div className="flex min-h-[calc(100vh-24px)] flex-col gap-4 lg:hidden">
          <section className="flex-1">
            <HousePanel player={player} />
          </section>

          <button
            onClick={() => setIsQuestionOpen(true)}
            className="rounded-2xl bg-emerald-500 px-4 py-4 text-base font-semibold text-black"
          >
            Répondre à la question
          </button>
        </div>

        {isQuestionOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 lg:hidden">
            <div className="flex h-full items-end">
              <div className="h-[92dvh] w-full rounded-t-3xl bg-zinc-900 p-3">
                <QuestionContent
                  question={question}
                  selectedChoices={selectedChoices}
                  feedback={feedback}
                  onToggleChoice={handleToggleChoice}
                  onSubmit={handleSubmit}
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
            <HousePanel player={player} />
          </section>

          <section className="min-h-0">
            <QuestionContent
              question={question}
              selectedChoices={selectedChoices}
              feedback={feedback}
              onToggleChoice={handleToggleChoice}
              onSubmit={handleSubmit}
            />
          </section>
        </div>
      </div>
    </main>
  );
}