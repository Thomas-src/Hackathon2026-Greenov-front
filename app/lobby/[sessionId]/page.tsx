"use client"
import { useParams, useRouter } from "next/navigation"
import QRCode from "react-qr-code"
import {useWebSocket} from "@/app/providers/WebSocketProvider";
import {getBaseUrl} from "@/utils/constants"
export default function LobbyPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const router = useRouter()
    const { isConnected } = useWebSocket();
  const joinUrl = `${getBaseUrl()}/join?game=${sessionId}`

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-zinc-900">
      <a href={joinUrl} className="bg-white p-4 rounded-2xl">
        <QRCode value={joinUrl} size={500} />
      </a>
      <button
        onClick={() => router.push(`/game/${sessionId}`)}
        className="w-80 bg-blue-500 hover:bg-blue-600 p-3 rounded-lg text-white font-semibold"
      >
        Démarrer la partie
      </button>
        <div className="fixed bottom-4 right-4">
            <div
                className={`w-4 h-4 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
                title={isConnected ? "WebSocket connecté" : "WebSocket déconnecté"}
            />
        </div>
    </div>
  )
}
