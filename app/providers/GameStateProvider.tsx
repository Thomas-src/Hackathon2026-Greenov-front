"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { VillageUpdate, TimerTick } from "@/app/types/socket.t";

type Player = {
    username: string;
    profile: string;
    score: number;
    co2: number;
};

type GameStateContextValue = {
    playersCount: number;
    setPlayersCount: (n: number) => void;
    players: Player[];
    updatePlayer: (v: VillageUpdate) => void;
    village: VillageUpdate | null;
    setVillage: (v: VillageUpdate) => void;
    timer: TimerTick | null;
    setTimer: (t: TimerTick) => void;
    setPlayers: (players: Player[]) => void;
};

const GameStateContext = createContext<GameStateContextValue | null>(null);

export function GameStateProvider({ children }: { children: ReactNode }) {
    const [playersCount, setPlayersCount] = useState(0);
    const [players, setPlayers] = useState<Player[]>([]);
    const [village, setVillage] = useState<VillageUpdate | null>(null);
    const [timer, setTimer] = useState<TimerTick | null>(null);

    const updatePlayer = useCallback((v: VillageUpdate) => {
        setVillage(v);
        setPlayers((prev) => {
            const updated: Player = {
                username: v.username,
                profile: v.profile,
                score: v.playerScore,
                co2: v.globalCarbon,
            };
            const exists = prev.find((p) => p.username === v.username);
            if (exists) {
                return prev.map((p) => p.username === v.username ? updated : p);
            }
            return [...prev, updated];
        });
    }, []);

    return (
        <GameStateContext.Provider value={{
            playersCount, setPlayersCount, setPlayers,
            players, updatePlayer,
            village, setVillage,
            timer, setTimer,
        }}>
            {children}
        </GameStateContext.Provider>
    );
}

export function useGameState() {
    const ctx = useContext(GameStateContext);
    if (!ctx) throw new Error("useGameState must be used inside GameStateProvider");
    return ctx;
}