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
    PlayerLeft, PlayerSummary, TimerTick,
} from "@/back/types/socket.t";

export function useQuiz(roomId?: string) {
    const { isConnected } = useWebSocket();
    const { playersCount, setPlayersCount, players, setPlayers, village, setVillage, timer, setTimer } = useGameState();

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
        if (!roomId) return;
        await quizSocket.submitAction(roomId, actionId);
    }, [roomId]);

    const getMyDebrief = useCallback(async () => {
        if (!roomId) return;
        await quizSocket.getMyDebrief(roomId);
    }, [roomId]);

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

            const players: PlayerSummary[] = data.players.map((p) => ({
                connectionId: p.connectionId,
                username: p.username,
                profile: p.profile,
                score: p.score,
                carbone: p.carbone
            }));
            setPlayers(players);
            setPlayersCount(players.length);

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

        quizSocket.on("NewEvent", (data) => {
            setCurrentEvent(data);
            setWaiting(null);
        });

        quizSocket.on("WaitingForOthers", (data) => {
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
    }, [isConnected]);

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