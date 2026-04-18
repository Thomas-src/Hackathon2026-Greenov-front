import Link from "next/link";

export default function Home() {
  return (
      <div className="flex min-h-screen items-center justify-center p-4" style={{ background: "var(--background)" }}>
        <main className="flex flex-col items-center gap-10">

          <div className="text-center">
            <h1 className="text-5xl font-black tracking-tight" style={{ color: "var(--green)" }}>
              Jeux'Rénov
            </h1>
            <p className="mt-3 text-sm max-w-md" style={{ color: "rgba(232,245,232,0.5)" }}>
              Jeu interactif "Parcours Zéro Implication - Zéro Émission" : comprendre, décider, transformer
            </p>
          </div>

          <div className="flex flex-col gap-4 w-72">
            <Link href="/create">
              <button className="cool-btn">Créer une partie</button>
            </Link>
            <Link href="/join">
              <button className="cool-btn" style={{ background: "var(--card)", color: "var(--green)", boxShadow: "0 4px 0 rgba(0,0,0,0.4)", border: "1px solid var(--border-strong)" }}>
                Rejoindre une partie
              </button>
            </Link>
          </div>

        </main>
      </div>
  );
}