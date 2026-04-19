"use client";

import React, {createContext, type ReactNode, useCallback, useContext, useState} from "react";
import type {PlayerSummary, Profile, TimerTick, VillageUpdate} from "@/back/types/socket.t";

type GameStateContextValue = {
    playersCount: number;
    setPlayersCount: (n: number) => void;
    players: PlayerSummary[];
    setPlayers: React.Dispatch<React.SetStateAction<PlayerSummary[]>>;
    updatePlayer: (v: VillageUpdate) => void;
    village: VillageUpdate | null;
    setVillage: (v: VillageUpdate) => void;
    timer: TimerTick | null;
    setTimer: React.Dispatch<React.SetStateAction<TimerTick | null>>
};

const GameStateContext = createContext<GameStateContextValue | null>(null);

export function GameStateProvider({children}: { children: ReactNode }) {
    const [playersCount, setPlayersCount] = useState(0);
    const [players, setPlayers] = useState<PlayerSummary[]>([]);
    const [village, setVillage] = useState<VillageUpdate | null>(null);
    const [timer, setTimer] = useState<TimerTick | null>(null);

    const updatePlayer = useCallback((v: VillageUpdate) => {
        setVillage(v);
        setPlayers((prev) => {
            const updated: PlayerSummary = {
                connectionId: prev.find((p) => p.username === v.username)?.connectionId ?? "",
                username: v.username,
                profile: v.profile as Profile,
                score: v.playerScore,
                carbone: v.globalCarbon
            };
            const exists = prev.some((p) => p.username === v.username);
            return exists
                ? prev.map((p) => p.username === v.username ? updated : p)
                : [...prev, updated];
        });
    }, []);

    return (
        <GameStateContext.Provider value={{
            playersCount, setPlayersCount,
            players, setPlayers, updatePlayer,
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