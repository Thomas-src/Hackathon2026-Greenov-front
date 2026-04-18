import Link from "next/link";

export default function Home() {
  return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-900 text-white">
        <main className="flex flex-col items-center gap-10">

          <h1 className="text-4xl font-bold text-center">
            Jeux&#39;Rénov
          </h1>

          <p className="text-zinc-400 text-center max-w-md">
            Jeu interactif “Parcours Zéro implication - Zéro Émission” : comprendre, décider, transformer
          </p>

          <div className="flex flex-col gap-4 w-64">

            <Link href="/host">
              <button className="w-full bg-green-500 hover:bg-green-600 transition p-4 rounded-xl text-lg font-semibold">
                Créer une partie
              </button>
            </Link>

            <Link href="/join">
              <button className="w-full bg-blue-500 hover:bg-blue-600 transition p-4 rounded-xl text-lg font-semibold">
                Rejoindre une partie
              </button>
            </Link>

          </div>

        </main>
      </div>
  );
}