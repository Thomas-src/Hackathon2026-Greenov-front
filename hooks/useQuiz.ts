"use client";

import {useCallback, useEffect, useState} from "react";
import {quizSocket} from "@/back/WebSocket";
import {useWebSocket} from "@/app/providers/WebSocketProvider";
import {useGameState} from "@/app/providers/GameStateProvider";

import type {
    ActionFeedback,
    GameStartedHost,
    GlobalDebrief,
    NewEvent,
    PlayerDebrief,
    PlayerLeft,
    RoomCreated,
    VillageUpdate,
    WaitingForOthers,
} from "@/back/types/socket.t";

export function useQuiz(roomId?: string) {
    const {isConnected} = useWebSocket();
    const {playersCount, setPlayersCount, players, setPlayers, village, setVillage, timer, setTimer} = useGameState();
    const [IdRoom, setRoomId] = useState<string | null>(roomId == undefined ? null : roomId);

    // ─────────────────────────────
    // STATE
    // ─────────────────────────────

    const [currentEvent, setCurrentEvent] = useState<NewEvent | null>(null);
    const [waiting, setWaiting] = useState<WaitingForOthers | null>(null);
    const [feedback, setFeedback] = useState<ActionFeedback | null>(null);
    const [debrief, setDebrief] = useState<PlayerDebrief | null>(null);
    const [globalDebrief, setGlobalDebrief] = useState<GlobalDebrief | null>(null);
    const [gameStarted, setGameStarted] = useState(false);
    const [globalCarbon, setGlobalCarbon] = useState(0);

    // ─────────────────────────────
    // ACTIONS
    // ─────────────────────────────

    const createRoom = useCallback(async (durationMinutes: number): Promise<RoomCreated> => {
        const c = await quizSocket.createRoom(durationMinutes);
        setRoomId(c.roomId)
        return c;
    }, []);

    const joinRoom = useCallback(async (username: string, profile: string) => {
        if (!IdRoom) return;
        await quizSocket.joinRoom(IdRoom, username, profile);
    }, [IdRoom]);

    const startGame = useCallback(async () => {
        if (!IdRoom) return;
        await quizSocket.startGame(IdRoom);
    }, [IdRoom]);

    const forceEnd = useCallback(async () => {
        if (!IdRoom) return;
        await quizSocket.forceEnd(IdRoom);
    }, [IdRoom]);

    const submitAction = useCallback(async (actionId: string) => {
        console.log("[submitAction] IdRoom:", IdRoom, "actionId:", actionId);
        if (!IdRoom) return;
        await quizSocket.submitAction(IdRoom, actionId);
    }, [IdRoom]);

    const getMyDebrief = useCallback(async () => {
        if (!IdRoom) return;
        await quizSocket.getMyDebrief(IdRoom);
    }, [IdRoom]);

    // Timer
    useEffect(() => {
        const id = setInterval(() => {
            setTimer(prev => {
                if (!prev) return prev;

                return {
                    ...prev,
                    remaining: Math.max(0, prev.remaining - 1),
                };
            });
        }, 1000);

        return () => clearInterval(id);
    }, [setTimer]);

    // ─────────────────────────────
    // EVENTS BINDING
    // Enregistré au mount — pas besoin d'attendre isConnected.
    // Le socket dispatche dès qu'un event arrive, peu importe quand
    // le handler a été enregistré.
    // ─────────────────────────────

    useEffect(() => {
        if (!isConnected) return;

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

            const totalSeconds = Math.max(0, data.endsAtUnix - Math.floor(Date.now() / 1000));
            console.log("remaining:", totalSeconds, "seconds");

            setTimer({
                remaining: totalSeconds,
                total: totalSeconds,
            });
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

        // quizSocket.on("TimerTick", setTimer);

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
    }, [isConnected]); // PAS DE TABLEAU VIDE BANDE DE NEUILLES

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
        players,
        createRoom,
        joinRoom,
        startGame,
        forceEnd,
        submitAction,
        getMyDebrief,
    };
}