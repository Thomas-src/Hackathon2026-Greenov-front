"use client";

import { useEffect, useState, useCallback } from "react";
import { quizSocket } from "@/back/WebSocket";
import { useWebSocket } from "@/app/providers/WebSocketProvider";
import { useGameState } from "@/app/providers/GameStateProvider";

import type {
    PlayerJoined,
    GameStarted,
    NewEvent,
    WaitingForOthers,
    TimerTick,
    ActionFeedback,
    VillageUpdate,
    Debrief,
    GlobalDebrief, GameStartedHost, GameStartedPlayer,
} from "@/app/types/socket.t";
import {Player} from "@/back/domain/Player";

export function useQuiz(roomId?: string) {
    const { isConnected } = useWebSocket();
    const { playersCount, setPlayersCount, setPlayers, village, setVillage, timer, setTimer } = useGameState();

    // ─────────────────────────────
    // STATE GAME (local uniquement)
    // ─────────────────────────────

    const [currentEvent, setCurrentEvent] = useState<NewEvent | null>(null);
    const [waiting, setWaiting] = useState<WaitingForOthers | null>(null);
    const [feedback, setFeedback] = useState<ActionFeedback | null>(null);
    const [debrief, setDebrief] = useState<Debrief | null>(null);
    const [globalDebrief, setGlobalDebrief] = useState<GlobalDebrief | null>(null);
    const [gameStarted, setGameStarted] = useState(false);
    const [globalCarbon, setGlobalCarbon] = useState(0);

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
        return await quizSocket.createRoom(duration);
    }, []);

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

    const onPlayerJoined = (data: PlayerJoined) => {
        setPlayersCount(data.playerCount);
    };

    const onPlayerLeft = (data: { username: string; playerCount: number }) => {
        setPlayersCount(data.playerCount);

        setPlayers(prev =>
            prev.filter(p => p.username !== data.username)
        );
    };

    // ─────────────────────────────
    // EVENTS BINDING
    // ─────────────────────────────

    useEffect(() => {
        if (!isConnected) return;
        quizSocket.on<PlayerJoined>("JoinSuccess", onPlayerJoined);

        quizSocket.on<PlayerJoined>("PlayerJoined", onPlayerJoined);
        quizSocket.on<GameStartedHost>("GameStartedHost", (data) => {
            setGameStarted(true);

            setTimer({
                remaining: data.remaining,
                total: data.remaining,
            });
            setGlobalCarbon(data.carbon);

            if (data.players) {
                const players  = data.players.map((p) => ({
                    username: p.username,
                    profile: p.profile,
                    score: p.score,
                    co2: p.carbonLevel,
                }));

                setPlayers(players);
                setPlayersCount(players.length);
            }
        });

        quizSocket.on<GameStartedPlayer>("GameStartedPlayer", () => {
            setGameStarted(true);
        });
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
        quizSocket.on("PlayerLeft", onPlayerLeft);
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

        joinRoom,
        submitAction,
        startGame,
        forceEnd,
        getDebrief,
        getGlobalDebrief,
        createRoom,
    };
}