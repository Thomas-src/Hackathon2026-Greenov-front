export type Profile = "proprietaire" | "locataire" | "entreprise";

// ── Room ──────────────────────────────────────────────────────────────────────

export interface RoomCreated {
    roomId: string;
    durationMinutes: number;
    totalEvents: number;
}

export interface JoinSuccess {
    username: string;
    profile: string;
    playerCount: number;
}

export interface JoinFailed {
    message: string;
}

export interface PlayerJoined {
    playerCount: number;
}

export interface PlayerLeft {
    username: string;
    playerCount: number;
}

// ── Game lifecycle ────────────────────────────────────────────────────────────

export interface PlayerSummary {
    connectionId: string;
    username: string;
    profile: Profile;
    score: number;
    carbone: number;
}

export interface GameStartedHost {
    endsAtUnix: number;
    players: PlayerSummary[];
    globalCarbon: number;
}

export interface GameStartedPlayer {
    houseState: number;
    carbon: number;
    profile: string;
}

export interface TimerTick {
    remaining: number;
    total: number;
}

export interface WaitingForOthers {
    message: string;
    score: number;
}

// ── Event ─────────────────────────────────────────────────────────────────────

export interface ActionChoice {
    id: string;
    label: string;
}

export interface NewEvent {
    id: string;
    title: string;
    type: string;
    description: string;
    eventNumber: number;
    totalEvents: number;
    actions: ActionChoice[];
}

// ── Action ────────────────────────────────────────────────────────────────────

export interface ActionFeedback {
    actionId: string;
    isGoodMove: boolean;
    prerequisitesMet: boolean;
    newScore: number;
    educationalNote: string;
    hasNextEvent: boolean;
}

export interface VillageUpdate {
    connectionId: string;
    username: string;
    profile: string;
    isGoodMove: boolean;
    globalCarbon: number;
    playerScore: number;
}

// ── Debrief ───────────────────────────────────────────────────────────────────

export interface Mistake {
    eventTitle: string;
    actionLabel: string;
    prerequisitesMet: boolean;
    educationalNote: string;
}

export interface PlayerDebrief {
    totalScore: number;
    totalCarbon: number;
    goodMoves: number;
    badMoves: number;
    mistakes: Mistake[];
}

export interface LeaderboardEntry {
    rank: number;
    username: string;
    profile: string;
    score: number;
}

export interface TopMistake {
    eventTitle: string;
    count: number;
    educationalNote: string;
}

export interface ProfileStats {
    profile: string;
    playerCount: number;
    avgScore: number;
    avgAccuracy: number;
    topMistakes: TopMistake[];
}

export interface GlobalDebrief {
    reason: "timeout" | "completed" | "forced";
    globalCarbon: number;
    leaderboard: LeaderboardEntry[];
    statsByProfile: ProfileStats[];
}

// ── Map des événements SignalR ─────────────────────────────────────────────────
// Permet d'utiliser connection.on<QuizHubEvents[K]>(K, handler) avec typage complet.

export interface QuizHubServerEvents {
    // Room
    RoomCreated: RoomCreated;
    JoinSuccess: JoinSuccess;
    JoinFailed: JoinFailed;
    PlayerJoined: PlayerJoined;
    PlayerLeft: PlayerLeft;
    // Game
    GameStartedHost: GameStartedHost;
    GameStartedPlayer: GameStartedPlayer;
    NewEvent: NewEvent;
    TimerTick: TimerTick;
    WaitingForOthers: WaitingForOthers;
    VillageUpdate: VillageUpdate;
    // Action
    ActionFeedback: ActionFeedback;
    // Debrief
    Debrief: PlayerDebrief;
    GlobalDebrief: GlobalDebrief;
}

// Helper pour enregistrer un handler fortement typé :
// typedOn(connection, "ActionFeedback", (data) => { data.newScore /* inféré */ })
export function typedOn<K extends keyof QuizHubServerEvents>(
    connection: { on(event: string, handler: (data: QuizHubServerEvents[K]) => void): void },
    event: K,
    handler: (data: QuizHubServerEvents[K]) => void
): void {
    connection.on(event, handler);
}