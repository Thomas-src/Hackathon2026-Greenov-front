"use client"

import { createContext, useContext } from "react"
import { useQuiz } from "@/hooks/useQuiz"
import { useParams } from "next/navigation"

const QuizContext = createContext<ReturnType<typeof useQuiz> | null>(null)

export function QuizProvider({ children }: { children: React.ReactNode }) {
    const params = useParams<{ sessionId?: string; id?: string }>()
    const roomId = params.sessionId ?? params.id

    const quiz = useQuiz(roomId)

    console.log("ID IS " + roomId)

    return <QuizContext.Provider value={quiz}>{children}</QuizContext.Provider>
}

export function useQuizContext() {
    const ctx = useContext(QuizContext)
    if (!ctx) throw new Error("useQuizContext must be used inside QuizProvider")
    return ctx
}