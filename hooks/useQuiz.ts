"use client";

import { useEffect, useState, useCallback } from "react";
import { quizSocket } from "@/back/WebSocket";
import { useWebSocket } from "@/app/providers/WebSocketProvider";
import { useGameState } from "@/app/providers/GameStateProvider";

import type {
    NewEvent,
    WaitingForOthers,
    ActionFeedback,
    VillageUpdate,
    PlayerDebrief,
    GlobalDebrief,
    GameStartedHost,
    RoomCreated,
    PlayerLeft,
} from "@/back/types/socket.t";

export function useQuiz(roomId?: string) {
    const { isConnected } = useWebSocket();
    const { playersCount, setPlayersCount, setPlayers, village, setVillage, timer, setTimer } = useGameState();

    // ─────────────────────────────
    // STATE
    // ─────────────────────────────

    const [currentEvent, setCurrentEvent]   = useState<NewEvent | null>(null);
    const [waiting, setWaiting]             = useState<WaitingForOthers | null>(null);
    const [feedback, setFeedback]           = useState<ActionFeedback | null>(null);
    const [debrief, setDebrief]             = useState<PlayerDebrief | null>(null);
    const [globalDebrief, setGlobalDebrief] = useState<GlobalDebrief | null>(null);
    const [gameStarted, setGameStarted]     = useState(false);
    const [globalCarbon, setGlobalCarbon]   = useState(0);

    // ─────────────────────────────
    // ACTIONS
    // ─────────────────────────────

    const createRoom = useCallback(async (durationMinutes: number): Promise<RoomCreated> => {
        return quizSocket.createRoom(durationMinutes);
    }, []);

    const joinRoom = useCallback(async (username: string, profile: string) => {
        if (!roomId) return;
        await quizSocket.joinRoom(roomId, username, profile);
    }, [roomId]);

    const startGame = useCallback(async () => {
        if (!roomId) return;
        await quizSocket.startGame(roomId);
    }, [roomId]);

    const forceEnd = useCallback(async () => {
        if (!roomId) return;
        await quizSocket.forceEnd(roomId);
    }, [roomId]);

    const submitAction = useCallback(async (actionId: string) => {
        console.log("[submitAction] roomId:", roomId, "actionId:", actionId);
        if (!roomId) return;
        await quizSocket.submitAction(roomId, actionId);
    }, [roomId]);

    const getMyDebrief = useCallback(async () => {
        if (!roomId) return;
        await quizSocket.getMyDebrief(roomId);
    }, [roomId]);

    // ─────────────────────────────
    // EVENTS BINDING
    // Enregistré au mount — pas besoin d'attendre isConnected.
    // Le socket dispatche dès qu'un event arrive, peu importe quand
    // le handler a été enregistré.
    // ─────────────────────────────

    useEffect(() => {
        quizSocket.on("PlayerJoined", (data) => {
            setPlayersCount(data.playerCount);
        });

        quizSocket.on("PlayerLeft", (data: PlayerLeft) => {
            setPlayersCount(data.playerCount);
            setPlayers((prev) => prev.filter((p) => p.username !== data.username));
        });

        quizSocket.on("JoinSuccess", (data) => {
            setPlayersCount(data.playerCount);
        });

        quizSocket.on("GameStartedHost", (data: GameStartedHost) => {
            setGameStarted(true);
            setGlobalCarbon(data.globalCarbon);
            setPlayers(data.players);
            setPlayersCount(data.players.length);
            const totalSeconds = data.endsAtUnix - Math.floor(Date.now() / 1000);
            setTimer({ remaining: totalSeconds, total: totalSeconds });
        });

        quizSocket.on("GameStartedPlayer", () => {
            setGameStarted(true);
        });

        quizSocket.on("NewEvent", (data: NewEvent) => {
            console.log("[NewEvent] received id:", data.id, "current:", currentEvent?.id);
            setCurrentEvent(data);
            setWaiting(null);
        });

        quizSocket.on("WaitingForOthers", (data: WaitingForOthers) => {
            setWaiting(data);
            setCurrentEvent(null);
        });

        quizSocket.on("TimerTick", setTimer);
        quizSocket.on("ActionFeedback", setFeedback);

        quizSocket.on("VillageUpdate", (data: VillageUpdate) => {
            setVillage(data);
            setGlobalCarbon(data.globalCarbon);
        });

        quizSocket.on("Debrief", setDebrief);
        quizSocket.on("GlobalDebrief", setGlobalDebrief);

        return () => {
            quizSocket.off("PlayerJoined");
            quizSocket.off("PlayerLeft");
            quizSocket.off("JoinSuccess");
            quizSocket.off("GameStartedHost");
            quizSocket.off("GameStartedPlayer");
            quizSocket.off("NewEvent");
            quizSocket.off("WaitingForOthers");
            quizSocket.off("TimerTick");
            quizSocket.off("ActionFeedback");
            quizSocket.off("VillageUpdate");
            quizSocket.off("Debrief");
            quizSocket.off("GlobalDebrief");
        };
    }, []);

    // ─────────────────────────────
    // RETURN
    // ─────────────────────────────

    return {
        isConnected,
        playersCount,
        currentEvent,
        waiting,
        timer,
        feedback,
        village,
        debrief,
        globalDebrief,
        gameStarted,
        globalCarbon,

        createRoom,
        joinRoom,
        startGame,
        forceEnd,
        submitAction,
        getMyDebrief,
    };
}