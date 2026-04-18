"use client";

import { useEffect, useState, useCallback } from "react";
import { quizSocket } from "@/back/WebSocket";
import { useWebSocket } from "@/app/providers/WebSocketProvider";

import type {
    PlayerJoined,
    GameStarted,
    NewEvent,
    WaitingForOthers,
    TimerTick,
    ActionFeedback,
    VillageUpdate,
    Debrief,
    GlobalDebrief,
} from "@/app/types/socket.t";

export function useQuiz(roomId?: string) {
    const { isConnected } = useWebSocket();

    // ─────────────────────────────
    // STATE GAME
    // ─────────────────────────────

    const [playersCount, setPlayersCount] = useState(0);

    const [currentEvent, setCurrentEvent] = useState<NewEvent | null>(null);
    const [waiting, setWaiting] = useState<WaitingForOthers | null>(null);

    const [timer, setTimer] = useState<TimerTick | null>(null);
    const [feedback, setFeedback] = useState<ActionFeedback | null>(null);

    const [village, setVillage] = useState<VillageUpdate | null>(null);

    const [debrief, setDebrief] = useState<Debrief | null>(null);
    const [globalDebrief, setGlobalDebrief] = useState<GlobalDebrief | null>(null);

    // ─────────────────────────────
    // ACTIONS
    // ─────────────────────────────

    const submitAction = useCallback(
        async (actionId: string) => {
            if (!roomId) return;
            await quizSocket.submitAction(roomId, actionId);
        },
        [roomId]
    );

    const joinRoom = useCallback(
        async (username: string, profile: string) => {
            if (!roomId) return;
            await quizSocket.joinRoom(roomId, username, profile);
        },
        [roomId]
    );

    const startGame = useCallback(async () => {
        if (!roomId) return;
        await quizSocket.startGame(roomId);
    }, [roomId]);

    const createRoom = useCallback(async (duration: number) => {
        if (!roomId) return;
        return await quizSocket.createRoom(duration);
    }, [roomId]);

    const forceEnd = useCallback(async () => {
        if (!roomId) return;
        await quizSocket.forceEnd(roomId);
    }, [roomId]);

    const getDebrief = useCallback(async () => {
        if (!roomId) return;
        await quizSocket.getDebrief(roomId);
    }, [roomId]);

    const getGlobalDebrief = useCallback(async () => {
        if (!roomId) return;
        await quizSocket.getGlobalDebrief(roomId);
    }, [roomId]);

    // ─────────────────────────────
    // EVENTS BINDING
    // ─────────────────────────────

    useEffect(() => {
        if (!isConnected) return;

        quizSocket.on<PlayerJoined>("PlayerJoined", (data) => {
            setPlayersCount(data.playerCount);
        });

        quizSocket.on<GameStarted>("GameStarted", () => {});

        quizSocket.on<NewEvent>("NewEvent", (data) => {
            setCurrentEvent(data);
            setWaiting(null);
        });

        quizSocket.on<WaitingForOthers>("WaitingForOthers", (data) => {
            setWaiting(data);
            setCurrentEvent(null);
        });

        quizSocket.on<TimerTick>("TimerTick", setTimer);

        quizSocket.on<ActionFeedback>("ActionFeedback", setFeedback);

        quizSocket.on<VillageUpdate>("VillageUpdate", setVillage);

        quizSocket.on<Debrief>("Debrief", setDebrief);

        quizSocket.on<GlobalDebrief>("GlobalDebrief", setGlobalDebrief);

        return () => {
            quizSocket.disconnect();
        };
    }, [isConnected]);

    // ─────────────────────────────
    // RETURN
    // ─────────────────────────────

    return {
        // state
        isConnected,
        playersCount,
        currentEvent,
        waiting,
        timer,
        feedback,
        village,
        debrief,
        globalDebrief,

        // actions
        joinRoom,
        submitAction,
        startGame,
        forceEnd,
        getDebrief,
        getGlobalDebrief,
        createRoom
    };
}