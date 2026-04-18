export type JoinFailed = {
    message: string;
};

export type PlayerJoined = {
    username: string;
    profile: string;
    playerCount: number;
};

export type GameStarted = {
    durationMinutes: number;
    totalEvents: number;
    playerCount: number;
};

export type VillageUpdate = {
    username: string;
    profile: string;
    isGoodMove: boolean;
    globalCarbon: number;
    playerScore: number;
};

export type ActionFeedback = {
    actionId: string;
    isGoodMove: boolean;
    prerequisitesMet: boolean;
    newScore: number;
    educationalNote: string;
    hasNextEvent: boolean;
};

export type NewEvent = {
    id: string;
    title: string;
    description: string;
    eventNumber: number;
    totalEvents: number;
    actions: { id: string; label: string }[];
};

export type WaitingForOthers = {
    message: string;
    score: number;
};

export type TimerTick = {
    remaining: number;
    total: number;
};

export type Debrief = {
    totalScore: number;
    totalCarbon: number;
    goodMoves: number;
    badMoves: number;
    mistakes: {
        eventTitle: string;
        actionLabel: string;
        prerequisitesMet: boolean;
        educationalNote: string;
    }[];
};

export type GlobalDebrief = {
    reason: string;
    globalCarbon: number;
    leaderboard: {
        rank: number;
        username: string;
        profile: string;
        score: number;
    }[];
    statsByProfile: any;
};