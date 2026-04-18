"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

async function createSession(duration: number): Promise<{ sessionId: string }> {
    await new Promise((r) => setTimeout(r, 600))
    const sessionId = Math.random().toString(36).substring(2, 8).toUpperCase()
    return { sessionId }
}

export default function CreatePage() {
    const [duration, setDuration] = useState(10);
    const router = useRouter();

    const handleCreate = async () => {
        const data = await createSession(duration)
        router.push('/lobby/${data.sessionId}')
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-900 text-white">
            <div className="flex flex-col gap-6 w-80">

                <h1 className="text-2xl font-bold text-center">
                    Créer une partie
                </h1>

                <label htmlFor="time">Durée (min)</label>
                <input
                    id="time"
                    name="time"
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full p-3 rounded-lg text-white"
                    placeholder="Durée (minutes)"
                />

                <button
                    onClick={handleCreate}
                    disabled={duration <= 0}
                    className="w-full bg-blue-500 hover:bg-blue-600 p-3 rounded-lg disabled:opacity-50"
                >
                    Créer
                </button>

            </div>
        </div>
    )
}
